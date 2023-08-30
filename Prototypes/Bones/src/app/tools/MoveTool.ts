import Vec from "../../lib/vec";
import { Position } from "../../lib/types";
import Page from "../Page";
import SVG from "../Svg";
import Dot from "../strokes/Dot";
import { Tool } from "./Tool";
import Config from "../Config";

export default class Move extends Tool {
  static instance: Move | undefined;

  moving?: Dot;
  startMove: Position | undefined;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
    Move.instance = this;
  }

  startStroke(
    point: Position,
    lockedRadius = Config.lockedRadiusPencil,
    unlockedRadius = Config.unlockedRadiusPencil
  ) {
    this.startMove = point;

    this.moving = this.page.findObjectNear(
      point,
      lockedRadius,
      this.page.objects.filter((o) => o instanceof Dot && o.locked)
    );
    this.moving ||= this.page.findObjectNear(
      point,
      unlockedRadius,
      this.page.objects.filter((o) => o instanceof Dot)
    );

    if (Config.toggleLockOnTap && this.moving) this.moving.locked = false;
  }

  extendStroke(point: Position) {
    if (this.startMove && Vec.dist(point, this.startMove) < 5) return;
    this.startMove = undefined;

    this.moving?.at(point);
    if (Config.lockOnMove && this.moving) this.moving.locked = true;
  }

  endStroke() {
    if (Config.unlockOnMoveEnd && this.moving) this.moving.locked = false;
  }

  startFinger = (point) =>
    this.startStroke(point, Config.lockedRadiusFinger, Config.unlockedRadiusFinger);
  moveFinger = this.extendStroke;
  endFinger = this.endStroke;
}
