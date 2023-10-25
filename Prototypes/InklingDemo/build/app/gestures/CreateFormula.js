import {Gesture} from "./Gesture.js";
import Formula from "../meta/Formula.js";
export function createFormula(ctx) {
  if (ctx.metaToggle.active) {
    return new Gesture("Create Formula", {
      ended(ctx2) {
        if (!ctx2.state.drag) {
          Formula.createFromContext(ctx2);
        }
      }
    });
  }
}
