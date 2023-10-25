import {Gesture} from "./Gesture.js";
import {aGizmo} from "../meta/Gizmo.js";
export function touchGizmo(ctx) {
  if (ctx.metaToggle.active) {
    const gizmo = ctx.root.find({
      what: aGizmo,
      that: (g) => g.centerDistanceToPoint(ctx.event.position) < 50
    });
    if (gizmo) {
      return new Gesture("Touch Gizmo", {
        ended(ctx2) {
          gizmo.cycleConstraints();
        }
      });
    }
  }
}
