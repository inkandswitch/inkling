import Vec from "../../lib/vec.js";
import {updateSvgElement} from "../Svg.js";
import generateId from "../generateId.js";
import Stroke from "./Stroke.js";
export default class CombStroke extends Stroke {
  constructor(svg, points) {
    super(svg, points);
    this.id = generateId();
    this.dirty = true;
    this.element = svg.addElement("polyline", {
      stroke: "black",
      "stroke-width": 2
    });
    this.comb = svg.addElement("polyline", {
      stroke: "red",
      "stroke-opacity": 0.1
    });
  }
  updatePath() {
    updateSvgElement(this.element, {
      points: toPath(this.points)
    });
    updateSvgElement(this.comb, {
      points: toPath(this.points.map((p, i) => {
        const x = Math.cos(p.azimuth) * 50 * (1.5 - p.altitude) + Math.random() - Math.random();
        const y = Math.sin(p.azimuth) * 50 * (1.5 - p.altitude) + Math.random() - Math.random();
        return [p, Vec.add(p, Vec(x, y)), p];
      }).flat())
    });
  }
  render() {
    this.updatePath();
    this.dirty = false;
  }
}
function toPath(points) {
  return points.map((p) => [p.x, p.y]).flat().join(" ");
}
