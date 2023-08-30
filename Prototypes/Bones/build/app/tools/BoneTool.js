import Vec from "../../lib/vec.js";
import Dot from "../strokes/Dot.js";
import Boney from "../strokes/Bone.js";
import {Tool} from "./Tool.js";
import MoveTool from "./MoveTool.js";
import Config from "../Config.js";
export default class Bone extends Tool {
  constructor(svg, buttonX, buttonY, page) {
    super(svg, buttonX, buttonY);
    this.page = page;
    this.startFinger = (p) => MoveTool.instance?.startFinger(p);
    this.moveFinger = (p) => MoveTool.instance?.moveFinger(p);
    this.endFinger = () => MoveTool.instance?.endFinger();
  }
  startStroke(point) {
    if (Config.attachStartToExistingDot) {
      this.dot = this.page.findObjectTypeNear(point, Config.attachDist, Dot);
    }
    this.dot || (this.dot = this.page.addObject(new Dot(point)));
    if (Config.lockStartDot) {
      this.dot.locked = true;
    }
  }
  extendStroke(point) {
    if (!this.dot)
      return;
    if (Vec.dist(point, this.dot) > Config.dotSpacing) {
      let otherDot;
      if (Config.boneIntersection) {
        otherDot = this.page.findObjectNear(point, Config.dotSpacing, this.page.objects.filter((o) => o instanceof Dot && o !== this.dot));
      }
      otherDot || (otherDot = this.page.addObject(new Dot(point)));
      this.page.addObject(new Boney(this.dot, otherDot));
      this.dot = otherDot;
    } else if (Config.tug && !this.dot.locked) {
      this.dot.at(point);
    }
  }
  endStroke() {
    if (!this.dot)
      return;
    if (Config.lockEndDot) {
      this.dot.locked = true;
    }
    if (Config.attachEndToExistingDot) {
      let nearest = this.page.findObjectNear(this.dot, Config.attachDist, this.page.objects.filter((o) => o instanceof Dot && o !== this.dot));
      if (nearest) {
        this.page.addObject(new Boney(this.dot, nearest));
      }
    }
    this.dot = void 0;
  }
}
