import generateId from "../generateId.js";
import Vec from "../../lib/vec.js";
import {updateSvgElement} from "../Svg.js";
export default class ArcSegment {
  constructor(svg, a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.id = generateId();
    this.dirty = true;
    this.selected = false;
    this.isLargeArc = 0;
    this.clockwise = 1;
    this.xAxisRotation = 0;
    this.path = "";
    this.radius = Vec.dist(a.position, c.position);
    this.updatePath();
    const attrs = {d: this.path, fill: "none"};
    this.elements = {
      normal: svg.addElement("path", {...attrs, "stroke-width": 1, stroke: "black"}),
      selected: svg.addElement("path", {...attrs, "stroke-width": 7, stroke: "none"})
    };
  }
  updatePath() {
    this.path = `M ${this.a.position.x} ${this.a.position.y} A ${this.radius}  ${this.radius} ${this.xAxisRotation} ${this.isLargeArc} ${this.clockwise} ${this.b.position.x} ${this.b.position.y}`;
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
    if (!(this.dirty || this.a.dirty || this.b.dirty || this.c.dirty)) {
      return;
    }
    this.radius = Vec.dist(this.a.position, this.c.position);
    this.isLargeArc = 0;
    this.clockwise = 1;
    this.xAxisRotation = 0;
    this.updatePath();
    const normalAttributes = {d: this.path};
    updateSvgElement(this.elements.normal, normalAttributes);
    updateSvgElement(this.elements.selected, {
      ...normalAttributes,
      stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none"
    });
    this.dirty = false;
  }
}
