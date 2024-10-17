import { Position } from "../../lib/types"
import * as constraints from "../Constraints"
import { Variable } from "../Constraints"
import { GameObject } from "../GameObject"
import { generateId } from "../Root"
import SVG from "../Svg"
import { Pluggable } from "./Pluggable"
import Token from "./Token"

export type SerializedNumberToken = {
  type: "NumberToken"
  id: number
  position: Position
  variableId: number
}

export default class NumberToken extends Token implements Pluggable {
  static create(value = 1) {
    const variable = constraints.variable(value)
    const object = NumberToken._create(generateId(), variable)
    variable.represents = {
      object,
      property: "number-token-value"
    }
    return object
  }

  static _create(id: number, variable: Variable) {
    return new NumberToken(id, variable)
  }

  // Rendering stuff
  private lastRenderedValue = ""
  protected readonly elm = SVG.add("g", SVG.metaElm, { class: "number-token" })
  protected readonly boxElm = SVG.add("rect", this.elm, { class: "token-box", height: this.height })
  protected readonly wholeElm = SVG.add("text", this.elm, { class: "token-text" })
  protected readonly fracElm = SVG.add("text", this.elm, { class: "token-frac-text" })

  readonly plugVars: { value: Variable }

  constructor(id: number, readonly variable: Variable) {
    super(id)
    this.plugVars = { value: variable }
  }

  getPlugPosition(id: string): Position {
    return this.midPoint()
  }

  static deserialize(v: SerializedNumberToken): NumberToken {
    const nt = this._create(v.id, Variable.withId(v.variableId))
    nt.position = v.position
    return nt
  }

  serialize(): SerializedNumberToken {
    return {
      type: "NumberToken",
      id: this.id,
      position: this.position,
      variableId: this.variable.id
    }
  }

  render(dt: number, t: number): void {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this.position),
      "is-locked": this.getVariable().isLocked
    })

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
