import { Variable } from './constraints';

interface Move {
  variable: Variable;
  wasLocked: boolean;
  initialValue: number;
  finalValue: number;
  durationSeconds: number;
  easeFn: (t: number) => number;
  initialTime: number;
}

const moves: Move[] = [];

export function move(
  variable: Variable,
  finalValue: number,
  durationSeconds: number,
  easeFn: (t: number) => number = t => t
) {
  moves.push({
    variable,
    wasLocked: variable.isLocked,
    initialValue: variable.value,
    finalValue,
    durationSeconds,
    easeFn,
    initialTime: 0,
  });
}

export function update(dt: number, t: number) {
  for (const move of moves) {
    if (move.initialTime === 0) {
      move.initialTime = t;
    }

    const {
      variable,
      wasLocked,
      initialValue,
      finalValue,
      durationSeconds,
      easeFn,
      initialTime,
    } = move;
    const pct = Math.min((t - initialTime) / durationSeconds, 1);
    variable.lock(initialValue + (finalValue - initialValue) * easeFn(pct));
    // console.log('moved to', variable.value);

    if (pct === 1) {
      // done with this move
      moves.splice(moves.indexOf(move, 1));
      if (!wasLocked) {
        variable.unlock();
      }
    }
  }
}
