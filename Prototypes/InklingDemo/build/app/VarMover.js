let moves = [];
function move(variable, finalValue, durationSeconds, easeFn = (t) => t) {
  moves = moves.filter((move2) => move2.variable.canonicalInstance !== variable.canonicalInstance);
  moves.push({
    variable,
    unlockWhenDone: !variable.isLocked,
    initialValue: variable.value,
    finalValue,
    durationSeconds,
    easeFn,
    initialTime: 0,
    done: false
  });
}
function update(dt, t) {
  for (const move2 of moves) {
    const {
      variable,
      unlockWhenDone,
      initialValue,
      finalValue,
      durationSeconds,
      easeFn,
      done
    } = move2;
    if (done) {
      if (unlockWhenDone) {
        variable.unlock();
      }
      moves.splice(moves.indexOf(move2), 1);
      continue;
    }
    if (move2.initialTime === 0) {
      move2.initialTime = t;
    }
    const t0 = move2.initialTime;
    const pct = Math.min((t - t0) / durationSeconds, 1);
    variable.lock(initialValue + (finalValue - initialValue) * easeFn(pct));
    if (pct === 1) {
      move2.done = true;
    }
  }
}
export default {
  move,
  update
};
