import Token from "./Token"
import SVG from "../Svg"
import { Position } from "../../lib/types"
import { WirePort } from "./WirePort"
import * as constraints from "../Constraints"
import Vec from "../../lib/vec"
import { MetaStruct, MetaLabel, MetaNumber, MetaConnection, MetaNumberConnection } from "./MetaSemantics"
import { GameObject } from "../GameObject"
import { Variable } from "../Constraints"

// TODO: revisit (wrt serialization) after we get rid of MetaXXX

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
  outputVariableId: number
}

export default class PropertyPicker extends Token {
  static create() {
    return this._create(constraints.variable())
  }

  static _create(outputVariable: Variable) {
    return new this(outputVariable)
  }

  private lastRenderedValue = ""

  protected readonly boxElement = SVG.add("path", SVG.metaElm, {
    d: PropertyPickerPath(this.position, this.width, this.height),
    class: "property-picker-box"
  })

  protected readonly textElement = SVG.add("text", SVG.metaElm, {
    x: this.position.x + 5 + TAB_SIZE,
    y: this.position.y + 21,
    class: "property-picker-text"
  })

  readonly inputMetaVariable = new MetaStruct([])
  readonly inputPort = new WirePort(this.position, this.inputMetaVariable)

  readonly outputMetaVariable
  readonly wirePort: WirePort

  private constructor(outputVariable: Variable) {
    super()
    this.outputMetaVariable = new MetaNumber(outputVariable)
    this.wirePort = new WirePort(this.position, this.outputMetaVariable)
  }

  // Alias this so we conform to TokenWithVariable

  private property: MetaLabel | null = null

  internalConnection: MetaConnection | null = null

  static deserialize(v: SerializedPropertyPicker): PropertyPicker {
    return this._create(Variable.withId(v.outputVariableId))
  }

  serialize(): SerializedPropertyPicker {
    return {
      type: "PropertyPicker",
      outputVariableId: this.outputMetaVariable.variable.id
    }
  }

  getVariable(): constraints.Variable {
    return this.outputMetaVariable.variable
  }

  render() {
    // getComputedTextLength() is slow, so we're gonna do some dirty checking here
    const content = this.property?.display as string
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content
      SVG.update(this.textElement, { content })
      this.width = this.textElement.getComputedTextLength() + 10 + TAB_SIZE
    }

    SVG.update(this.boxElement, {
      d: PropertyPickerPath(this.position, this.width, this.height)
    })

    SVG.update(this.textElement, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21
    })

    this.inputPort.position = Vec.add(this.position, Vec(0, this.height / 2))
    this.wirePort.position = this.midPoint()
  }

  setProperty(newValue: MetaLabel) {
    this.property = newValue
    this.update()
  }

  update() {
    if (!this.property) {
      return
    }

    this.internalConnection = new MetaNumberConnection(this.property, this.outputMetaVariable)
  }

  remove() {
    this.boxElement.remove()
    this.textElement.remove()
    super.remove()
  }
}

export const aPropertyPicker = (gameObj: GameObject) => (gameObj instanceof PropertyPicker ? gameObj : null)
