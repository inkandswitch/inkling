import generateId from "../generateId";

export default class LineSegment {
  id = generateId();
  dirty = true;
  selected = false;
  elements;

  constructor(svg, public a, public b) {
    const normalAttributes = {
      x1: this.a.position.x,
      y1: this.a.position.y,
      x2: this.b.position.x,
      y2: this.b.position.y,
      "stroke-width": 1,
      stroke: "black",
    };
    this.elements = {
      normal: svg.addElement("line", normalAttributes),
      selected: svg.addElement("line", {
        ...normalAttributes,
        "stroke-width": 7,
        stroke: "none",
      }),
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

  render(svg) {
    if (this.dirty || this.a.dirty || this.b.dirty) {
      const normalAttributes = {
        x1: this.a.position.x,
        y1: this.a.position.y,
        x2: this.b.position.x,
        y2: this.b.position.y,
      };
      svg.updateElement(this.elements.normal, normalAttributes);
      svg.updateElement(this.elements.selected, {
        ...normalAttributes,
        stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none",
      });

      this.dirty = false;
    }
  }
}
