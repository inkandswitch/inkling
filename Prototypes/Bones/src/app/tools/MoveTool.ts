import { PositionWithPressure, PositionWithRadius } from "../../lib/types";
import Page from "../Page";
import SVG, { updateSvgElement } from "../Svg";
import Bone from "../strokes/Bone";
import Stroke from "../strokes/Stroke";
import { Tool } from "./Tool";
import { lerp } from "../../lib/math";

export default class Move extends Tool {
  moving?: Bone;
  debug: SVGElement;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);

    this.debug = svg.addElement("circle", { r: 0, fill: "black", cx: 0, cy: 0 });
  }

  startStroke(point: PositionWithPressure) {
    this.moving = this.page.findObjectNear(
      point,
      20,
      this.page.objects.filter((o) => o instanceof Bone)
    );
  }

  extendStroke(point: PositionWithPressure) {
    if (!this.moving) return;
    this.moving.move(point, 0, this.page);
  }

  endStroke() {
    this.moving = undefined;
  }

  startFinger(point: PositionWithRadius) {
    this.moving = this.page.findObjectNear(
      point,
      20,
      this.page.objects.filter((o) => o instanceof Bone)
    );
  }

  moveFinger(point: PositionWithRadius) {
    if (!this.moving) return;
    this.moving.move(point, 0, this.page);
  }

  endFinger() {
    this.moving = undefined;
  }
}
