import SVG from "../Svg"
import { Position } from "../../lib/types"
import { GameObject } from "../GameObject"
import Rect from "../../lib/rect"
import { distanceToPath } from "../../lib/helpers"
import StrokeGroup from "./StrokeGroup"

export default class Stroke extends GameObject {
  public points: Position[] = []

  protected element = SVG.add("polyline", SVG.inkElm, { class: "stroke" })

  updatePath(newPoints: Array<Position>) {
    this.points = newPoints
  }

  render() {
    SVG.update(this.element, { points: SVG.points(this.points) })
  }

  becomeGroup() {
    if (!(this.parent instanceof StrokeGroup)) {
      // Heisenbug warning: putting "new StrokeGroup(...)" in a local variable
      // breaks this! WAT
      return this.parent?.adopt(new StrokeGroup(new Set([this])))
    }
    return undefined
  }

  distanceToPoint(point: Position) {
    return distanceToPath(point, this.points)
  }

  overlapsRect(rect: Rect): boolean {
    for (const point of this.points) {
      if (Rect.isPointInside(rect, point)) {
        return true
      }
    }
    return false
  }

  remove() {
    this.element.remove()
    super.remove()
  }
}

export const aStroke = (gameObj: GameObject) => (gameObj instanceof Stroke ? gameObj : null)
