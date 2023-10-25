import Token from "./Token.js";
import SVG from "../Svg.js";
import {WirePort} from "./Wire.js";
import {boundingBoxFromStrokes} from "../../lib/bounding_box.js";
import {generateId} from "../../lib/helpers.js";
export default class LabelToken extends Token {
  constructor(label, source) {
    super(source);
    this.label = label;
    this.id = generateId();
    this.lastRenderedValue = "";
    this.boxElement = SVG.add("rect", SVG.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "label-box"
    });
    this.textElement = SVG.add("text", SVG.metaElm, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      class: "label-text"
    });
    this.strokeElements = [];
    if (typeof label.display === "string") {
      const content = label.display;
      if (content !== this.lastRenderedValue) {
        this.lastRenderedValue = content;
        SVG.update(this.textElement, {content});
        this.width = this.textElement.getComputedTextLength() + 10;
      }
    } else {
      for (const stroke of label.display) {
        const strokeElement = SVG.add("polyline", SVG.labelElm, {
          class: "label-stroke",
          points: SVG.points(stroke),
          transform: SVG.positionToTransform(this.position)
        });
        this.strokeElements.push(strokeElement);
      }
      const bb = boundingBoxFromStrokes(label.display);
      const leftPadding = bb.minX;
      this.width = bb.width + leftPadding * 2;
    }
    SVG.update(this.boxElement, {width: this.width});
    this.wirePort = this.adopt(new WirePort(this.position, this.label));
  }
  isPrimary() {
    return true;
  }
  render() {
    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      "is-hidden": this.hidden
    });
    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      "is-hidden": this.hidden
    });
    for (const strokeElement of this.strokeElements) {
      SVG.update(strokeElement, {
        transform: SVG.positionToTransform(this.position),
        "is-hidden": this.hidden
      });
    }
    this.wirePort.position = this.midPoint();
  }
  getVariable() {
    return this.label.variable;
  }
}
export const aLabelToken = (gameObj) => gameObj instanceof LabelToken ? gameObj : null;
