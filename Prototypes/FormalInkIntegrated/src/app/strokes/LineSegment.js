import generateId from "../generateId"

export default class LineSegment {
    constructor(svg, a, b){
        this.id = generateId();
        this.a = a;
        this.b = b;
        this.dirty = true;
        this.selected = false;
        this.elements = {
            normal: svg.addElement("line", { x1: this.a.position.x, y1: this.a.position.y, x2: this.b.position.x, y2: this.b.position.y, "stroke-width": 1, stroke: "black" }),
            selected: svg.addElement("line", { x1: this.a.position.x, y1: this.a.position.y, x2: this.b.position.x, y2: this.b.position.y, "stroke-width": 7, stroke: "none" })
        };

    }

    move(position) {
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

    render(svg) {
        if(this.a.dirty || this.b.dirty) {
            svg.updateElement(this.elements.normal, {
                x1: this.a.position.x, y1: this.a.position.y, x2: this.b.position.x, y2: this.b.position.y,
            });

            svg.updateElement(this.elements.selected, {
                x1: this.a.position.x, y1: this.a.position.y, x2: this.b.position.x, y2: this.b.position.y,
                stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none"
            });

            this.dirty = false;
        }
    }
}