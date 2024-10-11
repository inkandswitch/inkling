import { Position } from "../../lib/types"
import { GameObject } from "../GameObject"
import { MetaValue } from "./MetaSemantics"

// TODO: maybe this shouldn't be a GameObject
export class WirePort extends GameObject {
  position: Position
  value: MetaValue

  constructor(position: Position, value: MetaValue) {
    super()
    this.position = position
    this.value = value
  }

  distanceToPoint(point: Position): null {
    return null
  }

  render(dt: number, t: number): void {}
}
