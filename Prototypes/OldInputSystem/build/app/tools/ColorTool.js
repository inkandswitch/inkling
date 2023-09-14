import Vec from "../../lib/vec.js";
import Tool from "./Tool.js";
import ColorStroke from "../strokes/ColorStroke.js";
export default class ColorTool extends Tool {
  constructor(label, buttonX, buttonY, page) {
    super(label, buttonX, buttonY, page, ColorStroke);
  }
  startStroke(point) {
    super.startStroke(point);
    this.last = point;
  }
  extendStroke(point) {
    if (this.last && Vec.dist(this.last, point) > 50) {
      super.extendStroke(point);
      this.last = point;
    }
  }
}
