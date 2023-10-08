import StrokeGroup, { aStrokeGroup } from './ink/StrokeGroup';
import Stroke from './ink/Stroke';
import { Position } from '../lib/types';
import { GameObject } from './GameObject';
import Wire from './meta/Wire';
import Namespace from './meta/Namespace';
import { TokenWithVariable } from './meta/token-helpers';
import Gizmo, { aGizmo } from './meta/Gizmo';
import Handle from './ink/Handle';
import Vec from '../lib/vec';

interface Options {
  strokeAnalyzer: boolean;
}

export default class Page extends GameObject {
  readonly namespace = new Namespace();

  constructor(_options: Options) {
    super();
  }

  private get gizmos() {
    return this.findAll({ what: aGizmo });
  }

  get strokeGroups() {
    return this.findAll({ what: aStrokeGroup, recursive: false });
  }

  addStrokeGroup(strokes: Set<Stroke>): StrokeGroup {
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

  addWireFromToken(token: TokenWithVariable) {
    const w = new Wire();
    w.attachFront(token.wirePort);
    return this.adopt(w);
  }

  addWireFromGizmo(_gizmo: Gizmo) {}

  moveHandle(handle: Handle, newPos: Position): Handle {
    if (handle.canonicalInstance !== handle) {
      return this.moveHandle(handle.canonicalInstance, newPos);
    }

    const handleThatBreaksOff = this.getHandleThatBreaksOff(handle, newPos);
    // console.log('htbo', handleThatBreaksOff, Vec.dist(handle.position, newPos));
    if (!handleThatBreaksOff) {
      handle.position = newPos;
      return handle;
    }

    handle.breakOff(handleThatBreaksOff);
    handleThatBreaksOff.position = newPos;
    return handleThatBreaksOff;
  }

  private getHandleThatBreaksOff(
    handle: Handle,
    newPos: Position
  ): Handle | null {
    if (
      // TODO: decide based on acceleration?
      Vec.dist(handle.position, newPos) < 30 ||
      handle.absorbedHandles.length === 0
    ) {
      return null;
    }

    const v = Vec.sub(newPos, handle.position);
    let smallestAngle = Infinity;
    let handleWithSmallestAngle: Handle | null = null;

    for (const h of [handle, ...handle.absorbedHandles]) {
      for (const ch of this.getHandlesImmediatelyConnectedTo(h)) {
        // TODO: Instead of using the signed/wrapped angle between the velocity and stroke, shouldn't we be using the dot product?
        const angle = Math.abs(
          Vec.angleBetweenClockwise(v, Vec.sub(ch.position, handle.position))
        );
        if (angle < smallestAngle) {
          smallestAngle = angle;
          handleWithSmallestAngle = h;
        }
      }
    }

    return handleWithSmallestAngle!;
  }

  /**
   * returns a set of handles that are immediately connected to the given handle
   * (but not to its canonical handle, if it has been absorbed)
   */
  private getHandlesImmediatelyConnectedTo(handle: Handle) {
    const connectedHandles = new Set<Handle>();

    for (const thing of [...this.strokeGroups, ...this.gizmos]) {
      if (handle === thing.a) {
        connectedHandles.add(thing.b!);
      }
      if (handle === thing.b) {
        connectedHandles.add(thing.a!);
      }
    }

    return connectedHandles;
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
}
