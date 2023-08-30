import Vec from "../lib/vec.js";
import ArcSegment from "./strokes/ArcSegment.js";
import LineSegment from "./strokes/LineSegment.js";
import FreehandStroke from "./strokes/FreehandStroke.js";
import Point from "./strokes/Point.js";
import ControlPoint from "./strokes/ControlPoint.js";
import StrokeGraph from "./strokes/StrokeGraph.js";
import Config from "./Config.js";
export default class Page {
  constructor(svg) {
    this.svg = svg;
    this.points = [];
    this.graph = new StrokeGraph();
    this.lineSegments = [];
    this.freehandStrokes = [];
    this.strokes = [];
    this.objects = [];
  }
  addPoint(position) {
    const p = new Point(this.svg, position);
    this.points.push(p);
    return p;
  }
  addObject(obj) {
    this.objects.push(obj);
    return obj;
  }
  addControlPoint(position) {
    const p = new ControlPoint(this.svg, position);
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
    const s = new FreehandStroke(this.svg, points);
    this.freehandStrokes.push(s);
    return s;
  }
  addStroke(s) {
    this.strokes.push(s);
    return s;
  }
  findObjectNear(position, dist = 20, collection = this.objects) {
    let closestItem;
    let closestDistance = dist;
    for (const item of collection) {
      const d = Vec.dist(item.position, position);
      if (d < closestDistance) {
        closestDistance = d;
        closestItem = item;
      }
    }
    return closestItem;
  }
  findObjectTypeNear(position, dist = 20, type) {
    return this.findObjectNear(position, dist, this.objects.filter((o) => o instanceof type));
  }
  findPointNear(position, dist = 20) {
    return this.findObjectNear(position, dist, this.points);
  }
  mergePoint(_point) {
    return;
  }
  render(svg) {
    for (let i = 0; i < Config.iterations; i++)
      this.objects.forEach((o) => o.physics());
    this.lineSegments.forEach((ls) => ls.render());
    this.freehandStrokes.forEach((s) => s.render());
    this.strokes.forEach((s) => s.render());
    this.points.forEach((p) => p.render());
    this.objects.forEach((o) => o.render());
    this.graph.render(svg);
  }
}
