import {updateSvgElement} from "../Svg.js";
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
    start.stroke = this;
    end.stroke = this;
    this.element = svg.addElement("polyline", {
      stroke: "black",
      "stroke-width": 2
    });
  }
  updatePath() {
    this.start.setPosition(this.points[0].position);
    this.end.setPosition(this.points[this.points.length - 1].position);
    updateSvgElement(this.element, {points: toPath(this.points)});
  }
  render() {
    this.updatePath();
    this.dirty = false;
  }
}
function toPath(points) {
  return points.map((p) => [p.x, p.y]).flat().join(" ");
}
