import Vec from "../lib/vec.js";
export default class Morphing {
  constructor(page) {
    this.page = page;
  }
  update(events) {
    const fingerDown = events.did("finger", "began");
    if (fingerDown) {
      if (!this.firstFinger) {
        this.firstFinger = fingerDown;
        const found = this.page.findMorphPointNear(fingerDown.position);
        if (found) {
          this.draggingMorph = found;
          this.draggingAngle = this.draggingMorph.angle;
        }
        window.setTimeout(() => {
          if (!this.firstFinger || this.draggingMorph) {
            return;
          }
          if (!this.firstFingerMoved || Vec.dist(this.firstFinger.position, this.firstFingerMoved.position) < 15) {
            console.log("Long Press");
            this.draggingMorph = this.page.addMorphPoint(this.firstFinger.position);
          }
        }, 500);
      } else if (!this.secondFinger && this.draggingMorph) {
        this.secondFinger = fingerDown;
        this.draggingAngle = this.draggingMorph.angle;
      }
    }
    if (this.firstFinger) {
      const fingerMove = events.didLast("finger", "moved", this.firstFinger.id);
      if (fingerMove) {
        this.firstFingerMoved = fingerMove;
        if (this.draggingMorph) {
          this.draggingMorph.setPosition(fingerMove.position);
          this.page.freehandStrokes.forEach((str) => str.applyMorphs(this.page.morphPoints));
        }
      }
      const fingerUp = events.did("finger", "ended", this.firstFinger.id);
      if (fingerUp) {
        this.firstFinger = null;
        this.firstFingerMoved = null;
        this.draggingMorph = null;
      }
    }
    if (this.firstFinger && this.secondFinger && this.firstFingerMoved && this.draggingMorph) {
      const fingerMove = events.didLast("finger", "moved", this.secondFinger.id);
      if (fingerMove) {
        this.secondFingerMoved = fingerMove;
        const initialAngle = Vec.angle(Vec.sub(this.secondFinger.position, this.firstFinger.position));
        const movedAngle = Vec.angle(Vec.sub(this.secondFingerMoved.position, this.firstFingerMoved.position));
        const deltaAngle = movedAngle - initialAngle;
        this.draggingMorph.angle = this.draggingAngle + deltaAngle;
        this.page.freehandStrokes.forEach((str) => str.applyMorphs(this.page.morphPoints));
      }
    }
    if (this.secondFinger) {
      const fingerUp = events.did("finger", "ended", this.secondFinger.id);
      if (fingerUp) {
        this.secondFinger = null;
        this.secondFingerMoved = null;
      }
    }
  }
}
