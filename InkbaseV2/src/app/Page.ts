import ArcSegment from './strokes/ArcSegment';
import LineSegment, { aLineSegment } from './strokes/LineSegment';
import FreehandStroke, { aFreehandStroke } from './strokes/FreehandStroke';
import StrokeGroup, { aStrokeGroup } from './strokes/StrokeGroup';
import Stroke from './strokes/Stroke';
import StrokeClusters from './StrokeClusters';
import { Position, PositionWithPressure } from '../lib/types';
import Handle from './strokes/Handle';
import StrokeAnalyzer from './StrokeAnalyzer';
import { GameObject } from './GameObject';
import Wire from './meta/Wire';
import Token from './meta/Token';
import Namespace from './meta/Namespace';

interface Options {
  strokeAnalyzer: boolean;
}

export default class Page extends GameObject {
  // Stroke clusters are possible stroke Groups
  readonly clusters = new StrokeClusters();

  // Stroke graph looks at the page and tries to be smart about finding structure
  // TODO: should StrokeAnalyzer be a GameObject?
  readonly analyzer: StrokeAnalyzer | null;

  readonly nameSpace = new Namespace();

  constructor(options: Options) {
    super();
    this.analyzer = options.strokeAnalyzer ? new StrokeAnalyzer(this) : null;
  }

  get freehandStrokes() {
    return this.findAll({ what: aFreehandStroke, recursive: false });
  }

  get strokeGroups() {
    return this.findAll({ what: aStrokeGroup, recursive: false });
  }

  get lineSegments() {
    return this.findAll({ what: aLineSegment, recursive: false });
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

  addWireFromPosition(position: Position) {
    const w = new Wire();
    w.points = [{ ...position }, { ...position }];
    return this.adopt(w);
  }

  addWireFromToken(token: Token) {
    const w = new Wire();
    w.a = new WeakRef(token);
    return this.adopt(w);
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

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }
    this.analyzer?.render();
  }
}
