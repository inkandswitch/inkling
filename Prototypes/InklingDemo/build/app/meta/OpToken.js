import Token from "./Token.js";
import SVG from "../Svg.js";
export default class OpToken extends Token {
  constructor(stringValue, source) {
    super(source);
    this.stringValue = stringValue;
    this.lastRenderedValue = "";
    this.textElement = SVG.add("text", SVG.metaElm, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      class: "op token"
    });
  }
  isPrimary() {
    return false;
  }
  render() {
    const content = this.stringValue;
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content;
      SVG.update(this.textElement, {content});
      this.width = this.textElement.getComputedTextLength() + 10;
    }
    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24
    });
  }
  remove() {
    this.textElement.remove();
    super.remove();
  }
}
