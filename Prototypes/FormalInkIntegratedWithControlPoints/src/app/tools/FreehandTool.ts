import { generatePathFromPoints } from "../Svg";
import { strokeSvgProperties } from "../strokes/FreehandStroke";

export default class FreehandTool {
    constructor(page, svg) {
        this.page = page;
        this.points = null;
        this.element =
            svg.addElement(
                'path',
                {
                    d: '',
                    ...strokeSvgProperties,
                }
            );
        this.pencilIsDown = false;
        this.fingerId = null;
        this.dirty = false;
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');
        if (fingerDown != null) {
            if (this.fingerId == null) {
                console.log(fingerDown.id, 'down');
                if (this.points == null) {
                    this.fingerId = fingerDown.id;
                }
            } else {
                console.log(fingerDown.id, '(down)');
            }
        }
        
        for (const fingerUp of events.didAll('finger', 'ended')) {
            if (fingerUp.id === this.fingerId) {
                console.log(fingerUp.id, 'up');
                this.fingerId = null;
            } else {
                console.log(fingerUp.id, '(up)');
            }
        }

        const pencilDown = events.did('pencil', 'began');
        if (pencilDown != null) {
            this.pencilIsDown = true;
            if (this.points == null) {
                this.startStroke({ ...pencilDown.position, pressure: pencilDown.pressure });
            } else {
                this.extendStroke(null);
                this.extendStroke({ ...pencilDown.position, pressure: pencilDown.pressure });
            }
        }

        if (this.points == null) {
            return;
        }

        const pencilMoves = events.didAll('pencil', 'moved');
        pencilMoves.forEach(pencilMove => {
            this.extendStroke({ ...pencilMove.position, pressure: pencilMove.pressure });
        });

        const pencilUp = events.did('pencil', 'ended');
        if (pencilUp != null) {
            this.pencilIsDown = false;
        }

        if (this.fingerId == null && !this.pencilIsDown) {
            this.endStroke();
        }
    }

    startStroke(pointWithPressure) {
        this.points = [pointWithPressure];
        this.dirty = true;
    }

    extendStroke(pointWithPressure) {
        this.points.push(pointWithPressure);
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

        try {
            const path = this.points == null ? '' : generatePathFromPoints(this.points);
            svg.updateElement(this.element, { d: path });
        } catch (e) {
            console.log('offending', this.points);
            throw e;
        }

        this.dirty = false;
    }
}