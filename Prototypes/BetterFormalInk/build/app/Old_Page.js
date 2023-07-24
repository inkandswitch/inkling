import Point from "./Point.js";
import LineStroke from "./LineStroke.js";
import Vec from "../lib/vec.js";
import Line from "../lib/line.js";
import Repeater from "./Repeater.js";

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
            finger_a_move: null,
            finger_b_move: null,
            points_down: {}
        }

        this.repeater_interaction = null
        this.repeater_old_rotation = 0

    }

    // TOUCH EVENTS
    touch_down(pos, id, timestamp){

        if(this.repeater && Vec.dist(Vec(40, 40), pos) < 80) {
            this.repeater_interaction = pos
            this.repeater_old_rotation = this.repeater.repetiton_rotation
        }

        if(Vec.dist(Vec(10, 10), pos) < 50) {
            let strokes = Object.keys(this.selection.strokes).sort().map(id=>this.selection.strokes[id])
            this.repeater = new Repeater(strokes)
            this.selection = {
                points: {},
                strokes: {}
            }
            //this.repeater.mid.points.forEach(pt=>this.selection.points[pt.id] = pt)
            //this.repeater.mid.strokes.forEach(st=>this.selection.strokes[st.id] = st)

            console.log(this.selection);
            return
        }
        
        if(this.transform.finger_a == null) { // First finger
            this.empty_space = true
            this.last_tap_time = timestamp

            

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
            
            this.transform.finger_a = id
            this.transform.finger_a_down = pos
            this.transform.finger_a_move = pos
            this.transform.points_down = {}
            Object.keys(this.selection.points).forEach(id=>{
                this.transform.points_down[id] = Vec.clone(this.selection.points[id].pos)
            })

        } else {
            // Second finger
            this.transform.finger_b = id
            this.transform.finger_b_down = pos
            this.transform.finger_b_move = pos
            this.transform.finger_a_down = this.transform.finger_a_move
            this.transform.points_down = {}
            Object.keys(this.selection.points).forEach(id=>{
                this.transform.points_down[id] = Vec.clone(this.selection.points[id].pos)
            })
        }

    }

    touch_move(pos, id, timestamp){

        if(this.repeater_interaction) {
            let delta = pos.y - this.repeater_interaction.y
            this.repeater_interaction = pos
            this.repeater.update_repetitions(delta)
            return
        }

        if(!this.transform.dragging) return

        if(this.transform.finger_b) {
            if(id == this.transform.finger_a) {
                this.transform.finger_a_move = pos
            }

            if(id == this.transform.finger_b) {
                this.transform.finger_b_move = pos
            }

            let midpoint_down = Vec.mulS(Vec.add(this.transform.finger_a_down, this.transform.finger_b_down), 0.5)
            let midpoint_move = Vec.mulS(Vec.add(this.transform.finger_a_move, this.transform.finger_b_move), 0.5)
            let translate_delta = Vec.sub(midpoint_move, midpoint_down)

            let angle_down = Vec.angle(Vec.sub(this.transform.finger_a_down, this.transform.finger_b_down))
            let angle_move =  Vec.angle(Vec.sub(this.transform.finger_a_move, this.transform.finger_b_move))
            let angle_delta = angle_move - angle_down

            if(this.repeater) {
                this.repeater.transform(translate_delta, angle_delta)
            } else {
                // Translate points and compute centroid
                let center = Vec(0,0)
                Object.keys(this.selection.points).forEach(id=>{
                    this.selection.points[id].pos = Vec.add(this.transform.points_down[id], translate_delta)
                    center = Vec.add(center, this.selection.points[id].pos)
                })
                center = Vec.divS(center, Object.keys(this.selection.points).length)

                // Rotate point around center
                Object.keys(this.selection.points).forEach(id=>{
                    this.selection.points[id].pos = Vec.rotateAround(this.selection.points[id].pos, center, angle_delta)
                })
            }
            
        } else {
            if(id == this.transform.finger_a) {
                this.finger_a_moved = pos
                let delta = Vec.sub(pos, this.transform.finger_a_down)
                if(this.repeater) {
                    this.repeater.transform(delta, 0)
                } else {
                    Object.keys(this.selection.points).forEach(id=>{
                        this.selection.points[id].pos = Vec.add(this.transform.points_down[id], delta)
                    })
                }
            }
        }
    }

    touch_up(pos, id, timestamp) {
        if(this.repeater) this.repeater.bake()

        this.transform.dragging = false
        this.repeater_interaction = null

        if(this.transform.finger_a == id) {
            this.transform.finger_a = null
        }
        if(this.transform.finger_b == id) {
            this.transform.finger_b = null
        }
        console.log(this.transform.finger_a);
        
        // Handle taps 
        if(timestamp - this.last_tap_time < 0.2) {
            // Tap in empty space, clear selection
            if(this.empty_space) {
                
                if(this.repeater) {
                    this.repeater.copies.forEach(copy=>{
                        copy.points.forEach(point=>{
                            this.points.push(point)
                        })
                        copy.strokes.forEach(stroke=>{
                            this.strokes.push(stroke)
                        })
                    })
                    this.repeater = null
                }

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

        if(!this.repeater) {
            ctx.beginPath();
            ctx.ellipse(30, 30, 20, 20, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        

        this.strokes.forEach(stroke=>{
            stroke.render(ctx, this.selection.strokes[stroke.id] ? '#F81ED5': (this.repeater ? '#AAAAAA':'#000000'))
        })

        this.points.forEach(point=>{
            point.render(ctx, this.selection.points[point.id] ? '#F81ED5': (this.repeater ? '#AAAAAA':'#000000'))
        })

        if(this.repeater) {
            this.repeater.render(ctx)
        }
    }
}