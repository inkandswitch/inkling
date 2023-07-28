import TransformationMatrix from "../lib/transform_matrix";
import Vec from "../lib/vec";

export default class Selection {
    constructor(page) {
        this.page = page;
        this.points = {};
        this.pointsDown = {};
        this.snapVectors = new Map();

        // gesture state
        this.tappedOn = null; // a point
        this.selectionFinger = null;
        this.selectionFingerMoved = null;
        this.transformFinger = null;
        this.transformFingerMoved = null;
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');
        if (fingerDown) {
            // If we weren't already holding down a finger
            if (!this.selectionFinger) { 
                this.selectionFinger = fingerDown;
                this.selectionFingerMoved = fingerDown;

                const point = this.page.findPointNear(fingerDown.position);
                if (point) {    
                    this.selectPoint(point);
                    this.tappedOn = point;
                } else {
                    this.tappedOn = null;
                }

                // Set initial offset transform
                const transform = new TransformationMatrix();
                const p = fingerDown.position;
                transform.translate(p.x, p.y).inverse();
                Object.entries(this.points).forEach(([id, point]) => {
                    this.pointsDown[id] = transform.transformPoint(point.position);
                });
            } else { // Two fingers, go into full transform mode
                this.transformFinger = fingerDown;
                this.transformFingerMoved = fingerDown;

                // Set initial offset transform
                
                const transform = new TransformationMatrix();
                const a = Vec.divS(Vec.add(this.selectionFingerMoved.position, this.transformFinger.position), 2);
                const b = this.transformFinger.position;
                transform.fromLine(a, b).inverse();

                Object.entries(this.points).forEach(([id, point]) => {
                    this.pointsDown[id] = transform.transformPoint(point.position);
                });
            }
        }

        // If we're already holding down a finger, switch to pinch gesture
        if (this.selectionFinger) {
            const fingerMove = events.didLast('finger', 'moved', this.selectionFinger.id);
            if (fingerMove) {
                this.selectionFingerMoved = fingerMove;
                this.transformSelection();
            }

            const fingerUp = events.did('finger', 'ended', this.selectionFinger.id);
            if (fingerUp) {
                // If it was a short tap
                if (fingerUp.timestamp - this.selectionFinger.timestamp < 0.2) {

                    // If we tapped on empty space
                    if (this.tappedOn == null) {
                        this.clearSelection();
                    }
                }

                
                this.selectionFinger = null;
                this.selectionFingerMoved = null;

                // TODO: this could be done better
                this.transformFinger = null;
                this.transformFingerMoved = null;
            }
        }

        if (this.transformFinger) {
            const fingerMove = events.did('finger', 'moved', this.transformFinger.id);
            if (fingerMove) {
                this.transformFingerMoved = fingerMove;
                this.transformSelection();
            }

            let fingerTwoUp = events.did('finger', 'ended', this.transformFinger.id);
            if (fingerTwoUp) {
                this.transformFinger = null;
                this.transformFingerMoved = null;

                // TODO: this could be done better
                this.selectionFinger = null;
                this.selectionFingerMoved = null;
            }
        }
    }

    selectPoint(point) {
        this.points[point.id] = point;
        this.tappedOn = point;
        point.select();

        this.page.linesegments.forEach(ls => {
            if (this.points[ls.a.id] && this.points[ls.b.id]) {
                ls.select();
            } else {
                ls.deselect();
            }
        });
    }

    clearSelection() {
        Object.values(this.points).forEach(point => point.deselect());
        this.points = {};
        this.page.linesegments.forEach(ls => ls.deselect());
    }

