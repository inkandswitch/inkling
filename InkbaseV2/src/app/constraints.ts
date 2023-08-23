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

// let lastGoodResult: any = null;

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

  const result = numeric.uncmin(vars => {
    let error = 0;
    for (const c of constraints) {
      const positions = c.handles.map(h => {
        const idx = handleIndex.get(h);
        return idx === undefined
          ? h.position
          : { x: vars[idx], y: vars[idx + 1] };
      });
      error += Math.abs(c.getError(positions));
    }
    return error;
  }, inputs);

  const outputs = result.solution;
  // let totalDisplacement = 0;
  for (const handle of handlesThatCanBeMoved) {
    const idx = handleIndex.get(handle)!;
    const pos = { x: outputs[idx], y: outputs[idx + 1] };
    // totalDisplacement += Vec.dist(handle.position, pos);
    handle.position = pos;
  }

  // Here's a more performant version of the loop above that
  // we can use if it turns out to be too slow:
  // handlesThatCanBeMoved.forEach((handle, idx) => {
  //   const posPtr = idx * 2;
  //   const pos = { x: outputs[posPtr], y: outputs[posPtr + 1] };
  //   totalDisplacement += Vec.dist(handle.position, pos);
  //   handle.position = pos;
  // });

  // console.log('totalDisplacement', totalDisplacement);
  // if (totalDisplacement > 50) {
  //   console.log('result', result);
  //   console.log('lastGoodResult', lastGoodResult);
  //   throw new Error('boom!');
  // } else {
  //   lastGoodResult = result;
  // }
}
