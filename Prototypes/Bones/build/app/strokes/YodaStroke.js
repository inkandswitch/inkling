import SVG from "../Svg.js";
import generateId from "../generateId.js";
import Stroke from "./Stroke.js";
export default class PullableStroke extends Stroke {
  constructor(svg, start, end, points) {
    super(svg, points);
    this.start = start;
    this.end = end;
    this.id = generateId();
    this.dirty = true;
    this.finished = false;
    this.age = 0;
    this.deadPoints = [];
    start.stroke = this;
    end.stroke = this;
    this.element = SVG.add("polyline", {
      stroke: "black",
      "stroke-width": 2
    });
  }
  updatePoints() {
    this.start.setPosition(this.points[0].position);
    this.end.setPosition(this.points[this.points.length - 1].position);
  }
  render() {
    this.dirty = false;
    SVG.update(this.element, {points: SVG.points(this.points)});
  }
}
