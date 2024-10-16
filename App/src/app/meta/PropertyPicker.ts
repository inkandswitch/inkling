import Token from "./Token"
import SVG from "../Svg"
import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { GameObject } from "../GameObject"
import { Variable } from "../Constraints"
import { Pluggable } from "./Pluggable"
import { generateId } from "../Root"

const TAB_SIZE = 5

function PropertyPickerPath(pos: Position, w: number, h: number) {
  return `
    M ${pos.x + TAB_SIZE} ${pos.y}
    L ${pos.x + w} ${pos.y}
    L ${pos.x + w} ${pos.y + h}
    L ${pos.x + TAB_SIZE} ${pos.y + h}
    L ${pos.x} ${pos.y + h / 2}
    L ${pos.x + TAB_SIZE} ${pos.y}
  `
}

export type SerializedPropertyPicker = {
  type: "PropertyPicker"
  id: number
  propertyName: string
  variableId: number
}

export default class PropertyPicker extends Token implements Pluggable {
  static create(propertyName: string, variable: Variable) {
    return this._create(generateId(), propertyName, variable)
  }

  static _create(id: number, propertyName: string, variable: Variable) {
    return new this(id, propertyName, variable)
  }

  protected readonly boxElement = SVG.add("path", SVG.metaElm, {
    d: PropertyPickerPath(this.position, this.width, this.height),
    class: "property-picker-box"
  })

  protected readonly textElement = SVG.add("text", SVG.metaElm, {
    x: this.position.x + 5 + TAB_SIZE,
    y: this.position.y + 21,
    class: "property-picker-text"
  })

  readonly plugs: { output: Variable }

  private constructor(id: number, readonly propertyName: string, readonly variable: Variable) {
    super(id)
    SVG.update(this.textElement, { content: propertyName })
    this.width = this.textElement.getComputedTextLength() + 10 + TAB_SIZE
    this.plugs = { output: variable }
  }

  getPlugPosition(id: string): Position {
    return id === "input" ? Vec.add(this.position, Vec(0, this.height / 2)) : this.midPoint()
  }

  // Alias this so we conform to TokenWithVariable

  static deserialize(v: SerializedPropertyPicker): PropertyPicker {
    return this._create(v.id, v.propertyName, Variable.withId(v.variableId))
  }

  serialize(): SerializedPropertyPicker {
    return {
      type: "PropertyPicker",
      id: this.id,
      propertyName: this.propertyName,
      variableId: this.variable.id
    }
  }

  render() {
    SVG.update(this.boxElement, {
      d: PropertyPickerPath(this.position, this.width, this.height)
    })

    SVG.update(this.textElement, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21
    })
  }

  remove() {
    this.boxElement.remove()
    this.textElement.remove()
    super.remove()
  }
}

export const aPropertyPicker = (gameObj: GameObject) => (gameObj instanceof PropertyPicker ? gameObj : null)
