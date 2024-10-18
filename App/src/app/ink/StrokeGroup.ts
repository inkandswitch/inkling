import { farthestPair } from "../../lib/helpers"
import TransformationMatrix from "../../lib/TransformationMatrix"
import { Position } from "../../lib/types"
import { deserialize, SerializedGameObject } from "../Deserialize"
import { GameObject } from "../GameObject"
import Handle from "./Handle"
import Stroke, { aStroke } from "./Stroke"

export type SerializedStrokeGroup = {
  type: "StrokeGroup"
  children: SerializedGameObject[]
}

export default class StrokeGroup extends GameObject {
  private pointData: Position[][]

  // These strong references are OK b/c a and b will always be my children
  readonly a: Handle
  readonly b: Handle

  constructor(strokes: Set<Stroke>, a?: Handle, b?: Handle) {
    super()

    for (const stroke of strokes) {
      this.adopt(stroke)
    }

    // Generate Handles
    if (a == null || b == null) {
      const points = this.strokes.flatMap((stroke) => stroke.points)
      ;[a, b] = farthestPair(points).map((pos) => Handle.create(pos))
    }
    a.getAbsorbedByNearestHandle()
    b.getAbsorbedByNearestHandle()
    this.a = this.adopt(a)
    this.b = this.adopt(b)
    this.pointData = this.generatePointData()
  }

  static deserialize(v: SerializedStrokeGroup): StrokeGroup {
    const strokes = new Set<Stroke>()
    const handles: Handle[] = []
    for (const c of v.children) {
      if (c.type === "Handle") {
        handles.push(deserialize(c) as Handle)
      } else if (c.type === "Stroke") {
        strokes.add(deserialize(c) as Stroke)
      }
    }
    const [a, b] = handles
    return new StrokeGroup(strokes, a, b)
  }

  serialize(): SerializedStrokeGroup {
    return {
      type: "StrokeGroup",
      children: Array.from(this.children).map((c) => c.serialize())
    }
  }

  generatePointData() {
    const transform = TransformationMatrix.fromLine(this.a.position, this.b.position).inverse()
    this.pointData = this.strokes.map((stroke) => stroke.points.map((p) => transform.transformPoint(p)))
    return this.pointData
  }

  get strokes(): Stroke[] {
    return this.findAll({ what: aStroke, recursive: false })
  }

  private updatePaths() {
    const transform = TransformationMatrix.fromLine(this.a.position, this.b.position)

    for (const [i, stroke] of this.strokes.entries()) {
      const newPoints = this.pointData[i].map((p) => transform.transformPoint(p))
      stroke.updatePath(newPoints)
    }
  }

  distanceToPoint(pos: Position) {
    let minDistance: number | null = null
    for (const stroke of this.strokes) {
      const dist = stroke.distanceToPoint(pos)
      if (dist === null) {
        continue
      } else if (minDistance === null) {
        minDistance = dist
      } else {
        minDistance = Math.min(minDistance, dist)
      }
    }
    return minDistance
  }

  render(dt: number, t: number) {
    // TODO: Ivan to speed this up if necessary
    this.updatePaths()

    for (const child of this.children) {
      child.render(dt, t)
    }
  }

  breakApart() {
    const strokes = []
    let stroke
    while ((stroke = this.strokes.pop())) {
      strokes.push(stroke)
      this.parent?.adopt(stroke)
    }
    this.remove()
    return strokes
  }

  remove() {
    this.a.remove()
    this.b.remove()
    for (const s of this.strokes) {
      s.remove()
    }
    super.remove()
  }
}

export const aStrokeGroup = (gameObj: GameObject) => (gameObj instanceof StrokeGroup ? gameObj : null)
