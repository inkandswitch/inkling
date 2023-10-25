import {Gesture} from "./Gesture.js";
import Stroke from "../ink/Stroke.js";
import {aMetaToggle} from "../gui/MetaToggle.js";
export function drawInk(ctx) {
  if (!ctx.metaToggle.active) {
    if (ctx.root.find({
      what: aMetaToggle,
      near: ctx.event.position,
      recursive: false,
      tooFar: 35
    })) {
      return;
    }
    const stroke = ctx.page.addStroke(new Stroke());
    return new Gesture("Draw Ink", {
      moved(ctx2) {
        stroke.points.push(ctx2.event.position);
      },
      ended(ctx2) {
        if (!ctx2.state.drag && ctx2.state.dragDist < 20) {
          stroke.remove();
        }
      }
    });
  }
}
