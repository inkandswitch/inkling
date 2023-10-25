import Stroke from "./Stroke.js";
import SVG from "../Svg.js";
export default class FormulaStroke extends Stroke {
  constructor() {
    super(...arguments);
    this.element = SVG.add("polyline", SVG.guiElm, {
      class: "formula stroke"
    });
  }
}
