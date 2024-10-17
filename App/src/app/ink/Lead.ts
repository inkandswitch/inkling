import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { GameObject } from "../GameObject"
import Handle, { SerializedHandle } from "./Handle"
import Stroke from "./Stroke"
import StrokeGroup from "./StrokeGroup"

export type SerializedLead = {
  type: "Lead"
  handle: SerializedHandle
}

export default class Lead extends GameObject {
  static create(position: Position) {
    return new Lead(Handle.create(position))
  }

  stroke?: Stroke
  lastPos?: Position

  constructor(readonly handle: Handle) {
    super()
    this.adopt(handle)
    handle.getAbsorbedByNearestHandle()
  }

  distanceToPoint(point: Position) {
    return this.handle.distanceToPoint(point)
  }

  serialize(): SerializedLead {
    return {
      type: "Lead",
      handle: this.handle.serialize()
    }
  }

  static deserialize(v: SerializedLead) {
    return new Lead(Handle.deserialize(v.handle))
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

  override remove() {
    this.stroke?.remove()
    this.handle.remove()
  }
}

export const aLead = (gameObj: GameObject) => (gameObj instanceof Lead ? gameObj : null)
