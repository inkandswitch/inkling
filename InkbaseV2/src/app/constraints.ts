import numeric from 'numeric';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';

export interface Constraint {
  readonly handles: Handle[];
  getError(positions: Position[]): number;
}

export class LengthConstraint implements Constraint {
  readonly handles: Handle[];
  private readonly length2: number;

  constructor(a: Handle, b: Handle) {
    this.handles = [a, b];
    this.length2 = Vec.dist2(a.position, b.position);
  }

  getError(positions: Position[]): number {
    return Math.abs(Vec.dist2(positions[0], positions[1]) - this.length2);
  }
}

const constraints: Constraint[] = [];

export function runConstraintSolver() {
  const handles = Array.from(Handle.all);

  if (handles.length >= 2 && constraints.length === 0) {
    console.log('111');
    constraints.push(new LengthConstraint(handles[0], handles[1]));
  }

  if (handles.length >= 4 && constraints.length === 1) {
    console.log('222');
    constraints.push(new LengthConstraint(handles[2], handles[3]));
  }

  const inputs: number[] = [];
  const handleIndex = new Map<Handle, number>();
  for (const h of handles) {
    handleIndex.set(h, inputs.length);
    const { x, y } = h.position;
    inputs.push(x, y);
  }

  const result = numeric.uncmin((vars: number[]) => {
    let error = 0;
    for (const c of constraints) {
      const positions = c.handles.map(h => {
        const idx = handleIndex.get(h.canonicalInstance)!;
        return { x: vars[idx], y: vars[idx + 1] };
      });
      // error += Math.pow(c.getError(positions), 2);
      error += c.getError(positions);
    }
    return error;
  }, inputs);
  const outputs = result.solution;
  // console.log(result);
  // console.log('inputs', inputs, 'outputs', outputs);

  for (let idx = 0; idx < handles.length; idx++) {
    const handle = handles[idx];
    handle.position = { x: outputs[idx * 2], y: outputs[idx * 2 + 1] };
    console.log('moved', handle.id, 'to', handle.position);
  }
}
