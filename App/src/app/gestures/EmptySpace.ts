import { EventContext, Gesture } from "../Gesture"
import Stroke from "../ink/Stroke"
import { createLinear } from "./effects/CreateLinear"
import { createGizmo } from "./effects/CreateGizmo"

export function emptySpaceDrawInk(ctx: EventContext): Gesture | void {
  if (!ctx.metaToggle.active) {
    const stroke = ctx.page.addStroke(new Stroke())

    return new Gesture("Draw Ink", {
      moved(ctx) {
        stroke.points.push(ctx.event.position)
      }
    })
  }
}

export function emptySpaceCreateGizmoOrLinear(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    return new Gesture("Create Gizmo or Linear", {
      dragged(ctx) {
        return createGizmo(ctx)
      },
      ended(ctx) {
        createLinear(ctx)
      }
    })
  }
}
