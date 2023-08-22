import SVG from './Svg';
import Vec from '../lib/vec';
import ArcSegment from './strokes/ArcSegment';
import LineSegment from './strokes/LineSegment';
import FreehandStroke from './strokes/FreehandStroke';
import StrokeGroup from './strokes/StrokeGroup';

import StrokeClusters from './StrokeClusters';
import { Position, PositionWithPressure } from '../lib/types';
import { farthestPair, notNull } from '../lib/helpers';
import Handle from './strokes/Handle';

export default class Page {

  // Stroke clusters are possible stroke Groups
  clusters = new StrokeClusters();

  // TODO: figure out a better model for how to store different kinds of strokes
  // For now just keep them separate, until we have a better idea of what freehand strokes look like
  lineSegments: Array<LineSegment | ArcSegment> = [];
  freehandStrokes: FreehandStroke[] = [];
  strokeGroups:  Array<StrokeGroup> = [];

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
    const a = Handle.create(this.svg, 'informal', aPos);
    const b = Handle.create(this.svg, 'informal', bPos);

    const s = new FreehandStroke(this.svg, points, a, b);
    this.freehandStrokes.push(s);

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
    const reachableHandles = new Set(
      startHandles.map(handle => handle.canonicalInstance)
    );
    while (true) {
      const oldSize = reachableHandles.size;

      for (const ls of this.lineSegments) {
        if (reachableHandles.has(ls.a.canonicalInstance)) {
          reachableHandles.add(ls.b.canonicalInstance);
        }
        if (reachableHandles.has(ls.b.canonicalInstance)) {
          reachableHandles.add(ls.a.canonicalInstance);
        }
      }

      for (const s of this.freehandStrokes) {
        if (reachableHandles.has(s.a.canonicalInstance)) {
          reachableHandles.add(s.b.canonicalInstance);
        }
        if (reachableHandles.has(s.b.canonicalInstance)) {
          reachableHandles.add(s.a.canonicalInstance);
        }
      }

      if (reachableHandles.size === oldSize) {
        break;
      }
    }
    return reachableHandles;
  }

  /**
   * returns a set of handles that are immediately connected to the given handle
   * (but not to its canonical handle, if it has been absorbed)
   */
  getHandlesImmediatelyConnectedTo(handle: Handle) {
    const connectedHandles = new Set<Handle>();

    for (const ls of this.lineSegments) {
      if (handle === ls.a) {
        connectedHandles.add(ls.b);
      }
      if (handle === ls.b) {
        connectedHandles.add(ls.a);
      }
    }

    for (const s of this.freehandStrokes) {
      if (handle === s.a) {
        connectedHandles.add(s.b);
      }
      if (handle === s.b) {
        connectedHandles.add(s.a);
      }
    }

    return connectedHandles;
  }

  findFreehandStrokeNear(position: Position, dist = 20) {
    let closestStroke = null;
    let closestDistance = dist;
    for (const stroke of this.freehandStrokes) {
      for (const point of stroke.points) {
        if (!point) {
          continue;
        }
        const d = Vec.dist(point, position);
        if (d < closestDistance) {
          closestDistance = d;
          closestStroke = stroke;
        }
      }
    }

    return closestStroke;
  }

  render(svg: SVG) {
    this.lineSegments.forEach(ls => ls.render());
    this.freehandStrokes.forEach(s => s.render());
  }
}
