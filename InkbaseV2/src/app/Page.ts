import SVG from "./Svg";
import Vec from "../lib/vec";
import ArcSegment from "./strokes/ArcSegment";
import LineSegment from "./strokes/LineSegment";
import FreehandStroke from "./strokes/FreehandStroke";
import StrokeGraph from "./strokes/StrokeGraph";
import { Position, PositionWithPressure } from "../lib/types";
import { farthestPair, notNull } from "../lib/helpers";
import Handle from "./strokes/Handle";

export default class Page {
  graph = new StrokeGraph();

  // TODO: figure out a better model for how to store different kinds of strokes
  // For now just keep them separate, until we have a better idea of what freehand strokes look like
  lineSegments: Array<LineSegment | ArcSegment> = [];
  freehandStrokes: FreehandStroke[] = [];

  constructor(private svg: SVG) {}

  addLineSegment(a: Handle, b: Handle) {
    const ls = new LineSegment(this.svg, a, b);
    this.lineSegments.push(ls);
    return ls;
  }

  addArcSegment(a: Handle, b: Handle, c: Handle) {
    const as = new ArcSegment(this.svg, a, b, c);
    this.lineSegments.push(as);
    return as;
  }

  addFreehandStroke(points: Array<PositionWithPressure | null>) {
    const [aPos, bPos] = farthestPair(points.filter(notNull));
    const a = Handle.create(this.svg, "informal", aPos);
    const b = Handle.create(this.svg, "informal", bPos);

    const s = new FreehandStroke(this.svg, points, a, b);
    a.listeners.add(s);
    b.listeners.add(s);

    this.freehandStrokes.push(s);
    this.graph.addStroke(s);

    return s;
  }

  findHandleNear(pos: Position, dist = 20): Handle | null {
    let closestHandle: Handle | null = null;
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

  handlesReachableFrom(startHandles: Handle[]) {
    const reachableHandles = new Set(startHandles);
    while (true) {
      const oldSize = reachableHandles.size;

      for (const ls of this.lineSegments) {
        if (reachableHandles.has(ls.a)) {
          reachableHandles.add(ls.b);
        }
        if (reachableHandles.has(ls.b)) {
          reachableHandles.add(ls.a);
        }
      }

      for (const s of this.freehandStrokes) {
        if (reachableHandles.has(s.a)) {
          reachableHandles.add(s.b);
        }
        if (reachableHandles.has(s.b)) {
          reachableHandles.add(s.a);
        }
      }

      if (reachableHandles.size === oldSize) {
        break;
      }
    }
    return reachableHandles;
  }

  render(svg: SVG) {
    this.lineSegments.forEach((ls) => ls.render());
    this.freehandStrokes.forEach((s) => s.render());
    this.graph.render(svg);
  }
}
