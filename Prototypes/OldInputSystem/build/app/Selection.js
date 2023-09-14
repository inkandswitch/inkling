import TransformationMatrix from "../lib/TransformationMatrix.js";
import Vec from "../lib/vec.js";
export default class Selection {
  constructor(page, snaps) {
    this.page = page;
    this.snaps = snaps;
    this.handles = new Set();
    this.origPosition = new Map();
    this.touchingGizmo = false;
  }
  includes(handle) {
    return this.handles.has(handle.canonicalInstance);
  }
  update1(events) {
    const fingerDown = events.find("finger", "began");
    if (fingerDown) {
      if (!this.firstFinger) {
        this.firstFinger = fingerDown;
        this.firstFingerMoved = fingerDown;
        const handle = this.page.findHandleNear(fingerDown.position);
        if (handle) {
          this.selectHandle(handle);
          this.tappedOn = handle;
        } else {
          this.tappedOn = void 0;
        }
        const pos = fingerDown.position;
        const transform = TransformationMatrix.identity().translate(pos.x, pos.y).inverse();
        for (const handle2 of this.handles) {
          this.origPosition.set(handle2, transform.transformPoint(handle2.position));
        }
      } else {
        this.secondFinger = fingerDown;
        this.secondFingerMoved = fingerDown;
        const a = Vec.divS(Vec.add(this.firstFingerMoved.position, this.secondFinger.position), 2);
        const b = this.secondFinger.position;
        const transform = TransformationMatrix.fromLineTranslateRotate(a, b).inverse();
        for (const handle of this.handles) {
          this.origPosition.set(handle, transform.transformPoint(handle.position));
        }
      }
    }
  }
  update2(events) {
    if (this.firstFinger) {
      const fingerMove = events.findLast("finger", "moved", this.firstFinger.id);
      if (fingerMove && !this.touchingGizmo) {
        this.firstFingerMoved = fingerMove;
        this.transformSelection();
      }
      const fingerUp = events.find("finger", "ended", this.firstFinger.id);
      if (fingerUp) {
        const shortTap = fingerUp.timestamp - this.firstFinger.timestamp < 0.2;
        if (shortTap) {
          const tappedOnEmptySpace = !this.tappedOn && !this.touchingGizmo;
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
        this.firstFinger = void 0;
        this.firstFingerMoved = void 0;
        this.secondFinger = void 0;
        this.secondFingerMoved = void 0;
        this.snaps.clear();
      }
    }
    if (this.secondFinger) {
      const fingerMove = events.find("finger", "moved", this.secondFinger.id);
      if (fingerMove) {
        this.secondFingerMoved = fingerMove;
        this.transformSelection();
      }
      const fingerTwoUp = events.find("finger", "ended", this.secondFinger.id);
      if (fingerTwoUp) {
        this.secondFinger = void 0;
        this.secondFingerMoved = void 0;
        this.firstFinger = void 0;
        this.firstFingerMoved = void 0;
      }
    }
  }
  selectHandle(handle) {
    handle.select();
    this.handles.add(handle.canonicalInstance);
    this.updateLineSelections();
  }
  deselectHandle(handle) {
    handle.deselect();
    this.handles.delete(handle.canonicalInstance);
    this.updateLineSelections();
  }
  updateLineSelections() {
    for (const ls of this.page.lineSegments) {
      if (this.handles.has(ls.a.canonicalInstance) && this.handles.has(ls.b.canonicalInstance)) {
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
    this.handles.clear();
    this.origPosition.clear();
    for (const ls of this.page.lineSegments) {
      ls.deselect();
    }
  }
  transformSelection() {
    let transform;
    if (this.firstFingerMoved && this.secondFingerMoved) {
      const a = Vec.divS(Vec.add(this.firstFingerMoved.position, this.secondFingerMoved.position), 2);
      const b = this.secondFingerMoved.position;
      transform = TransformationMatrix.fromLineTranslateRotate(a, b);
    } else {
      const p = this.firstFingerMoved.position;
      transform = TransformationMatrix.identity().translate(p.x, p.y);
    }
    const transformedPositions = new Map();
    for (const handle of this.handles) {
      const oldPos = this.origPosition.get(handle);
      const newPos = transform.transformPoint(oldPos);
      transformedPositions.set(handle, newPos);
    }
    const snappedPositions = this.snaps.snapPositions(transformedPositions);
    const brokenOffHandles = new Set();
    for (const handle of this.handles) {
      const newPos = snappedPositions.get(handle);
      const handleThatBreaksOff = this.getHandleThatBreaksOff(handle, newPos);
      if (handleThatBreaksOff) {
        handle.breakOff(handleThatBreaksOff);
        handleThatBreaksOff.position = newPos;
        this.deselectHandle(handle);
        brokenOffHandles.add(handleThatBreaksOff);
        const origPos = this.origPosition.get(handle);
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
  getHandleThatBreaksOff(handle, newPos) {
    if (Vec.dist(handle.position, newPos) < 60 || handle.absorbedHandles.size === 0) {
      return null;
    }
    const v = Vec.sub(newPos, handle.position);
    let smallestAngle = Infinity;
    let handleWithSmallestAngle = null;
    for (const h of [handle, ...handle.absorbedHandles]) {
      for (const ch of this.page.getHandlesImmediatelyConnectedTo(h)) {
        const angle = Math.abs(Vec.angleBetweenClockwise(v, Vec.sub(ch.position, handle.position)));
        if (angle < smallestAngle) {
          smallestAngle = angle;
          handleWithSmallestAngle = h;
        }
      }
    }
    return handleWithSmallestAngle;
  }
}
