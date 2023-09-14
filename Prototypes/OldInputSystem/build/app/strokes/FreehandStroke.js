import {generateId} from "../../lib/helpers.js";
import Vec from "../../lib/vec.js";
import Stroke from "./Stroke.js";
import SVG from "../Svg.js";
export default class FreehandStroke extends Stroke {
  constructor(points) {
    super(points);
    this.id = generateId();
    this.selected = false;
    this.group = null;
    this.highlight = SVG.add("polyline", {
      fill: "none",
      stroke: "rgba(255, 255, 0, 0.25)",
      "stroke-width": 12,
      visibility: "hidden"
    });
    SVG.update(this.element, {stroke: "rgba(0, 0, 0, .5)"});
  }
  updatePath(newPoints) {
    this.points = newPoints;
  }
  select() {
    this.selected = true;
  }
  deselect() {
    this.selected = false;
  }
  render() {
    super.render();
    SVG.update(this.highlight, {
      points: this.element.getAttribute("points"),
      visibility: this.selected ? "visible" : "hidden"
    });
  }
  getLocalDirection(index) {
    const a = this.points[Math.max(index - 10, 0)];
    const b = this.points[Math.min(index + 10, this.points.length - 1)];
    return Vec.normalize(Vec.sub(b, a));
  }
  distanceBetweenPoints(a, b) {
    let dist = 0;
    for (let i = a; i < b - 1; i++) {
      const pointA = this.points[i];
      const pointB = this.points[i + 1];
      dist += Vec.dist(pointA, pointB);
    }
    return dist;
  }
  minDistanceFrom(pos) {
    let minDistance = Infinity;
    for (const point of this.points) {
      minDistance = Math.min(minDistance, Vec.dist(point, pos));
    }
    return minDistance;
  }
}
