import SVG from "../Svg"
import { Position } from "../../lib/types"
import { GameObject } from "../GameObject"
import Rect from "../../lib/rect"
import { distanceToPath } from "../../lib/helpers"
import StrokeGroup from "./StrokeGroup"

export type SerializedStroke = {
  type: "Stroke"
  points: Position[]
}

export default class Stroke extends GameObject {
  protected element = SVG.add("polyline", SVG.inkElm, { class: "stroke" })

  constructor(public points: Position[] = []) {
    super()
  }

  static deserialize(v: SerializedStroke): Stroke {
    return new Stroke(v.points)
  }

  serialize(): SerializedStroke {
    return { type: "Stroke", points: this.points }
  }

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
