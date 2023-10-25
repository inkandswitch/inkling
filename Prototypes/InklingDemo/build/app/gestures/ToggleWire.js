import {aWire} from "../meta/Wire.js";
import {Gesture} from "./Gesture.js";
export function toggleWire(ctx) {
  if (ctx.metaToggle.active) {
    const wire = ctx.page.find({
      what: aWire,
      near: ctx.event.position
    });
    if (wire) {
      return new Gesture("Toggle Wire", {
        ended(ctx2) {
          if (!ctx2.state.drag) {
            wire.togglePaused();
          }
        }
      });
    }
  }
}
