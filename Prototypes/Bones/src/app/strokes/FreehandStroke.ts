import Vec, { Vector } from "../../lib/vec";
import TransformationMatrix from "../../lib/transform_matrix";

import SVG, { generatePathFromPoints, updateSvgElement } from "../Svg";
import generateId from "../generateId";
import ControlPoint from "./ControlPoint";
import { Position, PositionWithPressure } from "../../lib/types";
import { notNull } from "../../lib/helpers";
import Stroke from "./Stroke";

export const strokeSvgProperties = {
  stroke: "rgba(200, 140, 0, 1)",
  // fill: 'rgba(0, 0, 0, .5)',
  // 'stroke-width': 1,
  fill: "none",
  "stroke-width": 2,
};

export default class FreehandStroke extends Stroke {
  id = generateId();
  element: SVGElement;
  dirty = true;

  constructor(svg: SVG, points: Array<PositionWithPressure>) {
    super(svg, points);
    this.element = svg.addElement("polyline", {
      points: toPath(points),
      ...strokeSvgProperties,
    });
  }

  render() {
    if (!this.dirty) {
      return;
    }
    updateSvgElement(this.element, { points: toPath(this.points) });
    this.dirty = false;
  }
}

function toPath(points: Vector[]) {
  return points
    .map((p) => [p.x, p.y])
    .flat()
    .join(" ");
}
