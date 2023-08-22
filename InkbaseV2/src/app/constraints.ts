import numeric from 'numeric';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';
import Selection from './Selection';

export interface Constraint {
  readonly handles: Handle[];

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
    return Math.abs(Vec.dist(positions[0], positions[1]) - this.length);
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
        const idx = handleIndex.get(h.canonicalInstance);
        return idx === undefined
          ? h.position
          : { x: vars[idx], y: vars[idx + 1] };
      });
      error += Math.abs(c.getError(positions));
    }
    return error;
  }, inputs);
  const outputs = result.solution;
  // console.log(result);

  for (let idx = 0; idx < handlesThatCanBeMoved.length; idx++) {
    const handle = handles[idx];
    handle.position = { x: outputs[idx * 2], y: outputs[idx * 2 + 1] };
    // console.log('moved', handle.id, 'to', handle.position);
  }
}
