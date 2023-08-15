import SVG, { updateSvgElement } from "../Svg";
import Vec from "../../lib/vec";
import generateId from "../generateId";
import { Position } from "../../lib/types";

export default class MorphPoint {
  id = generateId();
  firstPosition;
  morphVector = Vec(0, 0);
  angle = 0;
  dirty = true;
  selected = false;
  elements;

  constructor(svg: SVG, public position: Position) {
    this.firstPosition = position;
    this.elements = {
      normal: svg.addElement("circle", { cx: 0, cy: 0, r: 30, fill: "none", stroke: "lightgrey" }),
      ghost: svg.addElement("circle", { cx: 0, cy: 0, r: 30, fill: "none", stroke: "lightgrey" }),
      line: svg.addElement("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: "lightgrey" }),
      rotationLine: svg.addElement("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: "lightgrey" }),
    };
  }

  setPosition(position: Position) {
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
    //this.elements.selected.remove();
  }

  render(svg: SVG) {
    if (!this.dirty) {
      return;
    }

    updateSvgElement(this.elements.normal, {
      transform: `translate(${this.position.x} ${this.position.y})`,
    });

    // let rotation offset
    const rotationOffset = Vec.add(this.position, Vec.polar(this.angle, 60));
    updateSvgElement(this.elements.rotationLine, {
      x1: this.position.x,
      y1: this.position.y,
      x2: rotationOffset.x,
      y2: rotationOffset.y,
    });

    updateSvgElement(this.elements.ghost, {
      transform: `translate(${this.firstPosition.x} ${this.firstPosition.y})`,
    });

    updateSvgElement(this.elements.line, {
      x1: this.position.x,
      y1: this.position.y,
      x2: this.firstPosition.x,
      y2: this.firstPosition.y,
    });

    this.dirty = false;
  }
}
