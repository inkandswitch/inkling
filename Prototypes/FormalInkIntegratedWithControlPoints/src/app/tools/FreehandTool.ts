import { Events, PencilEvent, TouchId } from "../../engine";
import Page from "../Page";
import SVG, { generatePathFromPoints } from "../Svg";
import { strokeSvgProperties } from "../strokes/FreehandStroke";
import { Tool } from "./Tool";

interface PositionWithPressure {
    x: number;
    y: number;
    pressure: number;
}

export default class FreehandTool extends Tool {
    points?: (PositionWithPressure | null)[];
    fingerId?: TouchId;
    element: any;
    pencilIsDown = false;
    dirty = false;

    constructor(svg: SVG, buttonX: number, buttonY: number, public page: Page) {
        super(svg, buttonX, buttonY);
        this.element = svg.addElement('path', { d: '', ...strokeSvgProperties });
    }

    update(events: Events) {
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
                this.fingerId = undefined;
            } else {
                console.log(fingerUp.id, '(up)');
            }
        }

        const pencilDown = events.did('pencil', 'began') as PencilEvent | undefined;
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

        const pencilMoves = events.didAll('pencil', 'moved') as PencilEvent[];
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

    startStroke(point: PositionWithPressure) {
        this.points = [point];
        this.dirty = true;
    }

    extendStroke(point: PositionWithPressure | null) {
        this.points!.push(point);
        this.dirty = true;
    }

    endStroke() {
        this.page.addFreehandStroke(this.points);
        this.points = undefined;
        this.dirty = true;
    }

    render(svg: SVG) {
        if (!this.dirty) {
            return;
        }

        const path = this.points == null ? '' : generatePathFromPoints(this.points);
        svg.updateElement(this.element, { d: path });

        this.dirty = false;
    }
}