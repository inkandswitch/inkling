import {Gesture} from "./Gesture.js";
import {rand} from "../../lib/math.js";
import SVG from "../Svg.js";
import {aGameObject} from "../GameObject.js";
import Stroke from "../ink/Stroke.js";
import StrokeGroup from "../ink/StrokeGroup.js";
export function erase(ctx) {
  if (ctx.pseudoCount === 2) {
    return new Gesture("Erase", {
      moved(ctx2) {
        spawn(ctx2.event.position);
        const gos = ctx2.root.findAll({
          what: ctx2.metaToggle.active ? aGameObject : aStrokeOrGroup,
          near: ctx2.event.position,
          tooFar: 10
        });
        for (const go of gos) {
          go.hp--;
          if (go.hp <= 0) {
            go.remove();
          }
        }
      }
    });
  }
}
function spawn(p) {
  const elm = SVG.add("g", SVG.guiElm, {
    class: "eraser",
    transform: `${SVG.positionToTransform(p)} rotate(${rand(0, 360)}) `
  });
  SVG.add("line", elm, {y2: 6});
  elm.onanimationend = () => elm.remove();
}
export const aStrokeOrGroup = (gameObj) => gameObj instanceof StrokeGroup || gameObj instanceof Stroke ? gameObj : null;
