import { aStrokeGroup } from "./ink/StrokeGroup"
import Stroke from "./ink/Stroke"
import { Position } from "../lib/types"
import { GameObject } from "./GameObject"
import { MetaStruct } from "./meta/MetaSemantics"

export default class Page extends GameObject {
  readonly scope = new MetaStruct([])

  constructor() {
    super()
  }

  get strokeGroups() {
    return this.findAll({ what: aStrokeGroup, recursive: false })
  }

  addStroke<S extends Stroke>(stroke: S) {
    return this.adopt(stroke)
  }

  distanceToPoint(point: Position): null {
    return null
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t)
    }
  }
}
