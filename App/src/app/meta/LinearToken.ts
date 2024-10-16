import SVG from "../Svg"
import Token from "./Token"
import { GameObject } from "../GameObject"
import NumberToken from "./NumberToken"
import Vec from "../../lib/vec"
import * as constraints from "../Constraints"
import { generateId } from "../Core"

export type SerializedLinearToken = {
  type: "LinearToken"
}

export default class LinearToken extends Token {
  readonly id = generateId() // WHY DOES THIS NEED AN ID?
  width = 222
  height = 34

  private readonly elm = SVG.add("g", SVG.metaElm, { class: "linear-token" })
  private readonly boxElm = SVG.add("rect", this.elm, {
    class: "token-box",
    x: -2,
    y: -2,
    width: this.width,
    height: this.height
  })
  private readonly eq = SVG.add("text", this.elm, { class: "token-text", content: "=" })
  private readonly dot = SVG.add("text", this.elm, { class: "token-text", content: "•" })
  private readonly plus = SVG.add("text", this.elm, { class: "token-text", content: "+" })

  private y: NumberToken
  private m: NumberToken
  private x: NumberToken
  private b: NumberToken

  constructor() {
    super()
    this.y = this.adopt(new NumberToken(0))
    this.m = this.adopt(new NumberToken(1))
    this.x = this.adopt(new NumberToken(0))
    this.b = this.adopt(new NumberToken(0))
    this.m.variable.lock()
    this.b.variable.lock()
    const formula = constraints.linearFormula(this.m.variable, this.x.variable, this.b.variable)
    constraints.equals(this.y.variable, formula.result)
  }

  static deserialize(v: SerializedLinearToken): LinearToken {}
  serialize(): SerializedLinearToken {
    return {
      type: "LinearToken"
    }
  }

  render(dt: number, t: number): void {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this.position)
    })

    let p = { x: 0, y: 0 }
    this.y.position = Vec.add(this.position, p)
    p.x += this.y.width
    SVG.update(this.eq, { transform: SVG.positionToTransform(p) })
    p.x += 25
    this.m.position = Vec.add(this.position, p)
    p.x += this.m.width
    SVG.update(this.dot, { transform: SVG.positionToTransform(p) })
    p.x += 25
    this.x.position = Vec.add(this.position, p)
    p.x += this.x.width
    SVG.update(this.plus, { transform: SVG.positionToTransform(p) })
    p.x += 25
    this.b.position = Vec.add(this.position, p)
    p.x += this.b.width + 5
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
