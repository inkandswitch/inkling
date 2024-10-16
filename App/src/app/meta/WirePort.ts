import { Position } from "../../lib/types"
import { MetaValue } from "./MetaSemantics"

export class WirePort {
  position: Position
  value: MetaValue

  constructor(position: Position, value: MetaValue) {
    this.position = position
    this.value = value
  }
}
