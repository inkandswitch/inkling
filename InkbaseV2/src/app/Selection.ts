import TransformationMatrix from '../lib/TransformationMatrix';
import { forEach } from '../lib/helpers';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Events, { Event } from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Handle, { aCanonicalHandle } from './strokes/Handle';

export default class Selection {
  readonly handles = [] as WeakRef<Handle>[];
  private origPosition = new WeakMap<Handle, Position>();

  // gesture state
  tappedOn?: WeakRef<Handle>;
  firstFinger?: Event;
  firstFingerMoved?: Event;
  secondFinger?: Event;
  secondFingerMoved?: Event;

  touchingGizmo = false;

  constructor(
    private readonly page: Page,
    private readonly snaps: Snaps
  ) {}

  includes(handle: Handle): boolean {
    let ans = false;
    forEach(this.handles, h => {
      if (h.canonicalInstance === handle) {
        ans = true;
      }
    });
    return ans;
  }

  update1(events: Events) {
    const fingerDown = events.find('finger', 'began');
    if (fingerDown) {
      // If we weren't already holding down a finger
      if (!this.firstFinger) {
        this.firstFinger = fingerDown;
        this.firstFingerMoved = fingerDown;

        const handle = this.page.find({
          what: aCanonicalHandle,
          near: fingerDown.position,
        });
        if (handle) {
          // this.selectHandle(handle); // Extracted to Input.ts
          this.tappedOn = new WeakRef(handle);
        } else {
          this.tappedOn = undefined;
        }

        // Set initial offset transform
        const pos = fingerDown.position;
        const transform = TransformationMatrix.identity()
          .translate(pos.x, pos.y)
          .inverse();
        forEach(this.handles, handle => {
          this.origPosition.set(
            handle,
            transform.transformPoint(handle.position)
          );
        });
      } else {
        // Two fingers, go into full transform mode
        this.secondFinger = fingerDown;
        this.secondFingerMoved = fingerDown;

        // Set initial offset transform
        const a = Vec.divS(
          Vec.add(this.firstFingerMoved!.position, this.secondFinger.position),
          2
        );
        const b = this.secondFinger.position;
        const transform = TransformationMatrix.fromLineTranslateRotate(
          a,
          b
        ).inverse();
        forEach(this.handles, handle => {
          this.origPosition.set(
            handle,
            transform.transformPoint(handle.position)
          );
        });
      }
    }
  }

  update2(events: Events) {
    // If we're already holding down a finger, switch to pinch gesture
    if (this.firstFinger) {
      const fingerMove = events.findLast(
        'finger',
        'moved',
        this.firstFinger.id
      );

      if (fingerMove && !this.touchingGizmo) {
        this.firstFingerMoved = fingerMove;
        this.transformSelection();
      }

      const fingerUp = events.find('finger', 'ended', this.firstFinger.id);
      if (fingerUp) {
        // Extracted to Input.ts
        // const shortTap = fingerUp.timestamp - this.firstFinger.timestamp < 0.2;
        // if (shortTap) {
        //   const tappedOnEmptySpace = !this.tappedOn && !this.touchingGizmo;
        //   if (tappedOnEmptySpace) {
        //     this.clearSelection();
        //   }
        // } else {
        //   if (this.tappedOn && this.handles.size === 1) {
        //     this.clearSelection();
        //   }
        // }

        forEach(this.handles, handle => {
          handle.absorbNearbyHandles();
        });

        this.firstFinger = undefined;
        this.firstFingerMoved = undefined;

        // TODO: this could be done better
        this.secondFinger = undefined;
        this.secondFingerMoved = undefined;

        this.snaps.clear();
      }
    }

    if (this.secondFinger) {
      const fingerMove = events.find('finger', 'moved', this.secondFinger.id);
      if (fingerMove) {
        this.secondFingerMoved = fingerMove;
        this.transformSelection();
      }

      const fingerTwoUp = events.find('finger', 'ended', this.secondFinger.id);
      if (fingerTwoUp) {
        this.secondFinger = undefined;
        this.secondFingerMoved = undefined;

        // TODO: this could be done better
        this.firstFinger = undefined;
        this.firstFingerMoved = undefined;
      }
    }
  }

