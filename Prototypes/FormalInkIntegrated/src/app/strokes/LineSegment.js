import generateId from "../generateId";

export default class LineSegment {
    constructor(svg, a, b) {
        this.id = generateId();
        this.a = a;
        this.b = b;
        this.dirty = true;
        this.selected = false;
        const normalAttributes = {
            x1: this.a.position.x,
            y1: this.a.position.y,
            x2: this.b.position.x,
            y2: this.b.position.y,
            'stroke-width': 1,
            stroke: 'black',
        };
        this.elements = {
            normal: svg.addElement('line', normalAttributes),
            selected:
                svg.addElement(
                    'line',
                    {
                        ...normalAttributes,
                        'stroke-width': 7,
                        stroke: 'none',
                    }
                ),
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
        if (this.a.dirty || this.b.dirty) {
            const normalAttributes = {
                x1: this.a.position.x,
                y1: this.a.position.y,
                x2: this.b.position.x,
                y2: this.b.position.y,
            };
            svg.updateElement(this.elements.normal, normalAttributes);
            svg.updateElement(
                this.elements.selected,
                {
                    ...normalAttributes,
                    stroke: this.selected ? 'rgba(180, 134, 255, 0.42)' : 'none',
                }
            );

            // TODO(marcel): should this move outside the `if`?
            this.dirty = false;
        }
    }
}