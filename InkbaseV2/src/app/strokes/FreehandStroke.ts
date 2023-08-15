import Vec from "../../lib/vec";
import TransformationMatrix from "../../lib/transform_matrix";

import SVG, { generatePathFromPoints, updateSvgElement } from "../Svg";
import generateId from "../generateId";
import { PositionWithPressure } from "../../lib/types";
import { farthestPair, notNull } from "../../lib/helpers";
import Handle from "./Handle";

export const strokeSvgProperties = {
  stroke: "rgba(0, 0, 0, .5)",
  // fill: 'rgba(0, 0, 0, .5)',
  // 'stroke-width': 1,
  fill: "none",
  "stroke-width": 2,
};

export default class FreehandStroke {
  readonly id = generateId();
  private readonly pointData: Array<PositionWithPressure | null>;
  private readonly element: SVGElement;
  private needsRerender = true;

  constructor(
    svg: SVG,
    public points: Array<PositionWithPressure | null>,
    private aId: number,
    private bId: number
  ) {
    const [aPos, bPos] = farthestPair(this.points.filter(notNull));
    this.a.setPosition(aPos);
    this.b.setPosition(bPos);

    // Store normalised point data based on control points
    const transform = new TransformationMatrix().fromLine(aPos, bPos).inverse();
    this.pointData = points.map((p) => {
      if (p === null) {
        return null;
      } else {
        const np = transform.transformPoint(p);
        return { ...np, pressure: p.pressure };
      }
    });

    this.element = svg.addElement("path", {
      d: "",
      ...strokeSvgProperties,
    });
  }

  get a() {
    return Handle.get(this.aId);
  }

  get b() {
    return Handle.get(this.bId);
  }

  currentAngle() {
    return Vec.angle(Vec.sub(this.b.position, this.a.position));
  }

  updatePath() {
    const transform = new TransformationMatrix().fromLine(this.a.position, this.b.position);

    this.points = this.pointData.map((p) => {
      if (p === null) {
        return null;
      }
      const np = transform.transformPoint(p);
      return { ...np, pressure: p.pressure };
    });
    const path = generatePathFromPoints(this.points);
    updateSvgElement(this.element, { d: path });
  }

  onHandleMoved() {
    this.needsRerender = true;
  }

  onHandleRemoved() {
    // no op
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    this.updatePath();
    this.needsRerender = false;
  }
}
