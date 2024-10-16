import Token from "./Token"
import { WirePort } from "./WirePort"
import { MetaNumber } from "./MetaSemantics"
import SVG from "../Svg"
import { Variable } from "../Constraints"
import * as constraints from "../Constraints"
import { GameObject } from "../GameObject"
import { Position } from "../../lib/types"

export type SerializedNumberToken = {
  type: "NumberToken"
  position: Position
  variableId: number
}

export default class NumberToken extends Token {
  static create(value = 1) {
    const variable = constraints.variable(value)
    const object = NumberToken._create(variable)
    variable.represents = {
      object,
      property: "number-token-value"
    }
    return object
  }

  static _create(variable: Variable) {
    return new NumberToken(variable)
  }

  // Rendering stuff
  private lastRenderedValue = ""
  protected readonly elm = SVG.add("g", SVG.metaElm, { class: "number-token" })
  protected readonly boxElm = SVG.add("rect", this.elm, { class: "token-box", height: this.height })
  protected readonly wholeElm = SVG.add("text", this.elm, { class: "token-text" })
  protected readonly fracElm = SVG.add("text", this.elm, { class: "token-frac-text" })

  // Meta stuff
  wirePort: WirePort

  constructor(readonly variable: Variable) {
    super()
    this.wirePort = new WirePort(this.position, new MetaNumber(this.variable))
  }

  static deserialize(v: SerializedNumberToken): NumberToken {
    const nt = this._create(Variable.withId(v.variableId))
    nt.position = v.position
    return nt
  }

  serialize(): SerializedNumberToken {
    return {
      type: "NumberToken",
      position: this.position,
      variableId: this.variable.id
    }
  }

  render(dt: number, t: number): void {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this.position),
      "is-locked": this.getVariable().isLocked
    })

    this.wirePort.position = this.midPoint()

    // getComputedTextLength() is slow, so we're gonna do some dirty checking here
    const newValue = this.variable.value.toFixed(2)

    if (newValue === this.lastRenderedValue) return

    this.lastRenderedValue = newValue

    const [whole, frac] = newValue.split(".")

    SVG.update(this.wholeElm, { content: whole, visibility: "visible" })
    SVG.update(this.fracElm, { content: frac, visibility: "visible" })

    const wholeWidth = this.wholeElm.getComputedTextLength()
    const fracWidth = this.fracElm.getComputedTextLength()

    this.width = 5 + wholeWidth + 2 + fracWidth + 5

    SVG.update(this.boxElm, { width: this.width })
    SVG.update(this.fracElm, { dx: wholeWidth + 2 })
  }

  getVariable() {
    return this.variable
  }

  onTap() {
    this.getVariable().toggleLock()
  }

  remove() {
    this.variable.remove()
    this.elm.remove()
    super.remove()
  }
}

export const isNumberToken = (token: Token | null): token is NumberToken => token instanceof NumberToken
export const aNumberToken = (gameObj: GameObject) => (gameObj instanceof NumberToken ? gameObj : null)
