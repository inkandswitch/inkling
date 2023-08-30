import TransformationMatrix from "../lib/transform_matrix.js";
import Vec from "../lib/vec.js";
export default class Selection {
  constructor(page, snaps) {
    this.page = page;
    this.snaps = snaps;
    this.points = new Set();
    this.origPosition = new Map();
  }
  update(events) {
    const fingerDown = events.did("finger", "began");
    if (fingerDown != null) {
      if (this.firstFinger == null) {
        this.firstFinger = fingerDown;
        this.firstFingerMoved = fingerDown;
        const point = this.page.findPointNear(fingerDown.position);
        if (point != null) {
          this.selectPoint(point);
          this.tappedOn = point;
        } else {
          this.tappedOn = void 0;
        }
        const transform = new TransformationMatrix();
        const p = fingerDown.position;
        transform.translate(p.x, p.y).inverse();
        for (const point2 of this.points) {
          this.origPosition.set(point2, transform.transformPoint(point2.position));
        }
      } else {
        this.secondFinger = fingerDown;
        this.secondFingerMoved = fingerDown;
        const transform = new TransformationMatrix();
        const a = Vec.divS(Vec.add(this.firstFingerMoved.position, this.secondFinger.position), 2);
        const b = this.secondFinger.position;
        transform.fromLineTranslateRotate(a, b).inverse();
        for (const point of this.points) {
          this.origPosition.set(point, transform.transformPoint(point.position));
        }
      }
    }
    if (this.firstFinger != null) {
      const fingerMove = events.didLast("finger", "moved", this.firstFinger.id);
      if (fingerMove != null) {
        this.firstFingerMoved = fingerMove;
        this.transformSelection();
      }
      const fingerUp = events.did("finger", "ended", this.firstFinger.id);
      if (fingerUp != null) {
        const shortTap = fingerUp.timestamp - this.firstFinger.timestamp < 0.2;
        if (shortTap) {
          const tappedOnEmptySpace = this.tappedOn == null;
          if (tappedOnEmptySpace) {
            this.clearSelection();
          }
        } else {
          if (this.tappedOn != null && this.points.size === 1) {
            this.clearSelection();
          }
        }
        for (const point of this.points) {
          this.page.mergePoint(point);
        }
        this.firstFinger = void 0;
        this.firstFingerMoved = void 0;
        this.secondFinger = void 0;
        this.secondFingerMoved = void 0;
        this.snaps.clear();
      }
    }
    if (this.secondFinger != null) {
      const fingerMove = events.did("finger", "moved", this.secondFinger.id);
      if (fingerMove != null) {
        this.secondFingerMoved = fingerMove;
        this.transformSelection();
      }
      const fingerTwoUp = events.did("finger", "ended", this.secondFinger.id);
      if (fingerTwoUp != null) {
        this.secondFinger = void 0;
        this.secondFingerMoved = void 0;
        this.firstFinger = void 0;
        this.firstFingerMoved = void 0;
      }
    }
  }
  selectPoint(point) {
    this.points.add(point);
    point.select();
    for (const ls of this.page.lineSegments) {
      if (this.points.has(ls.a) && this.points.has(ls.b)) {
        ls.select();
      } else {
        ls.deselect();
      }
    }
  }
  clearSelection() {
    for (const point of this.points) {
      point.deselect();
    }
    this.points = new Set();
    this.origPosition = new Map();
    for (const ls of this.page.lineSegments) {
      ls.deselect();
    }
  }
  transformSelection() {
    const transform = new TransformationMatrix();
    if (this.firstFingerMoved != null && this.secondFingerMoved != null) {
      const a = Vec.divS(Vec.add(this.firstFingerMoved.position, this.secondFingerMoved.position), 2);
      const b = this.secondFingerMoved.position;
      transform.fromLineTranslateRotate(a, b);
    } else {
      const p = this.firstFingerMoved.position;
      transform.translate(p.x, p.y);
    }
    const transformedPositions = new Map();
    for (const point of this.points) {
      const oldPos = this.origPosition.get(point);
      const newPos = transform.transformPoint(oldPos);
      transformedPositions.set(point, newPos);
    }
    const snappedPositions = this.snaps.snapPositions(transformedPositions);
    for (const point of this.points) {
      point.setPosition(snappedPositions.get(point));
    }
  }
}
