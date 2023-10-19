import { Variable } from './constraints';

interface Move {
  variable: Variable;
  unlockWhenDone: boolean;
  initialValue: number;
  finalValue: number;
  durationSeconds: number;
  easeFn: (t: number) => number;
  initialTime: number;
  done: boolean;
}

const moves: Move[] = [];

function move(
  variable: Variable,
  finalValue: number,
  durationSeconds: number,
  easeFn: (t: number) => number = t => t
) {
  moves.push({
    variable,
    unlockWhenDone: !variable.isLocked,
    initialValue: variable.value,
    finalValue,
    durationSeconds,
    easeFn,
    initialTime: 0,
    done: false,
  });
}

function update(dt: number, t: number) {
  for (const move of moves) {
    const {
      variable,
      unlockWhenDone,
      initialValue,
      finalValue,
      durationSeconds,
      easeFn,
      initialTime,
      done,
    } = move;

    if (done) {
      if (unlockWhenDone) {
        variable.unlock();
      }
      moves.splice(moves.indexOf(move), 1);
      continue;
    }

    if (initialTime === 0) {
      move.initialTime = t;
    }

    const pct = Math.min((t - initialTime) / durationSeconds, 1);
    variable.lock(initialValue + (finalValue - initialValue) * easeFn(pct));

    if (pct === 1) {
      move.done = true;
    }
  }
}

export default {
  move,
  update,
};
