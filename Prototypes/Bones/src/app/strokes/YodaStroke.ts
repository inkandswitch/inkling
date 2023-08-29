import SVG from "../Svg";
import generateId from "../generateId";
import { PositionWithPressure } from "../../lib/types";
import Point from "./Point";
import Stroke from "./Stroke";

export default class PullableStroke extends Stroke {
  id = generateId();
  element: SVGElement;
  dirty = true;
  finished = false;
  age = 0;
  deadPoints: PositionWithPressure[] = [];

  constructor(svg: SVG, public start: Point, public end: Point, points: PositionWithPressure[]) {
    super(svg, points);
    start.stroke = this;
    end.stroke = this;

    this.element = SVG.add("polyline", {
      stroke: "black",
      "stroke-width": 2,
    });
  }

  updatePoints() {
    this.start.setPosition(this.points[0].position);
    this.end.setPosition(this.points[this.points.length - 1].position);
  }

  render() {
    this.dirty = false;
    SVG.update(this.element, { points: SVG.points(this.points) });

    // this.deadPoints.forEach((p) => {
    //   SVG.now("circle", { cx: p.x, cy: p.y, fill: p.color, r: 2 });
    // });
  }
}
