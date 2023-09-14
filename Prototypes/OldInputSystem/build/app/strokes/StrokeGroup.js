import Handle from "./Handle.js";
import TransformationMatrix from "../../lib/TransformationMatrix.js";
import {farthestPair} from "../../lib/helpers.js";
export default class StrokeGroup {
  constructor(strokes) {
    this.skeleton = [];
    this.dirty = false;
    this.svgElements = [];
    for (const stroke of strokes) {
      if (stroke.group) {
        throw new Error("a freehand stroke cannot be in more than one group");
      }
      stroke.group = this;
    }
    this.strokes = Array.from(strokes);
    const points = this.strokes.flatMap((stroke) => stroke.points);
    [this.a, this.b] = farthestPair(points).map((pos) => Handle.create("informal", pos, this));
    const transform = TransformationMatrix.fromLine(this.a.position, this.b.position).inverse();
    this.pointData = this.strokes.map((stroke) => stroke.points.map((p) => transform.transformPoint(p)));
  }
  onHandleMoved() {
    this.updatePaths();
  }
  updatePaths() {
    const transform = TransformationMatrix.fromLine(this.a.position, this.b.position);
    for (const [i, stroke] of this.strokes.entries()) {
      const newPoints = this.pointData[i].map((p) => transform.transformPoint(p));
      stroke.updatePath(newPoints);
    }
  }
  minDistanceFrom(pos) {
    let minDistance = Infinity;
    for (const stroke of this.strokes) {
      minDistance = Math.min(minDistance, stroke.minDistanceFrom(pos));
    }
    return minDistance;
  }
  generateSkeleton() {
  }
  render() {
  }
  remove() {
    for (const elem of this.svgElements) {
      elem.remove();
    }
  }
}
