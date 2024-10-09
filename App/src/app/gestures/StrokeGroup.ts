import { aStrokeGroup } from "../ink/StrokeGroup"
import { EventContext, Gesture } from "../Gesture"

export function strokeGroupRemoveHandles(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const strokeGroup = ctx.page.find({
      what: aStrokeGroup,
      near: ctx.event.position,
      tooFar: 20
    })

    if (strokeGroup) {
      return new Gesture("Remove Handles", {
        endedTap(ctx) {
          if (
            strokeGroup.a.canonicalInstance.absorbedHandles.size === 0 &&
            strokeGroup.b.canonicalInstance.absorbedHandles.size === 0
          ) {
            strokeGroup.breakApart()
          }
        }
      })
    }
  }
}
