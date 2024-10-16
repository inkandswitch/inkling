import { EventContext, Gesture } from "../Gesture"
import Stroke from "../ink/Stroke"
import { createLinear } from "./effects/CreateLinear"
import { createGizmo } from "./effects/CreateGizmo"
import { createLead } from "./effects/CreateLead"
import MetaToggle from "../gui/MetaToggle"

export function emptySpaceDrawInk(ctx: EventContext): Gesture | void {
  if (!MetaToggle.active) {
    const stroke = ctx.root.adopt(new Stroke())

    return new Gesture("Draw Ink", {
      dragged(ctx) {
        stroke.points.push(ctx.event.position)
      },
      endedTap(ctx) {
        createLead(ctx)
      }
    })
  }
}

export function emptySpaceCreateGizmoOrLinear(ctx: EventContext): Gesture | void {
  if (MetaToggle.active) {
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
