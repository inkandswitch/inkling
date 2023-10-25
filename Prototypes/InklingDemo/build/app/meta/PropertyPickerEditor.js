import SVG from "../Svg.js";
import {GameObject} from "../GameObject.js";
import {signedDistanceToBox} from "../../lib/SignedDistance.js";
const LINEHEIGHT = 30;
export default class PropertyPickerEditor extends GameObject {
  constructor(propertyPicker) {
    super();
    this.width = 200;
    this.height = 44;
    this.position = {x: 100, y: 100};
    this.svgTextElements = [];
    this.propertyPicker = propertyPicker;
    this.props = propertyPicker.inputPort.value.list();
    this.height = this.props.length * LINEHEIGHT;
    this.position = propertyPicker.position;
    this.boxElement = SVG.add("rect", SVG.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "property-picker-editor-box"
    });
    this.svgTextElements = this.props.map((label, index) => {
      const text = SVG.add("text", SVG.metaElm, {
        x: this.position.x + 5,
        y: this.position.y + 24 + index * LINEHEIGHT,
        class: "property-picker-editor-text",
        content: label.display
      });
      return text;
    });
  }
  onTapInside(position) {
    const index = Math.floor((position.y - this.position.y) / LINEHEIGHT);
    this.propertyPicker.setProperty(this.props[index]);
    this.remove(false);
  }
  distanceToPoint(pos) {
    return signedDistanceToBox(this.position.x, this.position.y, this.width, this.height, pos.x, pos.y);
  }
  render() {
  }
  remove(isErase = true) {
    if (isErase) {
      this.propertyPicker.remove();
    }
    for (const element of this.svgTextElements) {
      element.remove();
    }
    this.boxElement.remove();
    super.remove();
  }
}
export const aPropertyPickerEditor = (gameObj) => gameObj instanceof PropertyPickerEditor ? gameObj : null;
