type UpdateFn = (dt: number, time: number) => void;

export default function EveryFrame(update: UpdateFn) {
  let lastTime: number;

  function frame(ms: number) {
    const time = ms / 1000;
    const dt = lastTime - time;
    lastTime = time;

    update(dt, time);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame((ms) => {
    lastTime = ms / 1000;
    requestAnimationFrame(frame);
  });
}
