import Vec from "./lib/vec"
import Line from "./lib/line"

// Monotonically incrementing id counter
let monotonic_ids = 0

class Point {
    constructor(pos){
        this.id = monotonic_ids++
        this.pos = pos || Vec()
    }

    render(ctx){
        ctx.beginPath()
        ctx.ellipse(this.pos.x, this.pos.y, 3, 3, 0, 0, Math.PI*2);
        ctx.fill()
    }
}

class LineStroke {
    constructor(a, b) {
        this.id = monotonic_ids++
        this.a = a
        this.b = b
    }

    render(ctx, highlight) {
        ctx.lineWidth = 1.0
        ctx.strokeStyle = highlight ? "#F81ED5" : "#000000"
        ctx.beginPath()
        ctx.moveTo(this.a.pos.x, this.a.pos.y)
        ctx.lineTo(this.b.pos.x, this.b.pos.y)
        ctx.stroke()
    }
}

class WetStroke {
    constructor(pos) {
        this.a = pos
        this.b = Vec.clone(pos)

        this.last_b = Vec.clone(pos)
        this.velocity = 0

        this.h_snap
        this.v_snap
        this.ref_line
        this.angle_snap
        this.angle_offset
        this.len_snap
        this.point_snap

    }

    update(pos, points, ref_line) {
        this.b = pos
        let new_velocity = Vec.dist(this.last_b, this.b)
        this.last_b = Vec.clone(this.b)
        this.velocity = 0.05 * new_velocity + (1 - 0.05) * this.velocity // Filter velocity
        //console.log(this.velocity);

        this.h_snap = false
        this.v_snap = false

        if(Math.abs(this.a.x-this.b.x) < 10) {
            this.b.x = this.a.x
            this.v_snap = true
        }
    
        if(Math.abs(this.a.y-this.b.y) < 10) {
            this.b.y = this.a.y
            this.h_snap = true
        }
        
        let snaps = []
        if(this.velocity < 1.5) {
            points.forEach(point=>{
                let sx = Line.getXforY(this, point.pos.y)
                let sy = Line.getYforX(this, point.pos.x)
                snaps.push({x: sx, y: point.pos.y, snap: point, type: "horizontal"})
                snaps.push({x: point.pos.x, y: sy, snap: point, type: "vertical"})
            })

            this.point_snap = false
            snaps.forEach(snap=>{
                if(Vec.dist(pos, snap) < 10) {
                    this.b.x = snap.x
                    this.b.y = snap.y
                    this.point_snap = snap
                }
            })
        } 

        // Snap to point
        let point_snap = points.find(point=>Vec.dist(point.pos, pos) < 10)
        if(point_snap) {
            this.b = point_snap.pos
            this.point_snap = {snap: point_snap, type: "coincident"}
        }

        
        // Snap with reference point
        this.len_snap = false
        this.angle_snap = false
        this.angle_offset = null
        if(ref_line) {
            this.ref_line = ref_line
            // Snap lengths
            let ref_len = Line.len(Line(ref_line.a.pos, ref_line.b.pos))
            let cur_len = Line.len(Line(this.a, this.b))
            if(Math.abs(ref_len - cur_len) < 10) {
                this.b = Vec.add(this.a, Vec.mulS(Vec.normalize(Vec.sub(this.b, this.a)), ref_len))
                this.len_snap = true
                cur_len = ref_len
            }

            // Snap Angles
            let my_vec = Vec.sub(this.a, this.b)
            let ref_vec = Vec.sub(ref_line.a.pos, ref_line.b.pos)

            let my_angle = Vec.angle(my_vec)
            let ref_angle = Vec.angle(ref_vec)

            let diff_angle = (my_angle - ref_angle + 360) % 360

            let closest_round_angle = (Math.round(diff_angle / 90) * 90 + 360) % 360
            if(Math.abs(diff_angle - closest_round_angle) < 10) {

                let new_angle = ref_angle + closest_round_angle
                this.b = Vec.add(this.a, Vec.polar(180 + new_angle, cur_len))
                this.angle_snap = true
                this.angle_offset = closest_round_angle
                // console.log('da', diff_angle, 'cra', closest_round_angle);
            }
        }
    }

