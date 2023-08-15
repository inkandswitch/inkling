import Vec from "../../lib/vec.js";
export default class StrokeGraph {
  constructor() {
    this.strokes = [];
    this.groups = [];
    this.connections = [];
    this.dirty = false;
    this.elements = [];
  }
  addStroke(stroke) {
    for (const otherStroke of this.strokes) {
      const closestPoint = closestPointsBetweenStrokes(stroke.points, otherStroke.points);
      if (closestPoint.dist < 20) {
        const midPoint = Vec.mulS(Vec.add(stroke.points[closestPoint.indexA], otherStroke.points[closestPoint.indexB]), 0.5);
        const dirA = getDirectionAtStrokePoint(stroke.points, closestPoint.indexA);
        const dirB = getDirectionAtStrokePoint(otherStroke.points, closestPoint.indexB);
        const alignment = Math.abs(Vec.cross(dirA, dirB));
        const aligned = alignment < 0.3;
        this.connections.push({
          position: midPoint,
          strokes: [stroke, otherStroke],
          indexes: [closestPoint.indexA, closestPoint.indexB],
          aligned
        });
      }
    }
    this.strokes.push(stroke);
    this.dirty = true;
  }
  render(svg) {
    return;
    if (!this.dirty) {
      return;
    }
    for (const elem of this.elements) {
      elem.remove();
    }
    this.elements = this.connections.map((c) => {
      return svg.addElement("circle", {
        cx: c.position.x,
        cy: c.position.y,
        r: 3,
        fill: c.aligned ? "pink" : "green"
      });
    });
    this.dirty = false;
  }
}
function closestPointsBetweenStrokes(strokeA, strokeB) {
  let minDist = Vec.dist(strokeA[0], strokeB[0]);
  let indexA = 0;
  let indexB = 0;
  for (let i = 0; i < strokeA.length; i++) {
    for (let j = 0; j < strokeB.length; j++) {
      if (strokeA[i] == null || strokeB[j] == null)
        continue;
      const dist = Vec.dist(strokeA[i], strokeB[j]);
      if (dist < minDist) {
        minDist = dist;
        indexA = i;
        indexB = j;
      }
    }
  }
  return {dist: minDist, indexA, indexB};
}
function getDirectionAtStrokePoint(stroke, index) {
  let backwardIndex = index - 10;
  if (backwardIndex < 0) {
    backwardIndex = 0;
  }
  let forwardIndex = index + 10;
  if (forwardIndex > stroke.length - 1) {
    forwardIndex = stroke.length - 1;
  }
  return Vec.normalize(Vec.sub(stroke[backwardIndex], stroke[forwardIndex]));
}
