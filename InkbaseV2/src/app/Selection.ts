import { randInt } from '../lib/math';
import TransformationMatrix from '../lib/transform_matrix';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Events, { Event } from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Handle from './strokes/Handle';

export default class Selection {
  readonly handles = new Set<Handle>();
  readonly origPosition = new Map<Handle, Position>();

  // gesture state
  tappedOn?: Handle;
  firstFinger?: Event;
  firstFingerMoved?: Event;
  secondFinger?: Event;
  secondFingerMoved?: Event;

  constructor(
    private readonly page: Page,
    private readonly snaps: Snaps
  ) {}

  update(events: Events) {
    const fingerDown = events.did('finger', 'began');
    if (fingerDown) {
      // If we weren't already holding down a finger
      if (!this.firstFinger) {
        this.firstFinger = fingerDown;
        this.firstFingerMoved = fingerDown;

        const handle = this.page.findHandleNear(fingerDown.position);
        if (handle) {
          this.selectHandle(handle);
          this.tappedOn = handle;
        } else {
          this.tappedOn = undefined;
        }

        // Set initial offset transform
        const transform = new TransformationMatrix();
        const pos = fingerDown.position;
        transform.translate(pos.x, pos.y).inverse();
        for (const handle of this.handles) {
          this.origPosition.set(
            handle,
            transform.transformPoint(handle.position)
          );
        }
      } else {
        // Two fingers, go into full transform mode
        this.secondFinger = fingerDown;
        this.secondFingerMoved = fingerDown;

        // Set initial offset transform
        const transform = new TransformationMatrix();
        const a = Vec.divS(
          Vec.add(this.firstFingerMoved!.position, this.secondFinger.position),
          2
        );
        const b = this.secondFinger.position;
        transform.fromLineTranslateRotate(a, b).inverse();
        for (const handle of this.handles) {
          this.origPosition.set(
            handle,
            transform.transformPoint(handle.position)
          );
        }
      }
    }

    // If we're already holding down a finger, switch to pinch gesture
    if (this.firstFinger) {
      const fingerMove = events.didLast('finger', 'moved', this.firstFinger.id);
      if (fingerMove) {
        this.firstFingerMoved = fingerMove;
        this.transformSelection();
      }

      const fingerUp = events.did('finger', 'ended', this.firstFinger.id);
      if (fingerUp) {
        const shortTap = fingerUp.timestamp - this.firstFinger.timestamp < 0.2;
        if (shortTap) {
          const tappedOnEmptySpace = !this.tappedOn;
          if (tappedOnEmptySpace) {
            this.clearSelection();
          }
        } else {
          if (this.tappedOn && this.handles.size === 1) {
            this.clearSelection();
          }
        }

        for (const handle of this.handles) {
          handle.absorbNearbyHandles();
        }

        this.firstFinger = undefined;
        this.firstFingerMoved = undefined;

        // TODO: this could be done better
        this.secondFinger = undefined;
        this.secondFingerMoved = undefined;

        this.snaps.clear();
      }
    }

    if (this.secondFinger) {
      const fingerMove = events.did('finger', 'moved', this.secondFinger.id);
      if (fingerMove) {
        this.secondFingerMoved = fingerMove;
        this.transformSelection();
      }

      const fingerTwoUp = events.did('finger', 'ended', this.secondFinger.id);
      if (fingerTwoUp) {
        this.secondFinger = undefined;
        this.secondFingerMoved = undefined;

        // TODO: this could be done better
        this.firstFinger = undefined;
        this.firstFingerMoved = undefined;
      }
    }
  }

  private selectHandle(handle: Handle) {
    handle.select();
    this.handles.add(handle.canonicalInstance);
    this.updateLineSelections();
  }

  private deselectHandle(handle: Handle) {
    handle.deselect();
    this.handles.delete(handle.canonicalInstance);
    this.updateLineSelections();
  }

  private updateLineSelections() {
    for (const ls of this.page.lineSegments) {
      if (
        this.handles.has(ls.a.canonicalInstance) &&
        this.handles.has(ls.b.canonicalInstance)
      ) {
        ls.select();
      } else {
        ls.deselect();
      }
    }
  }

  private clearSelection() {
    for (const handle of this.handles) {
      handle.deselect();
    }

    this.handles.clear();
    this.origPosition.clear();

    for (const ls of this.page.lineSegments) {
      ls.deselect();
    }
  }

  transformSelection() {
    const transform = new TransformationMatrix();
    if (this.firstFingerMoved && this.secondFingerMoved) {
      const a = Vec.divS(
        Vec.add(
          this.firstFingerMoved.position,
          this.secondFingerMoved.position
        ),
        2
      );
      const b = this.secondFingerMoved.position;
      transform.fromLineTranslateRotate(a, b);
    } else {
      const p = this.firstFingerMoved!.position;
      transform.translate(p.x, p.y);
    }

    const transformedPositions = new Map();
    for (const handle of this.handles) {
      const oldPos = this.origPosition.get(handle)!;
      const newPos = transform.transformPoint(oldPos);
      transformedPositions.set(handle, newPos);
    }

    const snappedPositions = this.snaps.snapPositions(transformedPositions);

    const brokenOffHandles = new Set<Handle>();
    for (const handle of this.handles) {
      const newPos = snappedPositions.get(handle)!;
      const handleThatBreaksOff = this.getHandleThatBreaksOff(handle, newPos);
      if (handleThatBreaksOff) {
        // console.log(
        //   'breaking off',
        //   JSON.stringify(handleThatBreaksOff),
        //   'from',
        //   JSON.stringify(handle)
        // );
        handle.breakOff(handleThatBreaksOff);
        // console.log(
        //   'broke off handle',
        //   JSON.stringify(handleThatBreaksOff),
        //   'from',
        //   JSON.stringify(handle)
        // );
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
    }

    for (const brokenOffHandle of brokenOffHandles) {
      this.selectHandle(brokenOffHandle);
    }
  }

  getHandleThatBreaksOff(handle: Handle, newPos: Position): Handle | null {
    if (
      // TODO: decide based on acceleration?
      Vec.dist(handle.position, newPos) < 40 ||
      handle.absorbedHandles.size === 0
    ) {
      return null;
    }

    const handles = [handle, ...handle.absorbedHandles];

    // TODO: pick one based on the positions of the other handles
    // that are attached to these guys
    return Array.from(handles)[randInt(0, handles.length - 1)];
  }
}
