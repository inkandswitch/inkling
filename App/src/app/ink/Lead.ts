import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { GameObject } from "../GameObject"
import Handle from "./Handle"
import Stroke from "./Stroke"
import StrokeGroup from "./StrokeGroup"

export default class Lead extends Handle {
  stroke?: Stroke
  lastPos?: Position

  static create(position: Position): Lead {
    const lead = new Lead(position)
    lead.getAbsorbedByNearestHandle()
    return lead
  }

  render(dt: number, t: number) {
    this.lastPos ??= Vec.clone(this.position)
    if (!Vec.equal(this.position, this.lastPos)) {
      this.lastPos = Vec.clone(this.position)
      if (this.stroke == null || this.stroke.parent == null || this.stroke.parent instanceof StrokeGroup) {
        this.stroke = this.root.adopt(new Stroke())
      }
      this.stroke.points.push(Vec.clone(this.position))
    }

    super.render(dt, t)
  }
}

export const aLead = (gameObj: GameObject) => (gameObj instanceof Lead ? gameObj : null)
