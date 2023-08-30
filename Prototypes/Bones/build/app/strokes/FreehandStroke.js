import {updateSvgElement} from "../Svg.js";
import generateId from "../generateId.js";
import Stroke from "./Stroke.js";
export const strokeSvgProperties = {
  stroke: "rgba(200, 140, 0, 1)",
  fill: "none",
  "stroke-width": 2
};
export default class FreehandStroke extends Stroke {
  constructor(svg, points) {
    super(svg, points);
    this.id = generateId();
    this.dirty = true;
    this.element = svg.addElement("polyline", {
      points: toPath(points),
      ...strokeSvgProperties
    });
  }
  render() {
    if (!this.dirty) {
      return;
    }
    updateSvgElement(this.element, {points: toPath(this.points)});
    this.dirty = false;
  }
}
function toPath(points) {
  return points.map((p) => [p.x, p.y]).flat().join(" ");
}
