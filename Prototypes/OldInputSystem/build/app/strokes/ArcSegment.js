import {generateId} from "../../lib/helpers.js";
import Vec from "../../lib/vec.js";
import SVG from "../Svg.js";
import Handle from "./Handle.js";
export default class ArcSegment {
  constructor(aPos, bPos, cPos) {
    this.id = generateId();
    this.selected = false;
    this.path = "";
    this.needsRerender = true;
    this.a = Handle.create("formal", aPos, this);
    this.b = Handle.create("formal", bPos, this);
    this.c = Handle.create("formal", cPos, this);
    this.updatePath();
    const attrs = {d: this.path, fill: "none"};
    this.elements = {
      normal: SVG.add("path", {
        ...attrs,
        "stroke-width": 1,
        stroke: "black"
      }),
      selected: SVG.add("path", {
        ...attrs,
        "stroke-width": 7,
        stroke: "none"
      })
    };
  }
  updatePath() {
    const radius = Vec.dist(this.a.position, this.c.position);
    const isLargeArc = 0;
    const clockwise = 1;
    const xAxisRotation = 0;
    this.path = `M ${this.a.position.x} ${this.a.position.y} A ${radius}  ${radius} ${xAxisRotation} ${isLargeArc} ${clockwise} ${this.b.position.x} ${this.b.position.y}`;
  }
  select() {
    this.selected = true;
    this.needsRerender = true;
  }
  deselect() {
    this.selected = false;
    this.needsRerender = true;
  }
  onHandleMoved() {
    this.needsRerender = true;
  }
  render() {
    if (!this.needsRerender) {
      return;
    }
    this.updatePath();
    const commonAttributes = {d: this.path};
    SVG.update(this.elements.normal, commonAttributes);
    SVG.update(this.elements.selected, {
      ...commonAttributes,
      stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none"
    });
    this.needsRerender = false;
  }
}
