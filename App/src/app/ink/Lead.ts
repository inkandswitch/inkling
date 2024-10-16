import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { GameObject } from "../GameObject"
import Handle from "./Handle"
import Stroke from "./Stroke"
import StrokeGroup from "./StrokeGroup"

export type SerializedLead = {
  type: "Lead"
}

export default class Lead extends GameObject {
  stroke?: Stroke
  lastPos?: Position
  handle: Handle

  constructor(position: Position) {
    super()
    this.handle = this.adopt(Handle.create(position))
  }

  distanceToPoint(point: Position) {
    return this.handle.distanceToPoint(point)
  }

  serialize(): SerializedLead {
    return {
      type: "Lead"
    }
  }
  static deserialize(v: SerializedLead) {}

  render(dt: number, t: number) {
    this.lastPos ??= Vec.clone(this.handle.position)
    if (!Vec.equal(this.handle.position, this.lastPos)) {
      this.lastPos = Vec.clone(this.handle.position)
      if (this.stroke == null || this.stroke.parent == null || this.stroke.parent instanceof StrokeGroup) {
        this.stroke = this.root.adopt(new Stroke())
      }
      this.stroke.points.push(Vec.clone(this.handle.position))
    }

    this.handle.render(dt, t)
  }
}

export const aLead = (gameObj: GameObject) => (gameObj instanceof Lead ? gameObj : null)
