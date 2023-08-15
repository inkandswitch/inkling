import Vec from "../../lib/vec";
import TransformationMatrix from "../../lib/transform_matrix";

import SVG, { generatePathFromPoints, updateSvgElement } from "../Svg";
import generateId from "../generateId";
import ControlPoint from "./ControlPoint";
import { Position, PositionWithPressure } from "../../lib/types";

export const strokeSvgProperties = {
  stroke: "rgba(0, 0, 0, .5)",
  // fill: 'rgba(0, 0, 0, .5)',
  // 'stroke-width': 1,
  fill: "none",
  "stroke-width": 2,
};

// TODO: move this somewhere we can use it again.
function notNull<T>(x: T | null): x is T {
  return x != null;
}

export default class FreehandStroke {
  id = generateId();
  controlPoints: ControlPoint[];
  points: Array<PositionWithPressure | null>;
  pointData: Array<PositionWithPressure | null>;
  element: SVGElement;
  dirty = true;

  constructor(
    svg: SVG,
    points: Array<PositionWithPressure | null>,
    cp1: ControlPoint,
    cp2: ControlPoint
  ) {
    const [cp1Pos, cp2Pos] = farthestPair(points.filter(notNull));
    cp1.setPosition(cp1Pos);
    cp2.setPosition(cp2Pos);
    this.controlPoints = [cp1, cp2];

    this.points = points;

    // Store normalised point data based on control points
    const transform = new TransformationMatrix().fromLine(cp1Pos, cp2Pos).inverse();
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

  currentAngle() {
    return Vec.angle(Vec.sub(this.controlPoints[1].position, this.controlPoints[0].position));
  }

  updatePath() {
    const transform = new TransformationMatrix().fromLine(
      this.controlPoints[0].position,
      this.controlPoints[1].position
    );

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

  onControlPointMoved() {
    this.dirty = true;
  }

  render() {
    if (!this.dirty) {
      return;
    }

    this.updatePath();
    this.dirty = false;
  }
}

// this is O(n^2), but there is a O(n * log(n)) solution
// that we can use if this ever becomes a bottleneck
// https://www.baeldung.com/cs/most-distant-pair-of-points
function farthestPair(points: Position[]): [Position, Position] {
  let maxDist = -Infinity;
  let mdp1: Position | null = null;
  let mdp2: Position | null = null;
  for (const p1 of points) {
    for (const p2 of points) {
      const d = Vec.dist(p1, p2);
      if (d > maxDist) {
        mdp1 = p1;
        mdp2 = p2;
        maxDist = d;
      }
    }
  }
  return [mdp1!, mdp2!];
}
