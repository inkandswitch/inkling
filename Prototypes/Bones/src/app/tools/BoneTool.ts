import Vec from "../../lib/vec";
import { Position, PositionWithPressure } from "../../lib/types";
import Page from "../Page";
import SVG from "../Svg";
import Boney from "../strokes/Bone";
import { Tool } from "./Tool";

export default class Bone extends Tool {
  bone?: Boney;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
  }

  startStroke(point: Position) {
    let bones: Boney[] = this.page.objects.filter((b) => b instanceof Boney);
    let parent = bones.find((b) => Vec.dist(point, b.target) < 30);
    if (parent) {
      point = parent.target;
    }
    this.bone = this.page.addObject(new Boney(this.svg, point, point, parent));
  }

  extendStroke(point: PositionWithPressure) {
    if (this.bone) this.bone.target = point;
  }

  endStroke() {
    this.bone?.finish();
    this.bone = undefined;
  }
}
