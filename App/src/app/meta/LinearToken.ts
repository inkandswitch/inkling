import SVG from "../Svg"
import { generateId } from "../../lib/helpers"
import Token from "./Token"
import { GameObject } from "../GameObject"
import NumberToken from "./NumberToken"
import Vec from "../../lib/vec"

export default class LinearToken extends Token {
  readonly id = generateId()
  width = 222
  height = 34

  protected readonly elm = SVG.add("g", SVG.metaElm, { class: "linear-token" })
  protected readonly boxElm = SVG.add("rect", this.elm, {
    class: "token-box",
    x: -2,
    y: -2,
    width: this.width,
    height: this.height
  })
  protected readonly textElm = SVG.add("text", this.elm, { class: "token-text" })

  protected y: NumberToken
  protected m: NumberToken
  protected x: NumberToken
  protected b: NumberToken

  constructor() {
    super()
    this.y = this.adopt(new NumberToken(0))
    this.m = this.adopt(new NumberToken(1))
    this.x = this.adopt(new NumberToken(0))
    this.b = this.adopt(new NumberToken(0))
    this.m.variable.lock()
    this.b.variable.lock()
  }

  render(dt: number, t: number): void {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this.position)
    })

    this.y.position = Vec.add(this.position, Vec(0, 0))
    this.m.position = Vec.add(this.position, Vec(60, 0))
    this.x.position = Vec.add(this.position, Vec(120, 0))
    this.b.position = Vec.add(this.position, Vec(180, 0))

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
