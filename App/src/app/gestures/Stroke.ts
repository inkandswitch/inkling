import { aStroke } from "../ink/Stroke"
import { EventContext, Gesture } from "../Gesture"
import MetaToggle from "../gui/MetaToggle"

export function strokeAddHandles(ctx: EventContext): Gesture | void {
  if (MetaToggle.active) {
    const stroke = ctx.root.find({
      what: aStroke,
      near: ctx.event.position,
      tooFar: 50
    })

    if (stroke) {
      return new Gesture("Add Handles", {
        endedTap(ctx) {
          stroke.becomeGroup()
        }
      })
    }
  }
}
