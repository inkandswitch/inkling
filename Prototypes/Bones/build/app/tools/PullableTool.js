import Vec from "../../lib/vec.js";
import PullableStroke from "../strokes/PullableStroke.js";
import {Tool} from "./Tool.js";
export default class Pull extends Tool {
  constructor(svg, buttonX, buttonY, page) {
    super(svg, buttonX, buttonY);
    this.page = page;
  }
  startStroke(point) {
    this.point = this.page.findPointNear(point);
    if (this.point) {
      this.stroke = this.point.stroke;
    } else {
      const start = this.page.addPoint(point);
      const end = this.page.addPoint(point);
      this.point = end;
      this.stroke = new PullableStroke(this.svg, start, end, [point]);
      this.page.addStroke(this.stroke);
    }
  }
  extendStroke(point) {
    if (!this.stroke)
      return;
    if (!this.point)
      return;
    if (Vec.dist(point, this.point.position) < 1)
      return;
    if (this.point == this.stroke.end) {
      this.stroke.points.push(point);
      if (this.stroke.finished)
        this.stroke.points.shift();
    } else {
      this.stroke.points.unshift(point);
      if (this.stroke.finished)
        this.stroke.points.pop();
    }
    this.stroke.dirty = true;
  }
  endStroke() {
    if (!this.stroke)
      return;
    this.stroke.finished = true;
    this.stroke = void 0;
    this.point = void 0;
  }
}
