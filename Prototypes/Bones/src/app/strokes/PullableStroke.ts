import Vec, { Vector } from "../../lib/vec";
import SVG, { updateSvgElement } from "../Svg";
import generateId from "../generateId";
import { PositionWithPressure } from "../../lib/types";
import Point from "./Point";
import Stroke from "./Stroke";

export default class PullableStroke extends Stroke {
  id = generateId();
  element: SVGElement;
  dirty = true;
  finished = false;

  constructor(svg: SVG, public start: Point, public end: Point, points: PositionWithPressure[]) {
    super(svg, points);
    start.stroke = this;
    end.stroke = this;

    this.element = svg.addElement("polyline", {
      stroke: "black",
      "stroke-width": 2,
    });
  }

  updatePath() {
    this.start.setPosition(this.points[0].position);
    this.end.setPosition(this.points[this.points.length - 1].position);
    updateSvgElement(this.element, { points: toPath(this.points) });
  }

  render() {
    this.updatePath();
    this.dirty = false;
  }
}

function toPath(points: Vector[]) {
  return points
    .map((p) => [p.x, p.y])
    .flat()
    .join(" ");
}
