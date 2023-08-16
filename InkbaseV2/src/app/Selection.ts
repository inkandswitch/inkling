import TransformationMatrix from '../lib/transform_matrix';
import {Position} from '../lib/types';
import Vec from '../lib/vec';
import Events, {Event} from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Handle from './strokes/Handle';

export default class Selection {
  handles = new Set<Handle>();
  origPosition = new Map<Handle, Position>();

  // gesture state
  tappedOn?: Handle;
  firstFinger?: Event;
  firstFingerMoved?: Event;
  secondFinger?: Event;
  secondFingerMoved?: Event;

  constructor(
    private page: Page,
    private snaps: Snaps
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

        // for (const handle of this.handles) {
        //   // TODO: merge handle w/ nearby handles
        // }

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

  selectHandle(handle: Handle) {
    this.handles.add(handle);
    handle.select();

    for (const ls of this.page.lineSegments) {
      if (this.handles.has(ls.a) && this.handles.has(ls.b)) {
        ls.select();
      } else {
        ls.deselect();
      }
    }
  }

  clearSelection() {
    for (const handle of this.handles) {
      handle.deselect();
    }
    this.handles = new Set();
    this.origPosition = new Map();

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
    for (const handle of this.handles) {
      handle.setPosition(snappedPositions.get(handle)!);
    }
  }
}
