import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import * as constraints from "../Constraints"
import { Variable } from "../Constraints"
import { GameObject } from "../GameObject"
import { generateId } from "../Root"
import SVG from "../Svg"
import { Pluggable } from "./Pluggable"
import Token from "./Token"

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
  propertyName: PropertyName
  variableId: number
  position: Position
}

type PropertyName = "distance" | "angleInDegrees"

export default class PropertyPicker extends Token implements Pluggable {
  static create(propertyName: PropertyName, value = 0) {
    const variable = constraints.variable(value)
    const picker = new PropertyPicker(generateId(), propertyName, variable, Vec(100, 100))
    variable.represents = {
      object: picker,
      property: "value"
    }
    return picker
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

  readonly plugVars: { value: Variable }

  private constructor(
    id: number,
    readonly propertyName: PropertyName,
    readonly variable: Variable,
    position: Position
  ) {
    super(id)
    SVG.update(this.textElement, { content: propertyName.replace("InDegrees", "").replace("distance", "length") })
    this.width = this.textElement.getComputedTextLength() + 10 + TAB_SIZE
    this.plugVars = { value: variable }
    this.position = position
  }

  getPlugPosition(id: string): Position {
    return id === "input" ? Vec.add(this.position, Vec(0, this.height / 2)) : this.midPoint()
  }

  // Alias this so we conform to TokenWithVariable

  static deserialize(v: SerializedPropertyPicker): PropertyPicker {
    return new PropertyPicker(v.id, v.propertyName, Variable.withId(v.variableId), v.position)
  }

  serialize(): SerializedPropertyPicker {
    return {
      type: "PropertyPicker",
      id: this.id,
      propertyName: this.propertyName,
      variableId: this.variable.id,
      position: this.position
    }
  }

  override onTap() {
    // TODO: Toggle the property
    // Does that mean we need to know about any wires attached to us?
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
    this.variable.remove()
    super.remove()
  }
}

export const aPropertyPicker = (gameObj: GameObject) => (gameObj instanceof PropertyPicker ? gameObj : null)
