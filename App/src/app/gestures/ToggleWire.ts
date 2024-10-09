import { aWire } from "../meta/Wire"
import { EventContext, Gesture } from "../Gesture"

export function wireTogglePaused(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const wire = ctx.page.find({
      what: aWire,
      near: ctx.event.position
    })

    if (wire) {
      return new Gesture("Toggle Paused", {
        endedTap(ctx) {
          wire.togglePaused()
        }
      })
    }
  }
}
