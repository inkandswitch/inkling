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

        this.snaps = []
    }

    update(pos, points, ref_line) {
        this.b = pos
        let new_velocity = Vec.dist(this.last_b, this.b)
        this.last_b = Vec.clone(this.b)
        this.velocity = 0.05 * new_velocity + (1 - 0.05) * this.velocity // Filter velocity
        //console.log(this.velocity);

        this.hv_snap = false

        if(Math.abs(this.a.x-this.b.x) < 10) {
            this.b.x = this.a.x
            this.hv_snap = true
        }
    
        if(Math.abs(this.a.y-this.b.y) < 10) {
            this.b.y = this.a.y
            this.hv_snap = true
        }
        
        this.snaps = []
        if(this.velocity < 1.5) {
            points.forEach(point=>{
                let sx = Line.getXforY(this, point.pos.y)
                let sy = Line.getYforX(this, point.pos.x)
                this.snaps.push({x: sx, y: point.pos.y, snap: point})
                this.snaps.push({x: point.pos.x, y: sy, snap: point})
            })

            this.snaps.forEach(snap=>{
                if(Vec.dist(pos, snap) < 10) {
                    this.b = snap
                }
            })
        } 

        // Snap to point
        let point_snap = points.find(point=>Vec.dist(point.pos, pos) < 10)
        if(point_snap) {
            this.b = point_snap.pos
        }

        
        // Snap with reference point
        this.len_snap = false
        if(ref_line) {
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
            let ref_angle = Vec.angle(ref_vec)
            let diff_angle = Vec.angleBetweenClockwise(my_vec, ref_vec)

            let closet_round_angle = Math.round(diff_angle / 90) * 90
            if(Math.abs(diff_angle - closet_round_angle) < 10) {

                let new_angle = ref_angle + closet_round_angle + 90
                this.b = Vec.add(this.a, Vec.polar(new_angle, cur_len))
                this.hv_snap = true
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

        if(this.hv_snap) {
            let projected_a = Vec.add(this.b, Vec.mulS(Vec.sub(this.a, this.b), 100))
            let projected_b = Vec.add(this.a, Vec.mulS(Vec.sub(this.b, this.a), 100))
    
            ctx.lineWidth = 0.25
            ctx.strokeStyle = "#F81ED5"
            ctx.beginPath()
            ctx.moveTo(projected_a.x, projected_a.y)
            ctx.lineTo(projected_b.x, projected_b.y) 
            ctx.stroke()
        }
        

        

        // snaps
        // let offset = Vec.rotate90CW(Vec.mulS(Vec.normalize(Vec.sub(this.a, this.b)), 5))
        // this.snaps.forEach(snap=>{
        //     let snap_a = Vec.add(snap, offset)
        //     let snap_b = Vec.sub(snap, offset)
        //     ctx.beginPath()
        //     ctx.moveTo(snap_a.x, snap_a.y)
        //     ctx.lineTo(snap_b.x, snap_b.y)
        //     ctx.stroke()
        // })

        if(this.b.snap) {
            let projected_a = Vec.add(this.b, Vec.mulS(Vec.sub(this.b.snap.pos, this.b), 100))
            let projected_b = Vec.add(this.b.snap.pos, Vec.mulS(Vec.sub(this.b, this.b.snap.pos), 100))
            ctx.lineWidth = 0.25
            ctx.strokeStyle = "#F81ED5"
            ctx.beginPath()
            ctx.moveTo(projected_a.x, projected_a.y)
            ctx.lineTo(projected_b.x, projected_b.y) 
            ctx.stroke()
        }
    }
}

class DrawSnap { 
    constructor(){
        this.wet_stroke = null
        this.ref_line = null
        this.points = []
        this.lines = []
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
        
        this.wet_stroke = null
    }
    
    update(events) {
        // Handle input
        events.pencil.forEach(event=>{
            let pos = Vec(event.x, event.y)
            if(event.type == "began") {
                this.begin_stroke(pos)
            }
            if(event.type == "moved") {
                this.update_stroke(pos)
            }
            if(event.type == "ended") {
                this.end_stroke(pos)
            }
        })

        Object.entries(events.touches).forEach(([touchId, events])=>{
            events.forEach(event=>{
                let pos = Vec(event.x, event.y)
                if(event.type == "began") {
                    if(this.ref_line == null) {
                        this.ref_line = this.find_stroke_near(pos)
                        this.ref_line_id = touchId
                    }
                }
    
                if(event.type == "ended") {
                    //if(this.ref_line_id == touchId){
                        this.ref_line = null
                    //}
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
    }
}

export default DrawSnap