import { Position } from "../../lib/types";
import SVG, { updateSvgElement } from "../Svg";
import Point from "./Point";

interface ControlPointParent {
  onControlPointMove(controlPoint: ControlPoint): void;
}

export default class ControlPoint extends Point {
  constructor(svg: SVG, position: Position, public parent?: ControlPointParent) {
    super(svg, position);
    updateSvgElement(this.elements.normal, {
      r: 5,
      fill: "rgba(100, 100, 100, 0 )",
    });
  }

  setPosition(position: Position) {
    super.setPosition(position);
    this.parent?.onControlPointMove(this);
  }
}
