import Token from "./Token.js";
import SVG from "../Svg.js";
import {WirePort} from "./Wire.js";
import * as constraints from "../constraints.js";
import Vec from "../../lib/vec.js";
import {
  MetaStruct,
  MetaNumber,
  MetaNumberConnection
} from "./MetaSemantics.js";
import {generateId} from "../../lib/helpers.js";
const TAB_SIZE = 5;
function PropertyPickerPath(pos, w, h) {
  return `
    M ${pos.x + TAB_SIZE} ${pos.y}
    L ${pos.x + w} ${pos.y}
    L ${pos.x + w} ${pos.y + h}
    L ${pos.x + TAB_SIZE} ${pos.y + h}
    L ${pos.x} ${pos.y + h / 2}
    L ${pos.x + TAB_SIZE} ${pos.y}
  `;
}
export default class PropertyPicker extends Token {
  constructor() {
    super(...arguments);
    this.id = generateId();
    this.lastRenderedValue = "";
    this.boxElement = SVG.add("path", SVG.metaElm, {
      d: PropertyPickerPath(this.position, this.width, this.height),
      class: "property-picker-box"
    });
    this.textElement = SVG.add("text", SVG.metaElm, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21,
      class: "property-picker-text"
    });
    this.inputVariable = new MetaStruct([]);
    this.inputPort = this.adopt(new WirePort(this.position, this.inputVariable));
    this.outputVariable = new MetaNumber(constraints.variable());
    this.wirePort = this.adopt(new WirePort(this.position, this.outputVariable));
    this.property = null;
    this.internalConnection = null;
  }
  isPrimary() {
    return true;
  }
  getVariable() {
    return this.outputVariable.variable;
  }
  render() {
    const content = this.property?.display;
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content;
      SVG.update(this.textElement, {content});
      this.width = this.textElement.getComputedTextLength() + 10 + TAB_SIZE;
    }
    SVG.update(this.boxElement, {
      d: PropertyPickerPath(this.position, this.width, this.height),
      "is-embedded": this.embedded
    });
    SVG.update(this.textElement, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21
    });
    this.inputPort.position = Vec.add(this.position, Vec(0, this.height / 2));
    this.wirePort.position = this.midPoint();
  }
  setProperty(newValue) {
    this.property = newValue;
    this.update();
  }
  update() {
    if (!this.property) {
      return;
    }
    this.internalConnection = new MetaNumberConnection(this.property, this.outputVariable);
  }
  remove() {
    this.boxElement.remove();
    this.textElement.remove();
    super.remove();
  }
}
export const aPropertyPicker = (gameObj) => gameObj instanceof PropertyPicker ? gameObj : null;
