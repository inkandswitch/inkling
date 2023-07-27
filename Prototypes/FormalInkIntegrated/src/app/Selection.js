import TransformationMatrix from "../lib/transform_matrix"
import Vec from "../lib/vec"

export default class Selection {
    constructor(page){
        this.page = page
        this.points = {}
        this.points_down = {}

        // gesture state
        this.tapped_on = null

        this.selection_finger = null
        this.selection_finger_moved = null
        this.transform_finger = null
        this.transform_finger_moved = null
    }

    update(events) {
        let finger_down = events.did("finger", "began")
        if(finger_down) {
            
            // If we're not holding down a finger yet
            if(!this.selection_finger) { 
                this.selection_finger = finger_down
                this.selection_finger_moved = finger_down

                let point = this.page.findPointNear(finger_down.position)
                if(point) {    
                    this.selectPoint(point)
                    this.tapped_on = point
                } else {
                    this.tapped_on = null
                }

                // Set initial offset transform
                let transform = new TransformationMatrix()
                let p = finger_down.position
                transform.translate(p.x, p.y).inverse()
                Object.keys(this.points).forEach(id=>{
                    this.points_down[id] = transform.transform_point(this.points[id].position)
                })

            } else { // Two fingers, go into full transform mode
                this.transform_finger = finger_down
                this.transform_finger_moved = finger_down

                // Set initial offset transform
                
                let transform = new TransformationMatrix()
                let a = Vec.divS(Vec.add(this.selection_finger_moved.position, this.transform_finger.position), 2)
                let b = this.transform_finger.position
                transform.from_line(a, b).inverse()

                Object.keys(this.points).forEach(id=>{
                    this.points_down[id] = transform.transform_point(this.points[id].position)
                })
            }
        }

        // If we're already holding down a finger, switch to pinch gesture
        if(this.selection_finger) {
            let finger_move = events.did_last("finger", "moved", this.selection_finger.id)
            if(finger_move) {
                this.selection_finger_moved = finger_move
                this.transformSelection()
            }

            let finger_up = events.did("finger", "ended", this.selection_finger.id)
            if(finger_up) {
                // If it was a short tap
                if(finger_up.timestamp - this.selection_finger.timestamp < 0.2) {

                    // If we tapped on empty space
                    if(this.tapped_on == null) {
                        this.clearSelection()
                    }
                }

                
                this.selection_finger = null
                this.selection_finger_moved = null

                // TODO: this could be done better
                this.transform_finger = null
                this.transform_finger_moved = null
                
            }
        }

        if(this.transform_finger) {
            let finger_move = events.did("finger", "moved", this.transform_finger.id)
            if(finger_move) {
                this.transform_finger_moved = finger_move
                this.transformSelection()
            }

            let finger_two_up = events.did("finger", "ended", this.transform_finger.id)
            if(finger_two_up) {
                this.transform_finger = null
                this.transform_finger_moved = null

                // TODO: this could be done better
                this.selection_finger = null
                this.selection_finger_moved = null
            }
        }
    }

    selectPoint(point){
        this.points[point.id] = point
        this.tapped_on = point
        point.select()

        this.page.linesegments.forEach(ls=>{
            if(this.points[ls.a.id] && this.points[ls.b.id]) {
                ls.select()
            } else {
                ls.deselect()
            }
        })
    }

    clearSelection(){
        Object.values(this.points).forEach(point=>{
            point.deselect()
        })
        this.points = {}
        this.page.linesegments.forEach(ls=>{
            ls.deselect()
        })
    }

    transformSelection(){
        let transform = new TransformationMatrix()
        if(this.selection_finger_moved && this.transform_finger_moved) {
            let a = Vec.divS(Vec.add(this.selection_finger_moved.position, this.transform_finger_moved.position), 2)
            let b = this.transform_finger_moved.position
            transform.from_line(a, b)
        } else {
            let p = this.selection_finger_moved.position
            transform.translate(p.x, p.y)
        }
        

        Object.keys(this.points).forEach(id=>{
            let old_pos = this.points_down[id]
            let new_pos = transform.transform_point(old_pos)
            this.points[id].move(new_pos)
        })

        let snap = this.transformSnap(transform)
        transform = snap.transform_matrix(transform)

        Object.keys(this.points).forEach(id=>{
            let old_pos = this.points_down[id]
            let new_pos = transform.transform_point(old_pos)
            this.points[id].move(new_pos)
        })
    }

    transformSnap(){
        
        let snap_points = this.page.points.filter(pt=>!this.points[pt.id])

        let found_translate = null
        let snapped_point = null
        let translate_delta = Vec(0,0)
        for(let id in this.points) {
            let point = this.points[id]
            // Find snap point
            
            let found = snap_points.find(other_point=>Vec.dist(other_point.position, point.position) < 10)
            if(found) {
                // Get delta 
                let delta = Vec.sub(found.position, point.position)
                translate_delta = delta
                found_translate  = found
                snapped_point = point
                snap_points = snap_points.filter(p=>p.id != found.id)
                break;
                
            }
        }
        if(!found_translate) return new TransformationMatrix()


        // TODO figure this out, it's not working
        let rotate_delta = 0
        for(let id in this.points) {
            let point = this.points[id]
            // Find snap point
            
            let found = snap_points.find(other_point=>Vec.dist(other_point.position, point.position) < 20)
            if(found) {
                let angleA = Vec.angle(Vec.sub(point.position, found_translate.position))
                let angleB = Vec.angle(Vec.sub(found.position, found_translate.position))
                let delta = angleB - angleA;

                rotate_delta = delta;
                break;
            }
        }

        let transform = new TransformationMatrix();
        let found_old_position = this.points_down[snapped_point.id]
        

        transform.translate(translate_delta.x, translate_delta.y);

        // transform.translate(-snapped_point.position.x, -snapped_point.position.y);
        // transform.rotate(rotate_delta);
        // transform.translate(snapped_point.position.x, snapped_point.position.y);
        
        return transform

    }

    render(ctx) {
        // Object.values(this.points).forEach(point=>{
        //     point.renderSelected(ctx)
        // })
    }

}