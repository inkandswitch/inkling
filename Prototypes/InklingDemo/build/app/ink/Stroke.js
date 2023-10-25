import SVG from "../Svg.js";
import {GameObject} from "../GameObject.js";
import Rect from "../../lib/rect.js";
import {distanceToPath} from "../../lib/helpers.js";
import StrokeGroup from "./StrokeGroup.js";
export default class Stroke extends GameObject {
  constructor() {
    super(...arguments);
    this.points = [];
    this.element = SVG.add("polyline", SVG.inkElm, {
      class: "stroke"
    });
  }
  updatePath(newPoints) {
    this.points = newPoints;
  }
  render() {
    SVG.update(this.element, {
      points: SVG.points(this.points)
    });
  }
  becomeGroup() {
    return this.parent?.adopt(new StrokeGroup(new Set([this])));
  }
  distanceToPoint(point) {
    return distanceToPath(point, this.points);
  }
  overlapsRect(rect) {
    for (const point of this.points) {
      if (Rect.isPointInside(rect, point)) {
        return true;
      }
    }
    return false;
  }
  remove() {
    this.element.remove();
    super.remove();
  }
}
export const aStroke = (gameObj) => gameObj instanceof Stroke ? gameObj : null;
