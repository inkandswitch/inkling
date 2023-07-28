import TransformationMatrix from "../lib/transform_matrix";
import Vec from "../lib/vec";

export default class Selection {
    constructor(page) {
        this.page = page;
        this.points = new Set();
        this.origPosition = new Map(); // point -> position
        this.snapVectors = new Map();

        // gesture state
        this.tappedOn = null; // point
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
                for (const point of this.points) {
                    this.origPosition.set(point, transform.transformPoint(point.position));
                }
            } else { // Two fingers, go into full transform mode
                this.transformFinger = fingerDown;
                this.transformFingerMoved = fingerDown;

                // Set initial offset transform
                const transform = new TransformationMatrix();
                const a = Vec.divS(Vec.add(this.selectionFingerMoved.position, this.transformFinger.position), 2);
                const b = this.transformFinger.position;
                transform.fromLine(a, b).inverse();
                for (const point of this.points) {
                    this.origPosition.set(point, transform.transformPoint(point.position));
                }
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
                const shortTap = fingerUp.timestamp - this.selectionFinger.timestamp < 0.2;
                if (shortTap) {
                    const tappedOnEmptySpace = this.tappedOn == null;
                    if (tappedOnEmptySpace) {
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
        this.points.add(point);
        this.tappedOn = point;
        point.select();

        this.page.lineSegments.forEach(ls => {
            if (this.points.has(ls.a) && this.points.has(ls.b)) {
                ls.select();
            } else {
                ls.deselect();
            }
        });
    }

    clearSelection() {
        for (const point of this.points) {
            point.deselect();
        }
        this.points = new Set();
        this.origPosition = new Map();

        for (const ls of this.page.lineSegments) {
            ls.deselect();
        }
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
            const a =
                Vec.divS(
                    Vec.add(
                        this.selectionFingerMoved.position,
                        this.transformFingerMoved.position
                    ),
                    2
                );
            const b = this.transformFingerMoved.position;
            transform.fromLine(a, b);
        } else {
            const p = this.selectionFingerMoved.position;
            transform.translate(p.x, p.y);
        }

        for (const point of this.points) {
            const oldPos = this.origPosition.get(point);
            const newPos = transform.transformPoint(oldPos);
            point.move(newPos);
        }

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

        const snapPoints = this.page.points.filter(p => !this.points.has(p.id));
        for (const point of this.points) {
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

    render(ctx) {
        // for (const point of this.points) {
        //     point.renderSelected(ctx);
        // }
    }
}