import Arc from "../../lib/arc.js";
import Fit from "../../lib/fit.js";
import Line from "../../lib/line.js";
import Vec from "../../lib/vec.js";
import { generatePathFromPoints } from "../Svg.js";

export default class FormalTool {
    constructor(page, svg) {
        this.page = page;
        
        this.svg = svg;
        this.element = null;

        // Data for guessing
        this.inputPoints = null;
        this.idealPoints = null;
        this.renderPoints = null;

        // Speed (not velocity, lol)
        this.speed = 0;
        this.maxSpeed = 0;
        this.previousPosition = null;

        // Curve fitting
        this.mode = 'unknown'; // unknown, guess, can still change, fixed
        this.fit = null;
    }

    update(events) {
        // PENCIL DOWN
        const pencilDown = events.did('pencil', 'began');
        if (pencilDown) {
            this.inputPoints = [pencilDown.position];
            this.renderPoints = [Vec.clone(pencilDown.position)];

            this.speed = 0;
            this.maxSpeed = 0;
            this.previousPosition = pencilDown.position;

            this.state = 'unknown';
            this.dirty = true;
        }

        // PENCIL MOVE
        const pencilMoves = events.didAll('pencil', 'moved');
        pencilMoves.forEach(pencilMove => {
            // Compute speed
            const newSpeed = Vec.dist(this.previousPosition, pencilMove.position);
            const alpha = 0.05; // Filter speed to get rid of spikes
            this.speed = alpha * newSpeed + (1 - alpha) * this.speed;
            this.maxSpeed = Math.max(this.maxSpeed, this.speed);
            this.previousPosition = pencilMove.position;

            // Guessing system
            // STATES
            if (this.mode != 'fixed') {
                // if (Vec.dist(this.inputPoints[this.inputPoints.length - 1], pos) > 1) {
                    // Add point to input buffer
                    this.inputPoints.push(pencilMove.position);
                    this.renderPoints.push(Vec.clone(pencilMove.position));
                // }
            }

            if (this.state == 'guess') {
                this.doFit();
            }

            // STATE TRANSITIONS

            // If the stroke is long enough, show feedback of inital guess
            if (this.mode == 'unknown' && this.inputPoints.length > 100) {
                this.state = 'guess';
            }

            // If the user slows down, and the stroke is long enough, switch to fixed
            if (this.state != 'fixed' && this.inputPoints.length > 10 && this.speed < 1 && this.speed < this.maxSpeed) {
                this.doFit();
                // this.state = 'fixed';
            }
            this.dirty = true
        })

        // PENCIL UP
        const pencilUp = events.did('pencil', 'ended');
        if (pencilUp) {
            this.doFit();
            // this.state = 'fixed';
            if (this.fit.type === 'line') {
                const a = this.page.addPoint(this.fit.line.a);
                const b = this.page.addPoint(this.fit.line.b);
                this.page.addLineSegment(a, b);
            } else if(this.fit.type === 'arc') {
                const {start, end} = Arc.points(this.fit.arc);
                const a = this.page.addPoint(start);
                const b = this.page.addPoint(end);
                const c = this.page.addPoint(this.fit.arc.center);
                this.page.addArcSegment(a, b, c);
            }

            // Data for guessing
            this.inputPoints = null;
            this.idealPoints = null;
            this.renderPoints = null;
            this.element.remove();
            this.element = null;
            // this.dirty = true;
        }

        //Interpolate animation render points
        if (this.idealPoints && this.renderPoints.length === this.idealPoints.length) {
            for (let i = 0; i < this.idealPoints.length; i++) {
                this.renderPoints[i] = Vec.lerp(this.idealPoints[i], this.renderPoints[i], 0.8);
            }
        }
    }

    doFit(){
        const lineFit = Fit.line(this.inputPoints);
        const arcFit = Fit.arc(this.inputPoints);
        const circleFit = Fit.circle(this.inputPoints);

        this.arcFit = arcFit;
        this.lineFit = lineFit;
        this.circleFit = circleFit;

        this.fit = lineFit;
        if (arcFit && Math.abs(Arc.directedInnerAngle(arcFit.arc)) > 0.4 * Math.PI && arcFit.fitness < lineFit.fitness) {
            this.fit = arcFit;

            if (Math.abs(Arc.directedInnerAngle(arcFit.arc)) > 1.5 * Math.PI) {
                if (circleFit && circleFit.circle.radius < 500 && circleFit.fitness < arcFit.fitness) {
                    this.fit = circleFit;
                }
            }
        }
        
        if (this.fit) {
            // this.doSnap();
            this.updateIdeal();
        }
    }

    updateIdeal() {
        if (this.fit.type == 'line') {
            this.idealPoints = Line.spreadPointsAlong(this.fit.line, this.inputPoints.length);
        } else if(this.fit.type == 'arc') {
            this.idealPoints = Arc.spreadPointsAlong(this.fit.arc, this.inputPoints.length);
        } else if(this.fit.type == 'circle') {
            this.idealPoints = Arc.spreadPointsAlong(this.fit.circle, this.inputPoints.length);
        }
    }

    render(svg){
        if (!this.dirty) {
            return;
        }

        if (this.renderPoints) {
            if (!this.element) {
                this.element =
                    svg.addElement(
                        'path',
                        {
                            d: '',
                            stroke: 'black',
                            fill: 'none'
                        }
                    );
            }

            const path = generatePathFromPoints(this.renderPoints);
            svg.updateElement(this.element, { d: path });
        }

        // TODO(marcel): set dirty to `false`?
    }
}