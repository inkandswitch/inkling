import {updateSvgElement} from "../Svg.js";
import Point from "./Point.js";
export default class ControlPoint extends Point {
  constructor(svg, position, parent) {
    super(svg, position);
    this.parent = parent;
    updateSvgElement(this.elements.normal, {
      r: 5,
      fill: "rgba(100, 100, 100, .2)"
    });
  }
  setPosition(position) {
    super.setPosition(position);
    this.parent?.onControlPointMove(this);
  }
}
