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

type Mode = 'unistroke' | 'multistroke';

export default class FreehandTool extends Tool {
    mode: Mode = 'unistroke';
    points?: (PositionWithPressure | null)[];
    element: any;
    pencilIsDown = false;
    dirty = false;

    constructor(svg: SVG, buttonX: number, buttonY: number, public page: Page) {
        super(svg, buttonX, buttonY);
        this.element = svg.addElement('path', { d: '', ...strokeSvgProperties });
    }

    update(events: Events) {
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

        if (!this.pencilIsDown && this.mode === 'unistroke') {
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

    onAction() {
        this.mode = this.mode === 'unistroke' ? 'multistroke' : 'unistroke';
        console.log('toggled modes to', this.mode);
    }

    onDeselected() {
        if (this.points != undefined) {
            this.endStroke();
            this.updatePath();
        }

        super.onDeselected();
        this.mode = 'unistroke';
    }

    render(_svg: SVG) {
        if (!this.dirty) {
            return;
        }

        this.updatePath();
        this.dirty = false;
    }

    updatePath() {
        const path = this.points == null ? '' : generatePathFromPoints(this.points);
        this.element.setAttribute('d', path);
    }
}