import {updateSvgElement} from "../Svg.js";
import Vec from "../../lib/vec.js";
import generateId from "../generateId.js";
export default class MorphPoint {
  constructor(svg, position) {
    this.position = position;
    this.id = generateId();
    this.morphVector = Vec(0, 0);
    this.angle = 0;
    this.dirty = true;
    this.selected = false;
    this.firstPosition = position;
    this.elements = {
      normal: svg.addElement("circle", {cx: 0, cy: 0, r: 30, fill: "none", stroke: "lightgrey"}),
      ghost: svg.addElement("circle", {cx: 0, cy: 0, r: 30, fill: "none", stroke: "lightgrey"}),
      line: svg.addElement("line", {x1: 0, y1: 0, x2: 0, y2: 0, stroke: "lightgrey"}),
      rotationLine: svg.addElement("line", {x1: 0, y1: 0, x2: 0, y2: 0, stroke: "lightgrey"})
    };
  }
  setPosition(position) {
    this.dirty = true;
    this.position = position;
    this.morphVector = Vec.sub(this.position, this.firstPosition);
  }
  select() {
    this.dirty = true;
    this.selected = true;
  }
  deselect() {
    this.dirty = true;
    this.selected = false;
  }
  remove() {
    this.elements.normal.remove();
  }
  render(svg) {
    if (!this.dirty) {
      return;
    }
    updateSvgElement(this.elements.normal, {
      transform: `translate(${this.position.x} ${this.position.y})`
    });
    const rotationOffset = Vec.add(this.position, Vec.polar(this.angle, 60));
    updateSvgElement(this.elements.rotationLine, {
      x1: this.position.x,
      y1: this.position.y,
      x2: rotationOffset.x,
      y2: rotationOffset.y
    });
    updateSvgElement(this.elements.ghost, {
      transform: `translate(${this.firstPosition.x} ${this.firstPosition.y})`
    });
    updateSvgElement(this.elements.line, {
      x1: this.position.x,
      y1: this.position.y,
      x2: this.firstPosition.x,
      y2: this.firstPosition.y
    });
    this.dirty = false;
  }
}
