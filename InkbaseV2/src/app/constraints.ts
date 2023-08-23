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
        const idx = handleIndex.get(h);
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
