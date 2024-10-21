import { EventContext, Gesture } from "../Gesture"
import Vec from "../../lib/vec"
import Averager from "../../lib/Averager"
import { Root } from "../Root"

export function edgeSwipe(ctx: EventContext): Gesture | void {
  const leftEdge = ctx.event.position.x < 20
  const rightEdge = ctx.event.position.x > window.innerWidth - 20
  if (!(leftEdge || rightEdge)) return

  // Use this to make sure we only activate the pan when the user is actually pulling the page edge
  // toward the center of the screen, not (eg) swiping down from the top or out toward the edge.
  const desiredDir = leftEdge ? Vec(1, 0) : Vec(-1, 0)

  // We take the dot product of desiredDir and the actual dir, but it's noisy, so we smooth it
  const dirDotAverage = new Averager(10, Array(10).fill(0))

  let done = false
  let lastPos = ctx.event.position

  return new Gesture("Checking for Edge Swipe", {
    moved(ctx) {
      if (done) return

      const pos = ctx.event.position
      // Wait until we actually move far enough for it to count as a drag.
      // Then, check if the drag is in the desired direction.
      // If so, actually begin a pan. Otherwise, keep checking.
      if (Vec.equal(pos, lastPos)) return
      const draggingInDir = Vec.normalize(Vec.sub(pos, lastPos))
      lastPos = pos

      const dot = Vec.dot(desiredDir, draggingInDir)
      const smoothDot = dirDotAverage.add(dot)

      if (smoothDot > 0.5) {
        if (leftEdge && ctx.event.position.x > window.innerWidth / 2) {
          done = true
          return Root.prevPreset()
        }

        if (rightEdge && ctx.event.position.x < window.innerWidth / 2) {
          done = true
          return Root.nextPreset()
        }
      }
    }
  })
}
