import SVG from "./Svg";
import Vec from "../lib/vec";
import ArcSegment from "./strokes/ArcSegment";
import LineSegment from "./strokes/LineSegment";
import FreehandStroke from "./strokes/FreehandStroke";

import Point from "./strokes/Point";
import ControlPoint from "./strokes/ControlPoint";

import Groups from "./Groups";
import { Position, PositionWithPressure } from "../lib/types";
import StrokeGroup from "./strokes/StrokeGroup";
import DeformMesh from "./DeformMesh";

export default class Page {
  points: Point[] = [];
  groups = new Groups();

  // TODO: figure out a better model for how to store different kinds of strokes
  // For now just keep them separate, until we have a better idea of what freehand strokes look like
  lineSegments: Array<LineSegment | ArcSegment> = [];
  freehandStrokes: FreehandStroke[] = [];
  meshes: DeformMesh[] = [];

  constructor(private svg: SVG) {}

  addPoint(position: Position) {
    const p = new Point(this.svg, position);
    this.points.push(p);
    return p;
  }

  addControlPoint(position: Position, parent?) {
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

  addMesh(group) {
    let stroke = Array.from(group.strokes)[0];
    let start = stroke.points[0];
    let end = stroke.points[stroke.points.length-1];

    let controlPoints = [
      this.addControlPoint(start),
      this.addControlPoint(end)
    ]

    this.meshes.push(new DeformMesh(group.mesh, controlPoints));

    console.log(this.meshes);
  }

  addFreehandStroke(points: Array<PositionWithPressure | null>) {
    const cp1 = this.addControlPoint(points[0]!);
    const cp2 = this.addControlPoint(points[points.length - 1]!);
    const s = new FreehandStroke(this.svg, points, cp1, cp2);
    cp1.parent = s;
    cp2.parent = s;
    this.freehandStrokes.push(s);
    this.groups.update(this.freehandStrokes);
    return s;
  }

  findFreehandStrokeNear(position, dist = 20) {
    let closestStroke = null;
    let closestDistance = dist;
    for(const stroke of this.freehandStrokes) {
        for(const point of stroke.points) {
            const d = Vec.dist(point, position);
            if (d < closestDistance) {
                closestDistance = d;
                closestStroke = stroke;
            }
        }
    }

    return closestStroke
  }

  findPointNear(position: Position, dist = 20) {
    let closestPoint: Point | null = null;
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

  pointsReachableFrom(startPoints: Point[]) {
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

  render(svg: SVG) {
    this.lineSegments.forEach((ls) => ls.render(svg));
    this.freehandStrokes.forEach((s) => s.render());
    this.points.forEach((p) => p.render());
    this.meshes.forEach((m)=> m.render(svg));

    this.groups.render(svg);
  }
}
