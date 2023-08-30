import { Position } from "../../lib/types";
import Vec from "../../lib/vec";
import Page from "../Page";
import SVG from "../Svg";
import Dot from "../strokes/Dot";
import Boney from "../strokes/Bone";
import { Tool } from "./Tool";
import MoveTool from "./MoveTool";
import Config from "../Config";

export default class Bone extends Tool {
  dot?: Dot;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
  }

  startStroke(point: Position) {
    if (Config.attachStartToExistingDot) {
      this.dot = this.page.findObjectTypeNear(point, Config.attachDist, Dot);
    }

    this.dot ||= this.page.addObject(new Dot(point));

    if (Config.lockStartDot) {
      this.dot!.locked = true;
    }
  }

  extendStroke(point: Position) {
    if (!this.dot) return;

    if (Vec.dist(point, this.dot) > Config.dotSpacing) {
      let otherDot: Dot;

      if (Config.boneIntersection) {
        otherDot = this.page.findObjectNear(
          point,
          Config.dotSpacing,
          this.page.objects.filter((o) => o instanceof Dot && o !== this.dot)
        );
      }

      otherDot ||= this.page.addObject(new Dot(point));

      this.page.addObject(new Boney(this.dot, otherDot));
      this.dot = otherDot;
    } else if (Config.tug && !this.dot.locked) {
      this.dot.at(point);
    }
  }

  endStroke() {
    if (!this.dot) return;

    if (Config.lockEndDot) {
      this.dot.locked = true;
    }

    if (Config.attachEndToExistingDot) {
      let nearest = this.page.findObjectNear(
        this.dot,
        Config.attachDist,
        this.page.objects.filter((o: any) => o instanceof Dot && o !== this.dot)
      );

      if (nearest) {
        this.page.addObject(new Boney(this.dot, nearest));
      }
    }

    this.dot = undefined;
  }

  startFinger = (p) => MoveTool.instance?.startFinger(p);
  moveFinger = (p) => MoveTool.instance?.moveFinger(p);
  endFinger = () => MoveTool.instance?.endFinger();
}
