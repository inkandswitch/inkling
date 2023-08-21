import Vec from "../../lib/vec";
import { Position, PositionWithPressure } from "../../lib/types";
import Events, { PencilEvent } from "../NativeEvents";
import Page from "../Page";
import SVG from "../Svg";
import PullableStroke from "../strokes/PullableStroke";
import Point from "../strokes/Point";
import { Tool } from "./Tool";

type Mode = "unistroke" | "multistroke";

export default class Pull extends Tool {
  stroke?: PullableStroke;
  point?: Point;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
  }

  startStroke(point: PositionWithPressure) {
    this.point = this.page.findPointNear(point)!;

    if (this.point) {
      this.stroke = this.point.stroke;
    } else {
      const start = this.page.addPoint(point);
      const end = this.page.addPoint(point);
      this.point = end;
      this.stroke = new PullableStroke(this.svg, start, end, [point]);
      this.page.addStroke(this.stroke);
    }
  }

  extendStroke(point: PositionWithPressure) {
    if (!this.stroke) return;
    if (!this.point) return;
    if (Vec.dist(point, this.point!.position) < 1) return;

    if (this.point == this.stroke.end) {
      this.stroke.points.push(point);
      if (this.stroke.finished) this.stroke.points.shift();
    } else {
      this.stroke.points.unshift(point);
      if (this.stroke.finished) this.stroke.points.pop();
    }
    this.stroke.dirty = true;
  }

  endStroke() {
    if (!this.stroke) return;
    this.stroke.finished = true;
    this.stroke = undefined;
    this.point = undefined;
  }
}
