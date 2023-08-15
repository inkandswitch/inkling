import Vec from "../lib/vec.js";
import ArcSegment from "./strokes/ArcSegment.js";
import LineSegment from "./strokes/LineSegment.js";
import FreehandStroke from "./strokes/FreehandStroke.js";
import Point from "./strokes/Point.js";
import ControlPoint from "./strokes/ControlPoint.js";
import StrokeGraph from "./strokes/StrokeGraph.js";
export default class Page {
  constructor(svg) {
    this.svg = svg;
    this.points = [];
    this.graph = new StrokeGraph();
    this.lineSegments = [];
    this.freehandStrokes = [];
  }
  addPoint(position) {
    const p = new Point(this.svg, position);
    this.points.push(p);
    return p;
  }
  addControlPoint(position, parent) {
    const p = new ControlPoint(this.svg, position, parent);
    this.points.push(p);
    return p;
  }
  addLineSegment(a, b) {
    const ls = new LineSegment(this.svg, a, b);
    this.lineSegments.push(ls);
    return ls;
  }
  addArcSegment(a, b, c) {
    const as = new ArcSegment(this.svg, a, b, c);
    this.lineSegments.push(as);
    return as;
  }
  addFreehandStroke(points) {
    const cp1 = this.addControlPoint(points[0]);
    const cp2 = this.addControlPoint(points[points.length - 1]);
    const s = new FreehandStroke(this.svg, points, cp1, cp2);
    cp1.parent = s;
    cp2.parent = s;
    this.freehandStrokes.push(s);
    this.graph.addStroke(s);
    return s;
  }
  findPointNear(position, dist = 20) {
    let closestPoint = null;
    let closestDistance = dist;
    for (const point of this.points) {
      const d = Vec.dist(point.position, position);
      if (d < closestDistance) {
        closestDistance = d;
        closestPoint = point;
      }
    }
    return closestPoint;
  }
  mergePoint(_point) {
    return;
  }
  pointsReachableFrom(startPoints) {
    const reachablePoints = new Set(startPoints);
    while (true) {
      const oldSize = reachablePoints.size;
      for (const ls of this.lineSegments) {
        if (reachablePoints.has(ls.a)) {
          reachablePoints.add(ls.b);
        }
        if (reachablePoints.has(ls.b)) {
          reachablePoints.add(ls.a);
        }
      }
      for (const s of this.freehandStrokes) {
        if (reachablePoints.has(s.controlPoints[0])) {
          reachablePoints.add(s.controlPoints[1]);
        }
        if (reachablePoints.has(s.controlPoints[1])) {
          reachablePoints.add(s.controlPoints[0]);
        }
      }
      if (reachablePoints.size === oldSize) {
        break;
      }
    }
    return reachablePoints;
  }
  render(svg) {
    this.lineSegments.forEach((ls) => ls.render(svg));
    this.freehandStrokes.forEach((s) => s.render());
    this.points.forEach((p) => p.render());
    this.graph.render(svg);
  }
}
