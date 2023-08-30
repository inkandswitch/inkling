export default function EveryFrame(update) {
  let lastTime;
  function frame(ms) {
    const time = ms / 1e3;
    const dt = lastTime - time;
    lastTime = time;
    update(dt, time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((ms) => {
    lastTime = ms / 1e3;
    requestAnimationFrame(frame);
  });
}
