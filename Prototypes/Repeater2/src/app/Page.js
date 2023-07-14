import Point from "./Point";
import LineStroke from "./LineStroke";
import Vec from "../lib/vec";
import Line from "../lib/line";
import Repeater from "./Repeater";

export default class Page {
    constructor(){
        this.points = []
        this.strokes = []

        this.repeater = null

        // Selection and movement
        this.selection = {
            points: {},
            strokes: {}
        }

        this.last_tap_time = null

        this.transform = {
            finger_a: null,
            finger_b: null,
            empty_space: false,
            dragging: false,
            finger_a_down: null,
            finger_b_down: null,
            finger_a_moved: null,
            finger_b_moved: null,
            points_down: {}
        }

    }

    // TOUCH EVENTS
    touch_down(pos, id, timestamp){

        if(Vec.dist(Vec(10, 10), pos) < 50) {
            let strokes = Object.keys(this.selection.strokes).sort().map(id=>this.selection.strokes[id])
            this.repeater = new Repeater(strokes)
            return
        }
        
        if(this.transform.finger_a == null) { // First finger
            this.empty_space = true
            this.last_tap_time = timestamp

            this.transform.finger_a = id

            // Add to selection
            const found = this.find_point_near(pos);
            if(found) {
                this.selection.points[found.id] = found;
                this.empty_space = false
            } else {
                const found_line = this.find_stroke_near(pos);
                if(found_line) {
                    this.selection.strokes[found_line.id] = found_line;
                    this.selection.points[found_line.a.id] = found_line.a;
                    this.selection.points[found_line.b.id] = found_line.b;
                    this.empty_space = false
                }
            }

            
            // Drag move
            this.transform.dragging = true
            this.transform.finger_a_down = pos
            this.transform.points_down = {}
            Object.keys(this.selection.points).forEach(id=>{
                this.transform.points_down[id] = Vec.clone(this.selection.points[id].pos)
            })

        } else {
            // Second finger
            this.transform.finger_b = id
            this.transform.finger_b_down = pos
        }

    }

    touch_move(pos, id, timestamp){
        if(!this.transform.dragging) return

        if(this.transform.finger_b) {
            if(id == this.transform.finger_a) {
               
            }
            
        } else {
            if(id == this.transform.finger_a) {
                this.finger_a_moved = pos
                let delta = Vec.sub(pos, this.transform.finger_a_down)
                Object.keys(this.selection.points).forEach(id=>{
                    this.selection.points[id].pos = Vec.add(this.transform.points_down[id], delta)
                })
            }
        }
    }

    touch_up(pos, id, timestamp) {
        this.transform.dragging = false

        if(this.transform.finger_a == id) {
            this.transform.finger_a = null
        }
        if(this.transform.finger_b == id) {
            this.transform.finger_b = null
        }
        console.log(this.transform.finger_a);
        
        // Handle taps 
        if(timestamp - this.last_tap_time < 0.2) {
            if(this.empty_space) {
            
                // double tap
                this.selection = {
                    points: {},
                    strokes: {}
                }
                this.last_tap_time = null
                return
            }
        } else {
            if(!this.empty_space && (Object.keys(this.selection.points).length == 1 || Object.keys(this.selection.strokes).length == 1)) {
            
                this.selection = {
                    points: {},
                    strokes: {}
                }
            }
        }


    }

    // FIND ELEMENTS
    find_point_near(pos) {
        return this.points.find(point => Vec.dist(point.pos, pos) < 20);
    }

    find_stroke_near(pos) {
        return this.strokes.find(stroke=> {
            const dist = Line.distToPoint(Line(stroke.a.pos, stroke.b.pos), pos);
            return dist < 20;
        })
    }

    // ADD NEW
    add_line(line) {
        let a = new Point(line.a)
        let b = new Point(line.b)

        this.points.push(a)
        this.points.push(b)
        this.strokes.push(new LineStroke(a, b))
    }

    render(ctx){
        this.strokes.forEach(stroke=>{
            stroke.render(ctx, this.selection.strokes[stroke.id])
        })

        this.points.forEach(point=>{
            point.render(ctx, this.selection.points[point.id])
        })

        if(this.repeater) {
            this.repeater.render(ctx)
        }
    }
}