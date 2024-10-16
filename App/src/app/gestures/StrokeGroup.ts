import { aStrokeGroup } from "../ink/StrokeGroup"
import { EventContext, Gesture } from "../Gesture"
import MetaToggle from "../gui/MetaToggle"

export function strokeGroupRemoveHandles(ctx: EventContext): Gesture | void {
  if (MetaToggle.active) {
    const strokeGroup = ctx.root.find({
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
