import {updateSvgElement} from "../Svg.js";
import generateId from "../generateId.js";
export default class Point {
  constructor(svg, position) {
    this.position = position;
    this.id = generateId();
    this.dirty = true;
    this.selected = false;
    this.elements = {
      normal: svg.addElement("circle", {cx: 0, cy: 0, r: 3, fill: "black", "fill-opacity": 0}),
      selected: svg.addElement("circle", {cx: 0, cy: 0, r: 7, fill: "none"})
    };
  }
  setPosition(position) {
    this.dirty = true;
    this.position = position;
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
    this.elements.selected.remove();
  }
  render() {
    if (!this.dirty) {
      return;
    }
    updateSvgElement(this.elements.normal, {
      transform: `translate(${this.position.x} ${this.position.y})`
    });
    updateSvgElement(this.elements.selected, {
      transform: `translate(${this.position.x} ${this.position.y})`,
      fill: this.selected ? "rgba(180, 134, 255, 0.42)" : "none"
    });
    this.dirty = false;
  }
}
