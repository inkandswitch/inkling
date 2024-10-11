import { Variable } from "./Constraints"

interface Move {
  variable: Variable
  unlockWhenDone: boolean
  initialValue: number
  finalValue: number
  durationSeconds: number
  easeFn: (t: number) => number
  initialTime: number
  done: boolean
}

let moves: Move[] = []

function move(
  variable: Variable,
  finalValue: number,
  durationSeconds: number,
  easeFn: (t: number) => number = (t) => t
) {
  // cancel any moves that are already in progress and affect this variable
  moves = moves.filter((move) => move.variable.canonicalInstance !== variable.canonicalInstance)

  moves.push({
    variable,
    unlockWhenDone: !variable.isLocked,
    initialValue: variable.value,
    finalValue,
    durationSeconds,
    easeFn,
    initialTime: 0,
    done: false
  })
}

function update(dt: number, t: number) {
  for (const move of moves) {
    const { variable, unlockWhenDone, initialValue, finalValue, durationSeconds, easeFn, done } = move

    if (done) {
      if (unlockWhenDone) {
        variable.unlock()
      }
      moves.splice(moves.indexOf(move), 1)
      continue
    }

    if (move.initialTime === 0) {
      move.initialTime = t
    }
    const t0 = move.initialTime

    const pct = Math.min((t - t0) / durationSeconds, 1)
    variable.lock(initialValue + (finalValue - initialValue) * easeFn(pct))

    if (pct === 1) {
      move.done = true
    }
  }
}

export default {
  move,
  update
}
