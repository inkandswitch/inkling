import generateId from "../generateId";
import Vec from "../../lib/vec";
import SVG, { updateSvgElement } from "../Svg";
import Handle from "./Handle";

export default class ArcSegment {
  id = generateId();
  selected = false;
  isLargeArc = 0; // more than 180
  clockwise = 1; // clockwise or counterclockwise
  xAxisRotation = 0;
  radius: number;
  path = "";
  elements: { normal: SVGElement; selected: SVGElement };
  private needsRerender = true;

  constructor(svg: SVG, private aId: number, private bId: number, private cId: number) {
    this.a.listeners.add(this);
    this.b.listeners.add(this);
    this.c.listeners.add(this);

    this.radius = Vec.dist(this.a.position, this.c.position);

    this.updatePath();

    const attrs = { d: this.path, fill: "none" };
    this.elements = {
      normal: svg.addElement("path", { ...attrs, "stroke-width": 1, stroke: "black" }),
      selected: svg.addElement("path", { ...attrs, "stroke-width": 7, stroke: "none" }),
    };
  }

  get a() {
    return Handle.get(this.aId);
  }

  get b() {
    return Handle.get(this.bId);
  }

  get c() {
    return Handle.get(this.cId);
  }

  updatePath() {
    //           M   start_x              start_y            A   radius_x        radius_y       x-axis-rotation,      more-than-180      clockwise         end_x                end_y
    this.path = `M ${this.a.position.x} ${this.a.position.y} A ${this.radius}  ${this.radius} ${this.xAxisRotation} ${this.isLargeArc} ${this.clockwise} ${this.b.position.x} ${this.b.position.y}`;
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

  onHandleRemoved() {
    // no op
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

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

    this.needsRerender = false;
  }
}
