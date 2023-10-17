import { aStrokeGroup } from './ink/StrokeGroup';
import Stroke from './ink/Stroke';
import { Position } from '../lib/types';
import { GameObject } from './GameObject';
import { aGizmo } from './meta/Gizmo';
import Handle from './ink/Handle';
import Vec from '../lib/vec';
import { MetaStruct } from './meta/MetaSemantics';

interface Options {
  strokeAnalyzer: boolean;
}

export default class Page extends GameObject {
  readonly scope = new MetaStruct([]);

  constructor(_options: Options) {
    super();
  }

  private get gizmos() {
    return this.findAll({ what: aGizmo });
  }

  get strokeGroups() {
    return this.findAll({ what: aStrokeGroup, recursive: false });
  }

  addStroke<S extends Stroke>(stroke: S) {
    return this.adopt(stroke);
  }

  moveHandle(
    handle: Handle,
    newPos: Position,
    gizmoHandlesCanBreakOff: boolean
  ): Handle {
    if (!handle.isCanonical) {
      return this.moveHandle(
        handle.canonicalInstance,
        newPos,
        gizmoHandlesCanBreakOff
      );
    }

    const handleThatBreaksOff = this.getHandleThatBreaksOff(
      handle,
      newPos,
      gizmoHandlesCanBreakOff
    );
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
    newPos: Position,
    gizmoHandlesCanBreakOff: boolean
  ): Handle | null {
    if (
      Vec.dist(handle.position, newPos) < 30 ||
      handle.absorbedHandles.size === 0
    ) {
      return null;
    }

    const v = Vec.sub(newPos, handle.position);
    let smallestAngle = Infinity;
    let handleWithSmallestAngle: Handle | null = null;

    let candidates = [handle, ...handle.absorbedHandles];
    if (!gizmoHandlesCanBreakOff) {
      candidates = candidates.filter(h => !this.isGizmoHandle(h));
      if (candidates.length <= 1) {
        // don't want to leave a gizmo handle on its own!
        return null;
      }
    }

    for (const h of candidates) {
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
   * Returns a set of handles that are immediately connected to the given handle.
   */
  private getHandlesImmediatelyConnectedTo(handle: Handle) {
    const connectedHandles = new Set<Handle>();

    for (const thing of [...this.strokeGroups, ...this.gizmos]) {
      if (handle === thing.a && thing.b) {
        connectedHandles.add(thing.b);
      }
      if (handle === thing.b && thing.a) {
        connectedHandles.add(thing.a);
      }
    }

    return connectedHandles;
  }

  private isGizmoHandle(handle: Handle) {
    return !!this.find({
      what: aGizmo,
      that: gizmo => gizmo.a === handle || gizmo.b === handle,
    });
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
}
