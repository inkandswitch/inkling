type UpdateFn = (dt: number, time: number) => void

export default function EveryFrame(update: UpdateFn) {
  let lastTime: number

  function frame(ms: number) {
    let time = ms / 1000
    let dt = lastTime - time
    lastTime = time

    update(dt, time)

    requestAnimationFrame(frame)
  }

  requestAnimationFrame((ms: number) => {
    lastTime = ms / 1000
    requestAnimationFrame(frame)
  })
}
