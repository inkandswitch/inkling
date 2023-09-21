import Vec from '../lib/vec';
import ArcSegment from './strokes/ArcSegment';
import LineSegment, { isLineSegment } from './strokes/LineSegment';
import FreehandStroke, { isFreehandStroke } from './strokes/FreehandStroke';
import StrokeGroup, { isStrokeGroup } from './strokes/StrokeGroup';
import Stroke from './strokes/Stroke';
import StrokeClusters from './StrokeClusters';
import { Position, PositionWithPressure } from '../lib/types';
import Handle from './strokes/Handle';
import StrokeAnalyzer from './StrokeAnalyzer';
import { makeIterableIterator } from '../lib/helpers';
import { GameObject } from './GameObject';

interface Options {
  strokeAnalyzer: boolean;
}

export default class Page extends GameObject {
  // Stroke clusters are possible stroke Groups
  readonly clusters = new StrokeClusters();

  // Stroke graph looks at the page and tries to be smart about finding structure
  readonly analyzer: StrokeAnalyzer | null;

  constructor(options: Options) {
    super();
    this.analyzer = options.strokeAnalyzer ? new StrokeAnalyzer(this) : null;
  }

  get freehandStrokes() {
    return makeIterableIterator([this.children], isFreehandStroke);
  }

  get strokeGroups() {
    return makeIterableIterator([this.children], isStrokeGroup);
  }

  get lineSegments() {
    return makeIterableIterator([this.children], isLineSegment);
  }

  addLineSegment(aPos: Position, bPos: Position) {
    return this.adopt(new LineSegment(aPos, bPos));
  }

  addArcSegment(aPos: Position, bPos: Position, cPos: Position) {
    return this.adopt(new ArcSegment(aPos, bPos, cPos));
  }

  addStrokeGroup(strokes: Set<FreehandStroke>): StrokeGroup {
    return this.adopt(new StrokeGroup(strokes));
  }

  addStroke<S extends Stroke>(stroke: S) {
    return this.adopt(stroke);
  }

  onstrokeUpdated(stroke: Stroke) {
    if (stroke instanceof FreehandStroke) {
      this.analyzer?.addStroke(stroke);
    }
  }

  addFreehandStroke(points: Array<PositionWithPressure>) {
    const s = this.addStroke(new FreehandStroke(points));
    this.analyzer?.addStroke(s);
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

  /**
   * returns a set of handles that are immediately connected to the given handle
   * (but not to its canonical handle, if it has been absorbed)
   */
  getHandlesImmediatelyConnectedTo(handle: Handle) {
    const connectedHandles = new Set<Handle>();

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

  findFreehandStrokeNear(pos: Position, dist = 20) {
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

  findStrokeGroupNear(pos: Position, dist = 20) {
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
    for (const child of this.children) {
      child.render();
    }
    this.analyzer?.render();
  }
}
