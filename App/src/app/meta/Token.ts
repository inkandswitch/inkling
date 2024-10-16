import { GameObject } from "../GameObject"
import { Position } from "../../lib/types"

import { signedDistanceToBox } from "../../lib/SignedDistance"
import Vec from "../../lib/vec"
import { Root } from "../Root"

export default abstract class Token extends GameObject {
  static withId(id: number) {
    const token = Root.current.find({ what: aToken, that: (t) => t.id === id })
    if (token == null) {
      throw new Error("coudln't find token w/ id " + id)
    }
    return token
  }

  position: Position = { x: 100, y: 100 }
  width = 90
  height = 30

  constructor(readonly id: number) {
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
