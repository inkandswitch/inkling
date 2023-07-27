import TransformationMatrix from "../lib/transform_matrix";
import Vec from "../lib/vec";

export default class Selection {
    constructor(page) {
        this.page = page;
        this.points = {};
        this.points_down = {};

        // gesture state
        this.tapped_on = null;

        this.selection_finger = null;
        this.selection_finger_moved = null;
        this.transform_finger = null;
        this.transform_finger_moved = null;
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');
        if (fingerDown) {
            
            // If we weren't already holding down a finger
            if (!this.selection_finger) { 
                this.selection_finger = fingerDown;
                this.selection_finger_moved = fingerDown;

                const point = this.page.findPointNear(fingerDown.position);
                if (point) {    
                    this.selectPoint(point);
                    this.tapped_on = point;
                } else {
                    this.tapped_on = null;
                }

                // Set initial offset transform
                const transform = new TransformationMatrix();
                const p = fingerDown.position;
                transform.translate(p.x, p.y).inverse();
                Object.entries(this.points).forEach(([id, point]) => {
                    this.points_down[id] = transform.transform_point(point.position);
                });
            } else { // Two fingers, go into full transform mode
                this.transform_finger = fingerDown;
                this.transform_finger_moved = fingerDown;

                // Set initial offset transform
                
                const transform = new TransformationMatrix();
                const a = Vec.divS(Vec.add(this.selection_finger_moved.position, this.transform_finger.position), 2);
                const b = this.transform_finger.position;
                transform.from_line(a, b).inverse();

                Object.entries(this.points).forEach(([id, point]) => {
                    this.points_down[id] = transform.transform_point(point.position);
                });
            }
        }

        // If we're already holding down a finger, switch to pinch gesture
        if (this.selection_finger) {
            const fingerMove = events.did_last('finger', 'moved', this.selection_finger.id);
            if (fingerMove) {
                this.selection_finger_moved = fingerMove;
                this.transformSelection();
            }

            const fingerUp = events.did('finger', 'ended', this.selection_finger.id);
            if (fingerUp) {
                // If it was a short tap
                if (fingerUp.timestamp - this.selection_finger.timestamp < 0.2) {

                    // If we tapped on empty space
                    if (this.tapped_on == null) {
                        this.clearSelection();
                    }
                }

                
                this.selection_finger = null;
                this.selection_finger_moved = null;

                // TODO: this could be done better
                this.transform_finger = null;
                this.transform_finger_moved = null;
            }
        }

        if (this.transform_finger) {
            const fingerMove = events.did('finger', 'moved', this.transform_finger.id);
            if (fingerMove) {
                this.transform_finger_moved = fingerMove;
                this.transformSelection();
            }

            let fingerTwoUp = events.did('finger', 'ended', this.transform_finger.id);
            if (fingerTwoUp) {
                this.transform_finger = null;
                this.transform_finger_moved = null;

                // TODO: this could be done better
                this.selection_finger = null;
                this.selection_finger_moved = null;
            }
        }
    }

    selectPoint(point) {
        this.points[point.id] = point;
        this.tapped_on = point;
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
        let transform = new TransformationMatrix();
        if (this.selection_finger_moved && this.transform_finger_moved) {
            const a = Vec.divS(Vec.add(this.selection_finger_moved.position, this.transform_finger_moved.position), 2);
            const b = this.transform_finger_moved.position;
            transform.from_line(a, b);
        } else {
            const p = this.selection_finger_moved.position;
            transform.translate(p.x, p.y);
        }

        Object.entries(this.points).forEach(([id, point]) => {
            const old_pos = this.points_down[id];
            const new_pos = transform.transform_point(old_pos);
            point.move(new_pos);
        })

        const snap = this.transformSnap(transform);
        transform = snap.transform_matrix(transform);

        Object.entries(this.points).forEach(([id, point]) => {
            const old_pos = this.points_down[id];
            const new_pos = transform.transform_point(old_pos);
            point.move(new_pos);
        });
    }

    transformSnap() {
        let snapPoints = this.page.points.filter(p => !this.points[p.id]);

        let found_translate = null;
        let snapped_point = null;
        let translate_delta = Vec(0,0);
        for (let id in this.points) {
            const point = this.points[id];
            // Find snap point
            
            const found = snapPoints.find(other_point=>Vec.dist(other_point.position, point.position) < 10);
            if (found) {
                // Get delta 
                const delta = Vec.sub(found.position, point.position);
                translate_delta = delta;
                found_translate  = found;
                snapped_point = point;
                snapPoints = snapPoints.filter(p => p.id != found.id);
                break;
            }
        }
        if (!found_translate) {
            return new TransformationMatrix();
        }

        // TODO figure this out, it's not working
        let rotate_delta = 0;
        for (let id in this.points) {
            const point = this.points[id];
            // Find snap point
            
            const found = snapPoints.find(other_point=>Vec.dist(other_point.position, point.position) < 20);
            if (found) {
                const angleA = Vec.angle(Vec.sub(point.position, found_translate.position));
                const angleB = Vec.angle(Vec.sub(found.position, found_translate.position));
                const delta = angleB - angleA;

                rotate_delta = delta;
                break;
            }
        }

        const transform = new TransformationMatrix();
        const found_old_position = this.points_down[snapped_point.id];
        

        transform.translate(translate_delta.x, translate_delta.y);

        // transform.translate(-snapped_point.position.x, -snapped_point.position.y);
        // transform.rotate(rotate_delta);
        // transform.translate(snapped_point.position.x, snapped_point.position.y);
        
        return transform;
    }

    render(ctx) {
        // Object.values(this.points).forEach(p => p.renderSelected(ctx));
    }
}