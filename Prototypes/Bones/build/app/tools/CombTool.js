import CombStroke from "../strokes/CombStroke.js";
import {Tool} from "./Tool.js";
export default class Comb extends Tool {
  constructor(svg, buttonX, buttonY, page) {
    super(svg, buttonX, buttonY);
    this.page = page;
  }
  startStroke(point) {
    this.stroke = this.page.addStroke(new CombStroke(this.svg, [point]));
  }
  extendStroke(point) {
    if (this.stroke) {
      this.stroke.points.push(point);
      this.stroke.dirty = true;
    }
  }
  endStroke() {
    this.stroke = void 0;
  }
}
