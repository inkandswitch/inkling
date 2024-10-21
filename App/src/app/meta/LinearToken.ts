import SVG from "../Svg"
import Token from "./Token"
import { GameObject } from "../GameObject"
import NumberToken, { SerializedNumberToken } from "./NumberToken"
import Vec from "../../lib/vec"
import * as constraints from "../Constraints"
import { generateId } from "../Root"
import { deserialize } from "../Deserialize"
import { Position } from "../../lib/types"

export type SerializedLinearToken = {
  type: "LinearToken"
  id: number
  position: Position
  y: SerializedNumberToken
  m: SerializedNumberToken
  x: SerializedNumberToken
  b: SerializedNumberToken
}

export default class LinearToken extends Token {
  static create() {
    const lt = this._create(
      generateId(),
      NumberToken.create(0),
      NumberToken.create(1),
      NumberToken.create(0),
      NumberToken.create(0)
    )
    lt.m.variable.lock()
    lt.b.variable.lock()
    const formula = constraints.linearFormula(lt.m.variable, lt.x.variable, lt.b.variable)
    constraints.equals(lt.y.variable, formula.result)
    lt.render(0, 0)
    return lt
  }

  static _create(id: number, y: NumberToken, m: NumberToken, x: NumberToken, b: NumberToken) {
    return new LinearToken(id, y, m, x, b)
  }

  width = 222
  height = 34

  private readonly elm = SVG.add("g", SVG.metaElm, { class: "linear-token" })
  private readonly boxElm = SVG.add("rect", this.elm, {
    class: "hollow-box",
    x: -2,
    y: -2,
    width: this.width,
    height: this.height
  })
  private readonly eq = SVG.add("text", this.elm, { class: "token-text", content: "=" })
  private readonly times = SVG.add("text", this.elm, { class: "token-text", content: "×" })
  private readonly plus = SVG.add("text", this.elm, { class: "token-text", content: "+" })

  constructor(
    id: number,
    readonly y: NumberToken,
    readonly m: NumberToken,
    readonly x: NumberToken,
    readonly b: NumberToken
  ) {
    super(id)
    this.adopt(y)
    this.adopt(m)
    this.adopt(x)
    this.adopt(b)
  }

  static deserialize(v: SerializedLinearToken): LinearToken {
    const lt = this._create(
      v.id,
      deserialize(v.y) as NumberToken,
      deserialize(v.m) as NumberToken,
      deserialize(v.x) as NumberToken,
      deserialize(v.b) as NumberToken
    )
    lt.position = v.position
    return lt
  }

  serialize(): SerializedLinearToken {
    return {
      type: "LinearToken",
      id: this.id,
      position: this.position,
      y: this.y.serialize(),
      m: this.m.serialize(),
      x: this.x.serialize(),
      b: this.b.serialize()
    }
  }

  render(dt: number, t: number): void {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this.position)
    })

    let p = { x: 0, y: 0 }
    this.m.position = Vec.add(this.position, p)
    p.x += this.m.width

    SVG.update(this.times, { transform: SVG.positionToTransform(p) })
    p.x += 25

    this.x.position = Vec.add(this.position, p)
    p.x += this.x.width

    SVG.update(this.plus, { transform: SVG.positionToTransform(p) })
    p.x += 25

    this.b.position = Vec.add(this.position, p)
    p.x += this.b.width + 5

    SVG.update(this.eq, { transform: SVG.positionToTransform(p) })
    p.x += 25

    this.y.position = Vec.add(this.position, p)
    p.x += this.y.width

    this.width = p.x
    SVG.update(this.boxElm, { width: this.width })

    for (const child of this.children) {
      child.render(dt, t)
    }
  }

  remove() {
    this.y.remove()
    this.m.remove()
    this.x.remove()
    this.b.remove()
    this.elm.remove()
    super.remove()
  }
}

export const aLinearToken = (gameObj: GameObject) => (gameObj instanceof LinearToken ? gameObj : null)