    render(ctx) {
        ctx.lineWidth = 1.0
        ctx.strokeStyle = this.len_snap ? "#F81ED5" : "#000000";
        ctx.beginPath()
        ctx.moveTo(this.a.x, this.a.y)
        ctx.lineTo(this.b.x, this.b.y) 
        ctx.stroke()

        if(this.h_snap || this.v_snap || this.angle_snap) {
            let projected_a = Vec.add(this.b, Vec.mulS(Vec.sub(this.a, this.b), 100))
            let projected_b = Vec.add(this.a, Vec.mulS(Vec.sub(this.b, this.a), 100))
    
            ctx.lineWidth = 0.25
            ctx.strokeStyle = "#F81ED5"
            ctx.beginPath()
            ctx.moveTo(projected_a.x, projected_a.y)
            ctx.lineTo(projected_b.x, projected_b.y) 
            ctx.stroke()
        }

        if(this.point_snap) {
            let projected_a = Vec.add(this.b, Vec.mulS(Vec.sub(this.point_snap.snap.pos, this.b), 100))
            let projected_b = Vec.add(this.point_snap.snap.pos, Vec.mulS(Vec.sub(this.b, this.point_snap.snap.pos), 100))
            ctx.lineWidth = 0.25
            ctx.strokeStyle = "#F81ED5"
            ctx.beginPath()
            ctx.moveTo(projected_a.x, projected_a.y)
            ctx.lineTo(projected_b.x, projected_b.y) 
            ctx.stroke()
        }

        if(this.ref_line) {
            let ref_len = Line.len(Line(this.ref_line.a.pos, this.ref_line.b.pos))

            let normalized_line = Vec.normalize(Vec.sub(this.b, this.a))

            let long_b = Vec.add(this.a, Vec.mulS(normalized_line, 10000))
            let len_vec = Vec.mulS(normalized_line, ref_len)

            ctx.lineWidth = 0.25
            ctx.strokeStyle = "#F81ED5"

            ctx.beginPath()
            ctx.moveTo(this.a.x, this.a.y)
            ctx.lineTo(long_b.x, long_b.y) 
            ctx.stroke()

            for (let i = 0; i < 10; i+=0.25) {
                let size = i%1 == 0.0 ? 6 : 3
                let perpendicular = Vec.mulS(Vec.rotate90CCW(normalized_line), size)

                let snap_pt = Vec.add(this.a, Vec.mulS(len_vec, i))
                let snap_perp_a = Vec.add(snap_pt, perpendicular)
                let snap_perp_b = Vec.sub(snap_pt, perpendicular)
                ctx.beginPath()
                ctx.moveTo(snap_perp_a.x, snap_perp_a.y)
                ctx.lineTo(snap_perp_b.x, snap_perp_b.y) 
                ctx.stroke()
            }
        }
    }
}

class DrawSnap { 
    constructor(){
        this.mode = "draw"

        this.wet_stroke = null
        this.ref_line = null
        this.points = []
        this.lines = []

        this.constraints = []
    }

    find_point_near(pos) {
        return this.points.find(point=>{
            return Vec.dist(point.pos, pos) < 10
        })
    }

    find_stroke_near(pos) {
        return this.lines.find(line=>{
            let dist = Line.distToPoint(Line(line.a.pos, line.b.pos), pos)
            return dist < 20
        })
    }

    begin_stroke(pos) {
        let found = this.find_point_near(pos)
        if(found) pos = found.pos
        this.wet_stroke = new WetStroke(pos)
    }