  selectHandle(handle: Handle) {
    if (this.includes(handle)) {
      return;
    }

    handle.select();
    this.handles.push(new WeakRef(handle.canonicalInstance));
    this.updateLineSelections();
  }

  deselectHandle(handle: Handle) {
    handle.deselect();
    forEach(this.handles, (h, idx) => {
      if (h.canonicalInstance === handle) {
        this.handles.splice(idx, 1);
      }
    });
    this.updateLineSelections();
  }

  updateLineSelections() {
    for (const ls of this.page.lineSegments) {
      if (this.includes(ls.a) && this.includes(ls.b)) {
        ls.select();
      } else {
        ls.deselect();
      }
    }
  }

  clearSelection() {
    forEach(this.handles, handle => {
      handle.deselect();
    });

    this.handles.length = 0;
    this.origPosition = new WeakMap(); // not sure why, but WeakMap has no clear()

    for (const ls of this.page.lineSegments) {
      ls.deselect();
    }
  }

  transformSelection() {
    let transform: TransformationMatrix;
    if (this.firstFingerMoved && this.secondFingerMoved) {
      const a = Vec.divS(
        Vec.add(
          this.firstFingerMoved.position,
          this.secondFingerMoved.position
        ),
        2
      );
      const b = this.secondFingerMoved.position;
      transform = TransformationMatrix.fromLineTranslateRotate(a, b);
    } else {
      const p = this.firstFingerMoved!.position;
      transform = TransformationMatrix.identity().translate(p.x, p.y);
    }

    const transformedPositions = new Map<Handle, Position>();
    forEach(this.handles, handle => {
      const oldPos = this.origPosition.get(handle)!;
      const newPos = transform.transformPoint(oldPos);
      transformedPositions.set(handle, newPos);
    });

    const snappedPositions = this.snaps.snapPositions(transformedPositions);

    const brokenOffHandles = new Set<Handle>();
    forEach(this.handles, handle => {
      const newPos = snappedPositions.get(handle)!;
      const handleThatBreaksOff = this.getHandleThatBreaksOff(handle, newPos);
      if (handleThatBreaksOff) {
        // console.log('breaking off', handleThatBreaksOff, 'from', handle);
        handle.breakOff(handleThatBreaksOff);
        // console.log('broke off handle', handleThatBreaksOff, 'from', handle);
        handleThatBreaksOff.position = newPos;

        // deselect the original angle and remove it from the set of
        // selected handles
        this.deselectHandle(handle);

        // we'll add handleThatBreaksOff to the set of selected handles
        // (and tell it that it's selected) after this loop is done,
        // so that we won't see it this time around
        brokenOffHandles.add(handleThatBreaksOff);

        // update orig position map
        const origPos = this.origPosition.get(handle)!;
        this.origPosition.delete(handle);
        this.origPosition.set(handleThatBreaksOff, origPos);
      } else {
        handle.position = newPos;
      }
    });

    for (const brokenOffHandle of brokenOffHandles) {
      this.selectHandle(brokenOffHandle);
    }
  }

  getHandleThatBreaksOff(handle: Handle, newPos: Position): Handle | null {
    if (
      // TODO: decide based on acceleration?
      Vec.dist(handle.position, newPos) < 60 ||
      handle.absorbedHandles.length === 0
    ) {
      return null;
    }

    const v = Vec.sub(newPos, handle.position);
    let smallestAngle = Infinity;
    let handleWithSmallestAngle: Handle | null = null;

    for (const h of [handle, ...handle.absorbedHandles]) {
      for (const ch of this.page.getHandlesImmediatelyConnectedTo(h)) {
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
}
