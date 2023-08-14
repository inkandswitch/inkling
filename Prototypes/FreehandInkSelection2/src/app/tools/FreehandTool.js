import { generatePathFromPoints } from "../Svg";

export default class FreehandTool {
    constructor(page, svg) {
        this.page = page;
        this.points = null;
        this.element =
            svg.addElement(
                'path',
                {
                    d: '',
                    stroke: 'darkgrey',
                    'stroke-width': 2,
                    fill: 'none',
                }
            );
        this.dirty = false;
    }

    update(events) {
        const pencilDown = events.did('pencil', 'began');
        if (pencilDown != null) {
            this.startStroke(pencilDown.position);
        }

        if (this.points == null) {
            return;
        }

        const pencilMoves = events.didAll('pencil', 'moved');
        pencilMoves.forEach(pencilMove => this.extendStroke(pencilMove.position));

        const pencilUp = events.did('pencil', 'ended');
        if (pencilUp != null) {
            this.endStroke();
        }
    }

    startStroke(position) {
        this.points = [position];
        this.dirty = true;
    }

    extendStroke(position) {
        this.points.push(position);
        this.dirty = true;
    }

    endStroke() {
        this.page.addFreehandStroke(this.points);
        this.points = null;
        this.dirty = true;
    }

    render(svg) {
        if (!this.dirty) {
            return;
        }

        const path = this.points == null ? '' : generatePathFromPoints(this.points);
        svg.updateElement(this.element, { d: path });

        this.dirty = false;
    }
}