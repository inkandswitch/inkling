import { generatePathFromPoints } from "../Svg";

export default class FreehandTool {
    constructor(page) {
        this.page = page;
        this.points = null;
        this.element = null;
    }

    update(events) {
        const pencilDown = events.did('pencil', 'began');
        if (pencilDown) {
            this.points = [pencilDown.position];
            this.dirty = true;
        }

        const pencilMoves = this.points == null ? [] : events.didAll('pencil', 'moved');
        pencilMoves.forEach(pencilMove => {
            this.points.push(pencilMove.position);
            this.dirty = true;
        })

        const pencilUp = events.did('pencil', 'ended');
        if (pencilUp) {
            this.page.addFreehandStroke(this.points);
            this.points = null;
            this.element.remove();
            this.element = null;
        }
    }

    render(svg) {
        if (!this.dirty) {
            return;
        }

        if (this.points) {
            if (!this.element) {
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
            }

            const path = generatePathFromPoints(this.points);
            svg.updateElement(this.element, { d: path });
        }

        this.dirty = false;
    }
}