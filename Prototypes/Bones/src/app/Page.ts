import SVG from "./Svg";
import Vec from "../lib/vec";
import ArcSegment from "./strokes/ArcSegment";
import LineSegment from "./strokes/LineSegment";
import FreehandStroke from "./strokes/FreehandStroke";
import Stroke from "./strokes/Stroke";

import Point from "./strokes/Point";
import ControlPoint, { ControlPointListener } from "./strokes/ControlPoint";

import StrokeGraph from "./strokes/StrokeGraph";
import { Position, PositionWithPressure } from "../lib/types";
import Config from "./Config";

export default class Page {
  points: Point[] = [];
  graph = new StrokeGraph();

  // TODO: figure out a better model for how to store different kinds of strokes
  // For now just keep them separate, until we have a better idea of what freehand strokes look like
  lineSegments: Array<LineSegment | ArcSegment> = [];
  freehandStrokes: FreehandStroke[] = [];
  strokes: Stroke[] = [];
  objects: any[] = [];

  constructor(private svg: SVG) {}

  addPoint(position: Position) {
    const p = new Point(this.svg, position);
    this.points.push(p);
    return p;
  }

  addObject<T>(obj: T) {
    this.objects.push(obj);
    return obj;
  }

  addControlPoint(position: Position) {
    const p = new ControlPoint(this.svg, position);
    this.points.push(p);
    return p;
  }

  addLineSegment(a: Point, b: Point) {
    const ls = new LineSegment(this.svg, a, b);
    this.lineSegments.push(ls);
    return ls;
  }

  addArcSegment(a: Point, b: Point, c: Point) {
    const as = new ArcSegment(this.svg, a, b, c);
    this.lineSegments.push(as);
    return as;
  }

  addFreehandStroke(points: Array<PositionWithPressure>) {
    const s = new FreehandStroke(this.svg, points);
    this.freehandStrokes.push(s);
    return s;
  }

  addStroke<S extends Stroke>(s: S): S {
    this.strokes.push(s);
    return s;
  }

  findObjectNear(position: Position, dist = 20, collection = this.objects) {
    let closestItem: any | undefined;
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

  findObjectTypeNear(position: Position, dist = 20, type: any) {
    return this.findObjectNear(
      position,
      dist,
      this.objects.filter((o) => o instanceof type)
    );
  }

  findPointNear(position: Position, dist = 20) {
    return this.findObjectNear(position, dist, this.points);
  }

  // TODO: this is a bad idea -- it breaks too much of the stuff that I want to do.
  // consider removing, or at least disabling for my experiments.
  mergePoint(_point: Point) {
    return;

    // const pointsToMerge = new Set(
    //   this.points.filter((p) => p !== point && Vec.dist(p.position, point.position) === 0)
    // )

    // if (pointsToMerge.size === 0) {
    //   return // avoid iterating over lines
    // }

    // for (const ls of this.lineSegments) {
    //   if (pointsToMerge.has(ls.a)) {
    //     ls.a = point
    //   }
    //   if (pointsToMerge.has(ls.b)) {
    //     ls.b = point
    //   }
    //   if (ls instanceof ArcSegment && pointsToMerge.has(ls.c)) {
    //     ls.c = point
    //   }
    // }

    // for (const s of this.freehandStrokes) {
    //     if (pointsToMerge.has(s.controlPoints[0])) {
    //         // TODO: this is wrong b/c we also need to modify the maps...
    //         // want Smalltalk's #become:
    //         s.controlPoints[0] = point;
    //     }
    //     if (pointsToMerge.has(s.controlPoints[1])) {
    //         s.controlPoints[1] = point;
    //     }
    // }

    // for (const mergedPoint of pointsToMerge) {
    //   mergedPoint.remove()
    // }
    // this.points = this.points.filter((p) => !pointsToMerge.has(p))
  }

  render(svg: SVG) {
    for (let i = 0; i < Config.iterations; i++) this.objects.forEach((o) => o.physics());

    this.lineSegments.forEach((ls) => ls.render());
    this.freehandStrokes.forEach((s) => s.render());
    this.strokes.forEach((s) => s.render());
    this.points.forEach((p) => p.render());
    this.objects.forEach((o) => o.render());
    this.graph.render(svg);
  }
}
