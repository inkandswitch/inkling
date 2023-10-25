import {aStroke} from "./Stroke.js";
import Handle from "./Handle.js";
import TransformationMatrix from "../../lib/TransformationMatrix.js";
import {farthestPair} from "../../lib/helpers.js";
import {GameObject} from "../GameObject.js";
export default class StrokeGroup extends GameObject {
  constructor(strokes) {
    super();
    for (const stroke of strokes) {
      this.adopt(stroke);
    }
    const points = this.strokes.flatMap((stroke) => stroke.points);
    [this.a, this.b] = farthestPair(points).map((pos) => this.adopt(Handle.create(pos)));
    this.pointData = this.generatePointData();
  }
  generatePointData() {
    const transform = TransformationMatrix.fromLine(this.a.position, this.b.position).inverse();
    this.pointData = this.strokes.map((stroke) => stroke.points.map((p) => transform.transformPoint(p)));
    return this.pointData;
  }
  get strokes() {
    return this.findAll({what: aStroke, recursive: false});
  }
  updatePaths() {
    const transform = TransformationMatrix.fromLine(this.a.position, this.b.position);
    for (const [i, stroke] of this.strokes.entries()) {
      const newPoints = this.pointData[i].map((p) => transform.transformPoint(p));
      stroke.updatePath(newPoints);
    }
  }
  distanceToPoint(pos) {
    let minDistance = null;
    for (const stroke of this.strokes) {
      const dist = stroke.distanceToPoint(pos);
      if (dist === null) {
        continue;
      } else if (minDistance === null) {
        minDistance = dist;
      } else {
        minDistance = Math.min(minDistance, dist);
      }
    }
    return minDistance;
  }
  render(dt, t) {
    this.updatePaths();
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
  breakApart() {
    if (!this.parent) {
      throw new Error("You can't break apart a parent-less StrokeGroup");
    }
    let stroke;
    while (stroke = this.strokes.pop()) {
      this.parent.adopt(stroke);
    }
    this.remove();
  }
  remove() {
    this.a.remove();
    this.b.remove();
    for (const s of this.strokes) {
      s.remove();
    }
    super.remove();
  }
}
export const aStrokeGroup = (gameObj) => gameObj instanceof StrokeGroup ? gameObj : null;
