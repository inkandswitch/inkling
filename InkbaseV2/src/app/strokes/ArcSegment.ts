import generateId from "../generateId";
import Vec from "../../lib/vec";
import SVG, { updateSvgElement } from "../Svg";

export default class ArcSegment {
  id = generateId();
  dirty = true;
  selected = false;
  isLargeArc = 0; // more than 180
  clockwise = 1; // clockwise or counterclockwise
  xAxisRotation = 0;
  radius: number;
  path = "";
  elements: { normal: SVGElement; selected: SVGElement };

  constructor(private svg: SVG, public a, public b, public c) {
    this.radius = Vec.dist(a.position, c.position);

    this.updatePath();

    const attrs = { d: this.path, fill: "none" };
    this.elements = {
      normal: svg.addElement("path", { ...attrs, "stroke-width": 1, stroke: "black" }),
      selected: svg.addElement("path", { ...attrs, "stroke-width": 7, stroke: "none" }),
    };
  }

  updatePath() {
    //           M   start_x              start_y            A   radius_x        radius_y       x-axis-rotation,      more-than-180      clockwise         end_x                end_y
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

  render(svg) {
    if (this.dirty || this.a.dirty || this.b.dirty || this.c.dirty) {
      this.radius = Vec.dist(this.a.position, this.c.position);
      this.isLargeArc = 0; // more than 180
      this.clockwise = 1; // clockwise or counterclockwise
      this.xAxisRotation = 0;

      this.updatePath();
      const normalAttributes = { d: this.path };
      updateSvgElement(this.elements.normal, normalAttributes);
      updateSvgElement(this.elements.selected, {
        ...normalAttributes,
        stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none",
      });

      this.dirty = false;
    }
  }
}
