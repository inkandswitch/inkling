import { EventContext, Gesture } from "../Gesture"
import MetaToggle from "../gui/MetaToggle"
import { aGizmo } from "../meta/Gizmo"

const tapDist = 50

export function gizmoCycleConstraints(ctx: EventContext): Gesture | void {
  if (MetaToggle.active) {
    // TODO: We only want to perform this gesture on a tap near the center of the gizmo.
    // But for other gestures, we want to perform them when any part of the gizmo is touched.
    // The current GameObject.find() method doesn't seemingly allow for this sort of distinction,
    // where different find() calls need a different distanceToPoint() implementation.
    const gizmo = ctx.root.find({
      what: aGizmo,
      that: (g) => g.centerDistanceToPoint(ctx.event.position) < tapDist
    })

    if (gizmo) {
      return new Gesture("Cycle Constraints", {
        endedTap(ctx) {
          gizmo.cycleConstraints()
        }
      })
    }
  }
}
