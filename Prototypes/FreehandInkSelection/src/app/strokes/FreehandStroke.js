import { generatePathFromPoints } from "../Svg";
import generateId from "../generateId";

export default class FreehandStroke {
    constructor(svg, points) {
        this.id = generateId();
        this.points = points;
        this.dirty = true;
        this.selected = false;

        const path = generatePathFromPoints(this.points);
        this.elements = {
            normal:
                svg.addElement(
                    'path',
                    {
                        d: path,
                        stroke: 'darkgrey',
                        'stroke-width': 2,
                        fill: 'none',
                    }
                ),
            selected:
                svg.addElement(
                    'path',
                    {
                        d: path,
                        'stroke-width': 7,
                        stroke: 'none',
                        fill: 'none',
                    }
                )
        };
    }

    getFirstPoint(){
        return this.points[0];
    }

    getLastPoint(){
        return this.points[this.points.length - 1];
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
        if (!this.dirty) {
            return
        }

        const path = generatePathFromPoints(this.points);
        svg.updateElement(
            this.elements.normal,
            {
                d: path
            }
        );

        svg.updateElement(
            this.elements.selected,
            {
                d: path,
                stroke: this.selected ? 'rgba(180, 134, 255, 0.42)' : 'none'
            }
        );

        this.dirty = false;
    }
}