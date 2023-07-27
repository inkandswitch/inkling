import Vec from './lib/vec';
import Line from './lib/line';
import parse from './parser';
import { Point } from './lib/relax-pk';

// Points

Point.prototype.render = function(ctx, highlight) {
    ctx.save();
    ctx.fillStyle = highlight ? 'blue' : 'black';
    const size = highlight ? 5 : 3;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, size, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

// Lines

class LineStroke {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.input = addInputElement(this);
        this.updateInputPos();
    }

    render(ctx, highlight) {
        ctx.save();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = highlight ? '#F81ED5' : '#000000';
        ctx.beginPath();
        ctx.moveTo(this.a.x, this.a.y);
        ctx.lineTo(this.b.x, this.b.y);
        ctx.stroke();
        ctx.restore();
        this.updateInputPos();
    }

    updateInputPos() {
        this.input.setPos(
            (this.a.x + this.b.x) / 2,
            (this.a.y + this.b.y) / 2
        );
    }
}

function addInputElement(line) {
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.onchange = () => {
        input.value = input.value.toLowerCase();
        input.blur();
    };
    input.setPos = (x, y) => {
        const rect = input.getBoundingClientRect();
        input.style.setProperty('left', `${x - rect.width / 2}px`);
        input.style.setProperty('top', `${y - rect.height / 2}px`);
    };
    input.line = line;
    document.body.appendChild(input);
    return input;
}

// TODO: refactor, get rid of this class
// (snapping behavior doesn't belong here b/c we want snaps when we move points
// in existing lines, too)
class WetStroke {
    constructor(pos) {
        this.a = pos;
        this.b = pos.clone();
        this.refLine = null;
        this.snaps = [];
    }

    maybeAddVertical(p) {
        if (Math.abs(p.x - this.b.x) < 10) {
            this.b.x = p.x;
            this.snaps.push({ type: 'vertical', a: p, b: this.b });
        }
    }

    maybeAddHorizontal(p) {
        if (Math.abs(p.y - this.b.y) < 10) {
            this.b.y = p.y;
            this.snaps.push({ type: 'horizontal', a: p, b: this.b });
        }
    }

    update(pos, points, refLine) {
        this.snaps = [];
        const { a, b, snaps } = this;
        b.moveTo(pos);

        const coincidentPoint = points.find(p => p.distanceTo(b) < 10);
        if (coincidentPoint != null) {
            b.x = coincidentPoint.x;
            b.y = coincidentPoint.y;
            snaps.push({ type: 'coincident', a: coincidentPoint, b });
        } else {
            // TODO: also snap to any point that is "reachable" from this line
            this.maybeAddVertical(a);
            this.maybeAddHorizontal(a);
        }
        
        this.refLine = refLine;
        if (!refLine) {
            return;
        }

        // snaps w/ reference line

        // vertical and horizontal
        this.maybeAddVertical(refLine.a);
        this.maybeAddVertical(refLine.b);
        this.maybeAddHorizontal(refLine.a);
        this.maybeAddHorizontal(refLine.b);

        // lengths
        const refLen = refLine.a.distanceTo(refLine.b);
        let myLen = a.distanceTo(b);
        if (Math.abs(refLen - myLen) < 10) {
            b.moveTo(Vec.add(a, Vec.mulS(Vec.normalize(Vec.sub(b, a)), refLen)));
            snaps.push({ type: 'length', a: this, b: refLine });
            myLen = refLen;
        }

        // angles

        function maybeAddAngle(vec) {
            const p = Line.closestPoint({ a, b: a.plus(vec) }, b, false);
            if (p.distanceTo(b) < 10) {
                b.moveTo(p);
                // TODO: add snap
            }
        }

        const parallelVec = Vec.sub(refLine.b, refLine.a);
        const perpendicularVec = new Point(-parallelVec.y, parallelVec.x);
        maybeAddAngle(parallelVec);
        maybeAddAngle(perpendicularVec);
    }

