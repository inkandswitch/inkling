import {Gesture} from "./Gesture.js";
import {aCanonicalHandle} from "../ink/Handle.js";
import * as constraints from "../constraints.js";
import StrokeGroup from "../ink/StrokeGroup.js";
import Vec from "../../lib/vec.js";
import SVG from "../Svg.js";
import Config from "../Config.js";
export function touchHandle(ctx) {
  let handle = ctx.page.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: 40
  });
  if (handle) {
    if (ctx.pseudoCount >= 3 && handle.canonicalInstance.absorbedHandles.size > 0) {
      const handles = [...handle.canonicalInstance.absorbedHandles];
      handle = handle.breakOff(handles[handles.length - 1]);
    }
    return touchHandleHelper(handle);
  }
}
export function touchHandleHelper(handle) {
  let lastPos = Vec.clone(handle);
  let offset;
  return new Gesture("Touch Handle", {
    began(ctx) {
      offset = Vec.sub(handle.position, ctx.event.position);
      if (Config.gesture.lookAt) {
        lastPos = Vec.clone(handle);
      } else {
        constraints.finger(handle);
      }
    },
    moved(ctx) {
      handle.position = Vec.add(ctx.event.position, offset);
      if (Config.gesture.lookAt) {
        lastPos = Vec.clone(handle);
      } else {
        constraints.finger(handle);
      }
      if (ctx.pseudoCount === 2 && handle.parent instanceof StrokeGroup && handle.canonicalInstance.absorbedHandles.size === 0) {
        handle.parent.generatePointData();
      }
    },
    ended(ctx) {
      handle.getAbsorbedByNearestHandle();
      if (!Config.gesture.lookAt) {
        constraints.finger(handle).remove();
      }
      if (!ctx.state.drag && ctx.metaToggle.active) {
        handle.togglePin();
      }
    },
    render() {
      if (Config.gesture.lookAt) {
        const count = Math.pow(Vec.dist(handle.position, lastPos), 1 / 3);
        let c = count;
        while (--c > 0) {
          let v = Vec.sub(handle.position, lastPos);
          v = Vec.add(lastPos, Vec.mulS(v, c / count));
          SVG.now("circle", {
            cx: v.x,
            cy: v.y,
            r: 4,
            class: "desire"
          });
        }
      }
    }
  });
}