    transformSelection() {
        for (const [point, vs] of this.snapVectors) {
            const unsnappedPos =
                vs.reduce(
                    (p, v) => Vec.sub(p, v),
                    point.position
                );
            point.move(unsnappedPos);
        }

        const transform = new TransformationMatrix();
        if (this.selectionFingerMoved && this.transformFingerMoved) {
            const a = Vec.divS(Vec.add(this.selectionFingerMoved.position, this.transformFingerMoved.position), 2);
            const b = this.transformFingerMoved.position;
            transform.fromLine(a, b);
        } else {
            const p = this.selectionFingerMoved.position;
            transform.translate(p.x, p.y);
        }

        Object.entries(this.points).forEach(([id, point]) => {
            const oldPos = this.pointsDown[id];
            const newPos = transform.transformPoint(oldPos);
            point.move(newPos);
        })

        // const snap = this.transformSnap(transform);
        // transform = snap.transformMatrix(transform);

        Object.entries(this.points).forEach(([id, point]) => {
            const oldPos = this.pointsDown[id];
            const newPos = transform.transformPoint(oldPos);
            point.move(newPos);
        });

        this.computeSnapVectors();
        for (const [point, vs] of this.snapVectors) {
            const snappedPos =
                vs.reduce(
                    (p, v) => Vec.add(p, v),
                    point.position
                );
            point.move(snappedPos);
        }
    }

    computeSnapVectors() {
        this.snapVectors = new Map();

        const snapPoints = this.page.points.filter(p => !this.points[p.id]);
        for (const point of Object.values(this.points)) {
            const snaps = [];

            // snap to point
            for (const snapPoint of snapPoints) {
                const v = Vec.sub(snapPoint.position, point.position);
                if (Vec.len(v) < 10) {
                    snaps.push(v);
                    break;
                }
            }

            if (snaps.length === 0) {
                // vertical alignment
                for (const snapPoint of snapPoints) {
                    const dx = snapPoint.position.x - point.position.x;
                    if (Math.abs(dx) < 10) {
                        const v = Vec(dx, 0);
                        snaps.push(v);
                        break;
                    }
                }

                // horizontal alignment
                for (const snapPoint of snapPoints) {
                    const dy = snapPoint.position.y - point.position.y;
                    if (Math.abs(dy) < 10) {
                        const v = Vec(0, dy);
                        snaps.push(v);
                        break;
                    }
                }
            }

            if (snaps.length > 0) {
                this.snapVectors.set(point, snaps);
            }
        }
    }

    _transformSnap() {
        let snapPoints = this.page.points.filter(p => !this.points[p.id]);

        let foundTranslate = null;
        let snappedPoint = null;
        let translateDelta = Vec(0,0);
        for (let id in this.points) {
            const point = this.points[id];
            // Find snap point
            
            const found = snapPoints.find(otherPoint => Vec.dist(otherPoint.position, point.position) < 10);
            if (found) {
                // Get delta
                const delta = Vec.sub(found.position, point.position);
                translateDelta = delta;
                foundTranslate  = found;
                snappedPoint = point;
                snapPoints = snapPoints.filter(p => p.id != found.id);
                break;
            }
        }
        if (!foundTranslate) {
            return new TransformationMatrix();
        }

        // TODO figure this out, it's not working
        let rotateDelta = 0;
        for (let id in this.points) {
            const point = this.points[id];
            // Find snap point
            
            const found = snapPoints.find(otherPoint=>Vec.dist(otherPoint.position, point.position) < 20);
            if (found) {
                const angleA = Vec.angle(Vec.sub(point.position, foundTranslate.position));
                const angleB = Vec.angle(Vec.sub(found.position, foundTranslate.position));
                const delta = angleB - angleA;

                rotateDelta = delta;
                break;
            }
        }

        const transform = new TransformationMatrix();
        const foundOldPosition = this.pointsDown[snappedPoint.id];
        
        transform.translate(translateDelta.x, translateDelta.y);

        // transform.translate(-snappedPoint.position.x, -snappedPoint.position.y);
        // transform.rotate(rotateDelta);
        // transform.translate(snappedPoint.position.x, snappedPoint.position.y);
        
        return transform;
    }

    render(ctx) {
        // Object.values(this.points).forEach(p => p.renderSelected(ctx));
    }
}