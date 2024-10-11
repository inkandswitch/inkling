import { GameObject } from "../GameObject"
import { Position } from "../../lib/types"

import { signedDistanceToBox } from "../../lib/SignedDistance"
import Vec from "../../lib/vec"

export default abstract class Token extends GameObject {
  position: Position = { x: 100, y: 100 }
  width = 90
  height = 30

  constructor() {
    super()
  }

  onTap() {
    // Override as needed.
    // We want all tokens to have this, even if it's a noop, to simplify gesture code.
    // We may eventually want to consider moving this method into GameObject.
  }

  distanceToPoint(pos: Position) {
    return signedDistanceToBox(this.position.x, this.position.y, this.width, this.height, pos.x, pos.y)
  }

  midPoint() {
    return Vec.add(this.position, Vec.half(Vec(this.width, this.height)))
  }

  render(dt: number, t: number): void {
    // NO-OP
  }
}

export const aToken = (gameObj: GameObject) => (gameObj instanceof Token ? gameObj : null)
