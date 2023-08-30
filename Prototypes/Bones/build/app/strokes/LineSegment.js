import {updateSvgElement} from "../Svg.js";
import generateId from "../generateId.js";
export default class LineSegment {
  constructor(svg, a, b) {
    this.a = a;
    this.b = b;
    this.id = generateId();
    this.dirty = true;
    this.selected = false;
    const normalAttributes = {
      x1: this.a.position.x,
      y1: this.a.position.y,
      x2: this.b.position.x,
      y2: this.b.position.y,
      "stroke-width": 1,
      stroke: "black"
    };
    this.elements = {
      normal: svg.addElement("line", normalAttributes),
      selected: svg.addElement("line", {
        ...normalAttributes,
        "stroke-width": 7,
        stroke: "none"
      })
    };
  }
  select() {
    this.dirty = true;
    this.selected = true;
  }
  deselect() {
    this.dirty = true;
    this.selected = false;
  }
  render() {
    if (!(this.dirty || this.a.dirty || this.b.dirty)) {
      return;
    }
    const normalAttributes = {
      x1: this.a.position.x,
      y1: this.a.position.y,
      x2: this.b.position.x,
      y2: this.b.position.y
    };
    updateSvgElement(this.elements.normal, normalAttributes);
    updateSvgElement(this.elements.selected, {
      ...normalAttributes,
      stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none"
    });
    this.dirty = false;
  }
}