    update_stroke(pos){
        if(this.wet_stroke) {
            this.wet_stroke.update(pos, this.points, this.ref_line)
        }
    }

    end_stroke(pos) {
        let a = this.find_point_near(this.wet_stroke.a)
        if(!a) a = new Point(this.wet_stroke.a)
        this.points.push(a)

        let b = this.find_point_near(this.wet_stroke.b)
        if(!b) b = new Point(this.wet_stroke.b)
        this.points.push(b)

        let l = new LineStroke(a, b)
        this.lines.push(l)
        

        // record constraints
        this.constraints.push({type: 'minLength', a:l, b: 50});
        let ws = this.wet_stroke
        if(ws.v_snap) {this.constraints.push({type: "vertical", a, b})}
        if(ws.h_snap) {this.constraints.push({type: "horizontal", a, b})}
        if(ws.point_snap && ws.point_snap.type != "coincident") {this.constraints.push({type: ws.point_snap.type, a:b, b:ws.point_snap.snap})}
        if(ws.len_snap) {this.constraints.push({type: "length", a:l, b:ws.ref_line})}
        if(ws.angle_snap && !ws.v_snap && !ws.h_snap) {this.constraints.push({type: "angle", a:l, b:ws.ref_line, angle: ws.angle_offset})}

        console.log(this.constraints);

        this.wet_stroke = null
    }
    
    update(events) {
        // Handle input
        events.pencil.forEach(event=>{
            let pos = Vec(event.x, event.y)
            if(this.mode == "draw") {
                if(event.type == "began") {
                    this.begin_stroke(pos)
                }
                if(event.type == "moved") {
                    this.update_stroke(pos)
                }
                if(event.type == "ended") {
                    this.end_stroke(pos)
                }
            } else if(this.mode.startsWith("move")) {
                if(event.type == "began") {
                    this.dragging = this.find_point_near(pos)
                    if (this.dragging) {
                        let fixedPointDistance = -Infinity;
                        for (const p of this.points) {
                            const distance = Vec.dist(this.dragging.pos, p.pos);
                            if (distance > fixedPointDistance) {
                                fixedPointDistance = distance;
                                this.fixedPoint = p;
                            }
                        }
                    }
                }
                if(event.type == "moved") {
                    if(this.dragging) {
                        this.dragging.pos = pos
                    }
                }
                if(event.type == "ended") {
                    this.dragging = false
                    this.fixedPoint = null;
                }
            }
            
        })

        Object.entries(events.touches).forEach(([touchId, events])=>{
            events.forEach(event=>{
                let pos = Vec(event.x, event.y)
                if(event.type == "began") {
                        const found = this.find_stroke_near(pos)
                        if(this.ref_line == found) {
                            this.ref_line = null
                        } else {
                            this.ref_line = found
                            this.finger_down_time = event.timestamp
                        }
                        
                        this.ref_line_id = touchId
                    //}

                    if(Vec.dist(Vec(40,40), pos) < 20) {
                        if(this.mode == "draw") {
                            this.mode = "move"
                        } else if(this.mode == "move") {
                            this.mode = "move-v2"
                        } else {
                            this.mode = "draw"
                        }
                    }
                }
    
                if(event.type == "ended") {
                    if(event.timestamp - this.finger_down_time > 1.0) {
                        this.ref_line = null
                    }
                }
            })
            
        })
    }

    render(ctx) {
        this.lines.forEach(line=>{
            line.render(ctx, line == this.ref_line)
        })
        this.points.forEach(point=>{
            point.render(ctx)
        })

        if(this.wet_stroke) {
            this.wet_stroke.render(ctx)
        }

        // Draw toggle
        ctx.beginPath()
        ctx.ellipse(40, 40, 20, 20, 0, 0, Math.PI*2)
        if(this.mode == "draw") {
            ctx.fill()
        } else {
            ctx.stroke()
        }

        ctx.fillText(this.mode, 70, 40)
    }
}

export default DrawSnap