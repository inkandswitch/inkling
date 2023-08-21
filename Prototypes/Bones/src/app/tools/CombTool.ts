import { PositionWithPressure } from "../../lib/types";
import Events, { PencilEvent } from "../NativeEvents";
import Page from "../Page";
import SVG from "../Svg";
import CombStroke from "../strokes/CombStroke";
import { Tool } from "./Tool";

type Mode = "unistroke" | "multistroke";

export default class Comb extends Tool {
  stroke?: CombStroke;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
  }

  startStroke(point: PositionWithPressure) {
    this.stroke = this.page.addStroke(new CombStroke(this.svg, [point]));
  }

  extendStroke(point: PositionWithPressure) {
    if (this.stroke) {
      this.stroke.points.push(point);
      this.stroke.dirty = true;
    }
  }

  endStroke() {
    this.stroke = undefined;
  }
}
