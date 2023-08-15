import { Position } from "../../lib/types";
import SVG, { updateSvgElement } from "../Svg";
import Point from "./Point";

export interface ControlPointListener {
  onControlPointMoved(controlPoint: ControlPoint): void;
}

export default class ControlPoint extends Point {
  listener?: ControlPointListener;

  constructor(svg: SVG, position: Position) {
    super(svg, position);
    updateSvgElement(this.elements.normal, {
      r: 5,
      fill: "rgba(100, 100, 100, .2)",
    });
  }

  setPosition(position: Position) {
    super.setPosition(position);
    this.listener?.onControlPointMoved(this);
  }
}