    render(ctx) {
        const { a, b, snaps, refLine } = this;

        ctx.fillText(this.msg ?? '', 300, 300);
        ctx.save();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = snaps.find(s => s.type === 'length') ? '#F81ED5' : '#000000';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        function drawGuideLine(p1, p2) {
            const projectedP1 = Vec.add(p2, Vec.mulS(Vec.sub(p1, p2), 100));
            const projectedP2 = Vec.add(p1, Vec.mulS(Vec.sub(p2, p1), 100));
            ctx.lineWidth = 0.25;
            ctx.strokeStyle = '#F81ED5';
            ctx.beginPath();
            ctx.moveTo(projectedP1.x, projectedP1.y);
            ctx.lineTo(projectedP2.x, projectedP2.y);
            ctx.stroke();
        }

        const hSnap = snaps.find(s => s.type === 'horizontal');
        if (hSnap != null) {
            drawGuideLine(hSnap.a, hSnap.b);
        }

        const vSnap = snaps.find(s => s.type === 'vertical');
        if (vSnap != null) {
            drawGuideLine(vSnap.a, vSnap.b);
        }

        const aSnap = snaps.find(s => s.type === 'angle');
        if (aSnap != null) {
            drawGuideLine(a, b);
        }

        if (refLine) {
            const refLen = Line.len(Line(refLine.a, refLine.b));
            const normalizedLine = Vec.normalize(Vec.sub(b, a));
            const lenVec = Vec.mulS(normalizedLine, refLen);
            const longB = Vec.add(this.a, Vec.mulS(normalizedLine, 10000));

            ctx.lineWidth = 0.25;
            ctx.strokeStyle = '#F81ED5';

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(longB.x, longB.y);
            ctx.stroke();

            for (let i = 0; i < 10; i += 0.25) {
                const size = i % 1 === 0.0 ? 6 : 3;
                const perpendicular = Vec.mulS(Vec.rotate90CCW(normalizedLine), size);

                const snapPoint = Vec.add(this.a, Vec.mulS(lenVec, i));
                const snapPerpA = Vec.add(snapPoint, perpendicular);
                const snapPerpB = Vec.sub(snapPoint, perpendicular);
                ctx.beginPath();
                ctx.moveTo(snapPerpA.x, snapPerpA.y);
                ctx.lineTo(snapPerpB.x, snapPerpB.y);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

class DrawSnap { 
    constructor() {
        this.mode = 'draw';
        this.freeMode = false;

        this.wetStroke = null;
        this.refLine = null;
        this.points = [];
        this.lines = [];

        this.snapConstraints = [];
        this.scribbleConstraints = [];
    }

    removeBrokenConstraints() {
        // meant to be overridden / monkey-patched by client
    }

    findPointNear(pos) {
        return this.points.find(point => Vec.dist(point, pos) < 10);
    }

    findStrokeNear(pos) {
        return this.lines.find(
            line => Line.distToPoint(Line(line.a, line.b), pos) < 20
        );
    }

    beginStroke(pos) {
        this.wetStroke = new WetStroke(this.findPointNear(pos) ?? pos);
    }

    updateStroke(pos) {
        if (this.wetStroke) {
            this.wetStroke.update(pos, this.points, this.refLine);
        }
    }

    endStroke(_pos) {
        let a = this.findPointNear(this.wetStroke.a);
        if (!a) {
            a = this.wetStroke.a;
            this.points.push(a);
        }

        let b = this.findPointNear(this.wetStroke.b);
        if (!b) {
            b = this.wetStroke.b;
            this.points.push(b);
        }

        const l = new LineStroke(a, b);
        this.lines.push(l);
        
        this.snapConstraints = this.wetStroke.snaps;
        this.wetStroke = null;
    }
    
    update(events) {
        // Handle input
        events.pencil.forEach(event => {
            const pos = new Point(event.x, event.y);
            if (this.mode === 'draw') {
                if (event.type === 'began') {
                    this.beginStroke(pos);
                } else if (event.type === 'moved') {
                    this.updateStroke(pos);
                } else if (event.type === 'ended') {
                    this.endStroke(pos);
                }
            } else if (this.mode.startsWith('move')) {
                if (event.type === 'began') {
                    this.dragging = this.findPointNear(pos);
                    if (this.dragging) {
                        const reachablePoints = new Set([this.dragging]);
                        while (true) {
                            const oldSize = reachablePoints.size;
                            for (const p of reachablePoints) {
                                for (const l of this.lines) {
                                    if (l.a === p) {
                                        reachablePoints.add(l.b);
                                    } else if (l.b === p) {
                                        reachablePoints.add(l.a);
                                    }
                                }
                            }
                            if (reachablePoints.size === oldSize) {
                                break;
                            }
                        }
                        let fixedPointDistance = -Infinity;
                        for (const p of reachablePoints) {
                            const distance = Vec.dist(this.dragging, p);
                            if (distance > fixedPointDistance) {
                                fixedPointDistance = distance;
                                this.fixedPoint = p;
                            }
                        }
                    }
                }
                if (event.type === 'moved') {
                    if (this.dragging) {
                        this.dragging.moveTo(pos);
                    }
                }
                if (event.type === 'ended') {
                    this.dragging = false;
                    this.fixedPoint = null;
                }
            }
        });

        Object.entries(events.touches).forEach(([touchId, events]) => {
            events.forEach(event => {
                const pos = new Point(event.x, event.y);
                if (event.type === 'began') {
                    const found = this.findStrokeNear(pos);
                    if (this.refLine === found) {
                        this.refLine = null;
                    } else {
                        this.refLine = found;
                        this.fingerDownTime = event.timestamp;
                    }

                    // Toggle modes
                    if (Vec.dist(new Point(40, 40), pos) < 20) {
                        this.toggleModes();
                    }

                    // Toggle freeMode
                    if (Vec.dist(new Point(40, window.innerHeight - 40), pos) < 20) {
                        this.freeMode = true
                    }
                }
    
                if (event.type == 'ended') {
                    if (event.timestamp - this.fingerDownTime > 1.0) {
                        this.refLine = null;
                    }

                    if (this.freeMode) {
                        this.freeMode = false;
                        this.removeBrokenConstraints();
                    }
                    
                }
            }); 
        });
    }

    toggleModes() {
        if (this.mode === 'draw') {
            this.mode = 'move';
        } else if (this.mode === 'move') {
            this.mode = 'move-v2';
        } else if (this.mode === 'move-v2') {
            this.mode = 'scribble';
            for (const input of document.body.getElementsByTagName('input')) {
                input.placeholder = '...';
            }
            window.webkit.messageHandlers.messages.postMessage('mgr off');
        } else {
            this.scribbleConstraints = [];
            for (const input of document.body.getElementsByTagName('input')) {
                input.placeholder = '';
                input.blur();
                const c = parse(input.value);
                if (c != null) {
                    c.input = input;
                    this.scribbleConstraints.push(c);
                } else {
                    console.log('failed to parse:', input.value);
                }
            }
            console.log(this.scribbleConstraints);
            this.mode = 'draw';
            window.webkit.messageHandlers.messages.postMessage('mgr on');
        }
        document.body.className = this.mode;
        return this.mode;
    }

    render(ctx) {
        for (const line of this.lines) {
            line.render(ctx, line === this.refLine);
        }
        for (const point of this.points) {
            point.render(ctx, point === this.dragging);
        }
        if (this.wetStroke != null) {
            this.wetStroke.render(ctx);
        }

        // Draw toggle
        ctx.beginPath();
        ctx.ellipse(40, 40, 20, 20, 0, 0, Math.PI * 2);
        if (this.mode === 'draw') {
            ctx.fill();
        } else {
            ctx.stroke();
        }

        ctx.fillText(this.mode, 70, 40);

        ctx.beginPath();
        ctx.ellipse(40, window.innerHeight - 40, 20, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

export default DrawSnap;
