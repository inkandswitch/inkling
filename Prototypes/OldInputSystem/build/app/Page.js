import Vec from "../lib/vec.js";
import ArcSegment from "./strokes/ArcSegment.js";
import LineSegment from "./strokes/LineSegment.js";
import FreehandStroke from "./strokes/FreehandStroke.js";
import StrokeGroup from "./strokes/StrokeGroup.js";
import StrokeClusters from "./StrokeClusters.js";
import Handle from "./strokes/Handle.js";
import StrokeAnalyzer from "./StrokeAnalyzer.js";
import {makeIterableIterator} from "../lib/helpers.js";
export default class Page {
  constructor(options) {
    this.clusters = new StrokeClusters();
    this.lineSegments = [];
    this.strokeGroups = [];
    this.strokes = [];
    this.analyzer = options.strokeAnalyzer ? new StrokeAnalyzer(this) : null;
  }
  get freehandStrokes() {
    return makeIterableIterator([this.strokes], (s) => s instanceof FreehandStroke);
  }
  addLineSegment(aPos, bPos) {
    const ls = new LineSegment(aPos, bPos);
    this.lineSegments.push(ls);
    return ls;
  }
  addArcSegment(aPos, bPos, cPos) {
    const as = new ArcSegment(aPos, bPos, cPos);
    this.lineSegments.push(as);
    return as;
  }
  addStrokeGroup(strokes) {
    const sg = new StrokeGroup(strokes);
    this.strokeGroups.push(sg);
    return sg;
  }
  addStroke(stroke) {
    this.strokes.push(stroke);
    return stroke;
  }
  onstrokeUpdated(stroke) {
    if (stroke instanceof FreehandStroke) {
      this.analyzer?.addStroke(stroke);
    }
  }
  addFreehandStroke(points) {
    const s = new FreehandStroke(points);
    this.addStroke(s);
    this.analyzer?.addStroke(s);
    return s;
  }
  findHandleNear(pos, dist = 20) {
    let closestHandle = null;
    let closestDistance = dist;
    for (const handle of Handle.all) {
      const d = Vec.dist(handle.position, pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestHandle = handle;
      }
    }
    return closestHandle;
  }
  handlesReachableFrom(startHandles) {
    const reachableHandles = new Set(startHandles.map((handle) => handle.canonicalInstance));
    const things = [...this.lineSegments, ...this.strokeGroups];
    while (true) {
      const oldSize = reachableHandles.size;
      for (const thing of things) {
        if (reachableHandles.has(thing.a.canonicalInstance)) {
          reachableHandles.add(thing.b.canonicalInstance);
        }
        if (reachableHandles.has(thing.b.canonicalInstance)) {
          reachableHandles.add(thing.a.canonicalInstance);
        }
      }
      if (reachableHandles.size === oldSize) {
        break;
      }
    }
    return reachableHandles;
  }
  getHandlesImmediatelyConnectedTo(handle) {
    const connectedHandles = new Set();
    for (const thing of [...this.lineSegments, ...this.strokeGroups]) {
      if (handle === thing.a) {
        connectedHandles.add(thing.b);
      }
      if (handle === thing.b) {
        connectedHandles.add(thing.a);
      }
    }
    return connectedHandles;
  }
  findFreehandStrokeNear(pos, dist = 20) {
    let closestStroke = null;
    let closestDistance = dist;
    for (const stroke of this.freehandStrokes) {
      const d = stroke.minDistanceFrom(pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestStroke = stroke;
      }
    }
    return closestStroke;
  }
  findStrokeGroupNear(pos, dist = 20) {
    let closestStrokeGroup = null;
    let closestDistance = dist;
    for (const strokeGroup of this.strokeGroups) {
      const d = strokeGroup.minDistanceFrom(pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestStrokeGroup = strokeGroup;
      }
    }
    return closestStrokeGroup;
  }
  render() {
    this.lineSegments.forEach(render);
    this.strokes.forEach(render);
    this.analyzer?.render();
  }
}
const render = (s) => s.render();
