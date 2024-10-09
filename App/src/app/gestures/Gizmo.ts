import { EventContext, Gesture } from "../Gesture"
import { aGizmo } from "../meta/Gizmo"
import { createWire } from "./effects/CreateWire"

const tapDist = 50
const wireDist = 30

export function gizmoCycleConstraints(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
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

export function gizmoCreateWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    // See comment above
    const gizmo = ctx.root.find({
      what: aGizmo,
      that: (g) => g.centerDistanceToPoint(ctx.event.position) < wireDist
    })

    if (gizmo) {
      return createWire(gizmo.wirePort, ctx)
    }
  }
}
