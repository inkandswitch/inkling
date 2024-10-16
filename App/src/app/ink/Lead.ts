import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { GameObject } from "../GameObject"
import Handle from "./Handle"
import Stroke from "./Stroke"
import StrokeGroup from "./StrokeGroup"

export type SerializedLead = {
  type: "Lead"
  handleId: number
}

export default class Lead extends GameObject {
  static create(position: Position) {
    return this._create(Handle.create(position))
  }

  static _create(handle: Handle) {
    return new Lead(handle)
  }

  stroke?: Stroke
  lastPos?: Position

  constructor(readonly handle: Handle) {
    super()
    this.adopt(handle)
  }

  distanceToPoint(point: Position) {
    return this.handle.distanceToPoint(point)
  }

  serialize(): SerializedLead {
    return {
      type: "Lead",
      handleId: this.handle.id
    }
  }
  static deserialize(v: SerializedLead) {
    return Lead._create(Handle.withId(v.handleId))
  }

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
