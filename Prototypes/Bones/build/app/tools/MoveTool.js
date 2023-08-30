import Vec from "../../lib/vec.js";
import Dot from "../strokes/Dot.js";
import {Tool} from "./Tool.js";
import Config from "../Config.js";
export default class Move extends Tool {
  constructor(svg, buttonX, buttonY, page) {
    super(svg, buttonX, buttonY);
    this.page = page;
    this.startFinger = (point) => this.startStroke(point, Config.lockedRadiusFinger, Config.unlockedRadiusFinger);
    this.moveFinger = this.extendStroke;
    this.endFinger = this.endStroke;
    Move.instance = this;
  }
  startStroke(point, lockedRadius = Config.lockedRadiusPencil, unlockedRadius = Config.unlockedRadiusPencil) {
    this.startMove = point;
    this.moving = this.page.findObjectNear(point, lockedRadius, this.page.objects.filter((o) => o instanceof Dot && o.locked));
    this.moving || (this.moving = this.page.findObjectNear(point, unlockedRadius, this.page.objects.filter((o) => o instanceof Dot)));
    if (Config.toggleLockOnTap && this.moving)
      this.moving.locked = false;
  }
  extendStroke(point) {
    if (this.startMove && Vec.dist(point, this.startMove) < 5)
      return;
    this.startMove = void 0;
    this.moving?.at(point);
    if (Config.lockOnMove && this.moving)
      this.moving.locked = true;
  }
  endStroke() {
    if (Config.unlockOnMoveEnd && this.moving)
      this.moving.locked = false;
  }
}
