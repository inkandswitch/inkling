import {aStroke} from "../ink/Stroke.js";
import {aStrokeGroup} from "../ink/StrokeGroup.js";
import {Gesture} from "./Gesture.js";
export function toggleHandles(ctx) {
  if (ctx.metaToggle.active) {
    const strokeGroup = ctx.page.find({
      what: aStrokeGroup,
      near: ctx.event.position
    });
    if (strokeGroup) {
      return new Gesture("Remove Handles", {
        ended(ctx2) {
          if (!ctx2.state.drag && strokeGroup.a.canonicalInstance.absorbedHandles.size === 0 && strokeGroup.b.canonicalInstance.absorbedHandles.size === 0) {
            strokeGroup.breakApart();
          }
        }
      });
    }
    const stroke = ctx.page.find({
      what: aStroke,
      near: ctx.event.position
    });
    if (stroke) {
      return new Gesture("Add Handles", {
        ended(ctx2) {
          if (!ctx2.state.drag) {
            stroke.becomeGroup();
          }
        }
      });
    }
  }
}
