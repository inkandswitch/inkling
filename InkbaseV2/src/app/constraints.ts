import numeric from 'numeric';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';
import Selection from './Selection';

export interface Constraint {
  handles: Handle[];

  /** Returns the current error for this constraint. (OK if it's negative.) */
  getError(positions: Position[]): number;
}

function involves(constraint: Constraint, handle: Handle): boolean {
  return constraint.handles.some(
    cHandle => cHandle.canonicalInstance === handle.canonicalInstance
  );
}

export class LengthConstraint implements Constraint {
  readonly handles: Handle[];
  private readonly length: number;

  constructor(a: Handle, b: Handle) {
    this.handles = [a, b];
    this.length = Vec.dist(a.position, b.position);
  }

  getError(positions: Position[]): number {
    return Vec.dist(positions[0], positions[1]) - this.length;
  }
}

export class AngleConstraint implements Constraint {
  readonly handles: Handle[];
  private readonly angle: number;

  constructor(a1: Handle, a2: Handle, b1: Handle, b2: Handle) {
    this.handles = [a1, a2, b1, b2];
    this.angle = this.computeAngle(
      a1.position,
      a2.position,
      b1.position,
      b2.position
    );
  }

  getError(positions: Position[]): number {
    const [a1, a2, b1, b2] = positions;
    return this.computeAngle(a1, a2, b1, b2) - this.angle;
  }

  computeAngle(
    a1Pos: Position,
    a2Pos: Position,
    b1Pos: Position,
    b2Pos: Position
  ) {
    return Vec.angleBetweenClockwise(
      Vec.sub(a2Pos, a1Pos),
      Vec.sub(b2Pos, b1Pos)
    );
  }
}

const constraints: Constraint[] = [];

export function runConstraintSolver(selection: Selection) {
  const handles = Array.from(Handle.all);

  // add a couple of constraints, if we don't have some already
  const unconstrainedHandles = handles.filter(
    handle => !constraints.some(constraint => involves(constraint, handle))
  );
  while (constraints.length < 2 && unconstrainedHandles.length >= 2) {
    constraints.push(
      new LengthConstraint(
        unconstrainedHandles.pop()!,
        unconstrainedHandles.pop()!
      )
    );
  }
  if (constraints.length === 2) {
    const lc1 = constraints[0] as LengthConstraint;
    const lc2 = constraints[1] as LengthConstraint;
    constraints.push(
      new AngleConstraint(
        lc1.handles[0],
        lc1.handles[1],
        lc2.handles[0],
        lc2.handles[1]
      )
    );
  }

  const handlesThatCanBeMoved = handles.filter(
    handle => !selection.includes(handle)
  );

  if (constraints.length === 0 || handlesThatCanBeMoved.length === 0) {
    return;
  }

  const inputs: number[] = [];
  const handleIndex = new Map<Handle, number>();
  for (const h of handlesThatCanBeMoved) {
    handleIndex.set(h, inputs.length);
    const { x, y } = h.position;
    inputs.push(x, y);
  }

  const result = numeric.uncmin((vars: number[]) => {
    let error = 0;
    for (const c of constraints) {
      const positions = c.handles.map(h => {
        const idx = handleIndex.get(h.canonicalInstance);
        return idx === undefined
          ? h.position
          : { x: vars[idx], y: vars[idx + 1] };
      });
      error += Math.pow(c.getError(positions), 2);
    }
    return error;
  }, inputs);

  const outputs = result.solution;
  for (const handle of handlesThatCanBeMoved) {
    const idx = handleIndex.get(handle)!;
    const pos = { x: outputs[idx], y: outputs[idx + 1] };
    handle.position = pos;
  }

  // Here's a more performant version of the loop above that
  // we can use if it turns out to be too slow:
  // handlesThatCanBeMoved.forEach((handle, idx) => {
  //   const posPtr = idx * 2;
  //   const pos = { x: outputs[posPtr], y: outputs[posPtr + 1] };
  //   handle.position = pos;
  // });
}
