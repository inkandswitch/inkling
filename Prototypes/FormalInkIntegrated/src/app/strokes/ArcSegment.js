import generateId from "../generateId";
import Vec from "../../lib/vec";

export default class ArcSegment {
    constructor(svg, a, b, c) {
        this.id = generateId();
        this.a = a;
        this.b = b;
        this.c = c;
        this.dirty = true;
        this.selected = false;

        this.radius = Vec.dist(this.a.position, this.c.position);
        this.isLargeArc = 0; // more than 180
        this.clockwise = 1; // clockwise or counterclockwise
        this.xAxisRotation = 0;
        
        this.updatePath();

        const normalAttributes = {
            d: this.path,
            'stroke-width': 1,
            stroke: 'black',
            fill: 'none',
        };
        this.elements = {
            normal: svg.addElement('path', normalAttributes),
            selected:
                svg.addElement(
                    'path',
                    {
                        ...normalAttributes,
                        'stroke-width': 7,
                        stroke: 'none',
                    }
                ),
        };
    }

    updatePath() {
        //           M   start_x              start_y            A   radius_x        radius_y       x-axis-rotation,        more-than-180        clockwise         end_x                end_y
        this.path = `M ${this.a.position.x} ${this.a.position.y} A ${this.radius}  ${this.radius} ${this.xAxisRotation} ${this.isLargeArc} ${this.clockwise} ${this.b.position.x} ${this.b.position.y}`;
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
        if (this.a.dirty || this.b.dirty || this.c.dirty) {
            this.radius = Vec.dist(this.a.position, this.c.position);
            this.isLargeArc = 0; // more than 180
            this.clockwise = 1; // clockwise or counterclockwise
            this.xAxisRotation = 0;

            this.updatePath();
            const normalAttributes = { d: this.path };
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