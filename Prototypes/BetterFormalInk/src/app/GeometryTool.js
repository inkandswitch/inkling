import Arc from "../lib/arc";
import Fit from "../lib/fit";
import Line from "../lib/line";
import Vec from "../lib/vec";

let qua = Math.PI * 0.5 // 90 degrees
let phi = Math.PI * 2 // 360 degrees

export default class GeometryTool {
    constructor(page){
        this.page = page
        this.input_points = []
        this.ideal_points = []
        this.render_points = []
        
        // Velocity stuff
        this.velocity = 0
        this.max_velocity = 0
        this.prev_pos = null

        // Curve fitting
        this.state = "unknown" // unknown, guess, fixed
        this.fit = null

        // Snaps
        this.snaps = {}

    }

    pen_down(pos){
        this.input_points = [pos]
        this.render_points = [Vec.clone(pos)]

        this.velocity = 0
        this.max_velocity = 0
        this.prev_pos = pos

        this.state = "unknown"

        this.snaps = {}
    }

    pen_move(pos) {
        // Compute filtered velocity
        const new_velocity = Vec.dist(this.prev_pos, pos)
        const alpha = 0.05 // Filtering constant
        this.velocity = alpha * new_velocity + (1 - alpha) * this.velocity
        this.max_velocity = Math.max(this.max_velocity, this.velocity)
        this.prev_pos = pos

        if(this.state != "fixed") {
            if(Vec.dist(this.input_points[this.input_points.length-1], pos) > 1) {
                // Add point to input buffer
                this.input_points.push(pos)
                this.render_points.push(Vec.clone(pos))
            }
        }

        if(this.state == "unknown" && this.input_points.length > 100) {
            this.state = "guess"
        }

        if(this.state == "guess") {
            this.do_fit()
        }

        if(this.state != "fixed" && this.input_points.length > 10 && this.velocity < 1 && this.velocity < this.max_velocity) {
            this.do_fit()
            this.state = "fixed"
        }

        if(this.state == "fixed") {
            if(this.fit) {
                if(this.fit.type == "line") {
                    this.fit.line.b = pos
                    this.do_snap()
                    this.update_ideal()
                }

                if(this.fit.type == "arc") {
                    // update angle
                    let diff = Vec.sub(pos, this.fit.arc.center)
                    let angle = Math.atan2(diff.y, diff.x)
                    this.fit.arc.endAngle = angle

                    // update center
                    let start_pos = Vec.add(this.fit.arc.center, Vec.polar(this.fit.arc.startAngle, this.fit.arc.radius))
                    let new_radius = Vec.dist(this.fit.arc.center, pos)
                    
                    let new_center = Vec.add(start_pos, Vec.mulS(Vec.normalize(Vec.sub(this.fit.arc.center, start_pos)), new_radius))

                    this.fit.arc.radius = new_radius
                    this.fit.arc.center = new_center
                    // this.fit.arc.center = Vec.mulS(Vec.add(start_pos, pos), 0.5)
                    // 

                    this.do_snap()
                    this.update_ideal()
                }
            }
        }
    }

    pen_up(pos) {
        this.state = "fixed"
        this.snaps = {}
        
        if(this.fit) {
            if(this.fit.type == "line") {
                this.page.add_line(this.fit.line)
            }
        }
    }

    do_fit(){
        let line_fit = Fit.line(this.input_points)
        let arc_fit = Fit.arc(this.input_points)
        let circle_fit = Fit.circle(this.input_points)

        this.arc_fit = arc_fit
        this.line_fit = line_fit
        this.circle_fit = circle_fit

        this.fit = line_fit
        if(arc_fit && Math.abs(Arc.directedInnerAngle(arc_fit.arc)) > 0.4*Math.PI && arc_fit.fitness < line_fit.fitness) {
            this.fit = arc_fit

            if(Math.abs(Arc.directedInnerAngle(arc_fit.arc)) > 1.5*Math.PI) {
                if(circle_fit && circle_fit.circle.radius < 500 && circle_fit.fitness < arc_fit.fitness) {
                    this.fit = circle_fit
                }
            }
        }
        
        if(this.fit) {
            this.do_snap()
            this.update_ideal()
        }
    }

    do_snap(){
        this.snaps = {}
        if(this.fit.type == "line") {
            let line = this.fit.line

            // Line snaps
            if(Math.abs(line.a.x - line.b.x) < 20) {
                line.b.x = line.a.x
                this.snaps["v_snap"] = Line(
                    Vec.add(line.b, Vec.mulS(Vec.sub(line.a, line.b), 100)),
                    Vec.add(line.a, Vec.mulS(Vec.sub(line.b, line.a), 100))
                )
            }

            if(Math.abs(line.a.y - line.b.y) < 20) {
                line.b.y = line.a.y
                this.snaps["h_snap"] = Line(
                    Vec.add(line.b, Vec.mulS(Vec.sub(line.a, line.b), 100)),
                    Vec.add(line.a, Vec.mulS(Vec.sub(line.b, line.a), 100))
                )
            }

            // Alignment snaps
            // if (this.velocity < 1.5) {
            //     this.pagepoints.forEach(point => {
            //         const sx = Line.getXforY(line, point.pos.y);
            //         const sx_pt = Vec(sx, point.pos.y)
            //         if(Vec.dist(pos, sx_pt) < 10) {

            //         }


            //         const sy = Line.getYforX(line, point.pos.x);

                    
            //         // snaps.push(
            //         //     { type: 'horizontal', x: sx, y: point.pos.y, snap: point },
            //         //     { type: 'vertical', x: point.pos.x, y: sy, snap: point },
            //         // );
            //     });
    
            //     this.point_snap = false;
            //     snaps.forEach(snap => {
            //         if (Vec.dist(pos, snap) < 10) {
            //             this.b.x = snap.x;
            //             this.b.y = snap.y;
            //             this.point_snap = snap;
            //         }
            //     });
            // } 

            // Cooincident snaps
            const point_snap_a = this.page.find_point_near(line.a, 10)
            if (point_snap_a) {
                line.a = point_snap_a.pos;
            }

            const point_snap_b = this.page.find_point_near(line.b, 10)
            if (point_snap_b) {
                line.b = point_snap_b.pos;
            }
        }

        if(this.fit.type == "arc") {
            let arc = this.fit.arc
            
            // Snap center
            let start_pos = Vec.add(this.fit.arc.center, Vec.polar(this.fit.arc.startAngle, this.fit.arc.radius))
            
            // if(Math.abs(start_pos.x - arc.center.x) < 20) {
            //     arc.center.x = start_pos.x
            // }

            if(Math.abs(start_pos.y - arc.center.y) < 20) {
                arc.center.y = start_pos.y
                arc.startAngle = Math.PI * (arc.clockwise ? -1 : 0)
            }


            
            const closest_round_start_angle = (Math.round(arc.startAngle / qua) * qua + phi) % phi;
            if(Math.abs(arc.startAngle - closest_round_start_angle) < 0.1) {
                arc.startAngle = closest_round_start_angle
            }

            const closest_round_end_angle = (Math.round(arc.endAngle / qua) * qua + phi) % phi;
            if(Math.abs(arc.endAngle - closest_round_end_angle) < 0.1) {
                arc.endAngle = closest_round_end_angle
            }
        }

        if(this.fit.type == "circle") {
            let arc = this.fit.circle

            if(Math.abs(arc.startAngle - arc.endAngle) - phi < 10) {
                arc.endAngle = arc.endAngle + phi
            }
        }
        
    }

    update_ideal(){
        if(this.fit.type == "line") {
            this.ideal_points = Line.spreadPointsAlong(this.fit.line, this.input_points.length)
        } else if(this.fit.type == "arc") {
            this.ideal_points = Arc.spreadPointsAlong(this.fit.arc, this.input_points.length)
        } else if(this.fit.type == "circle") {
            this.ideal_points = Arc.spreadPointsAlong(this.fit.circle, this.input_points.length)
        }
    }

    render(ctx){
        ctx.strokeStyle = "#000000";

        //Interpolate animation render points
        if(this.render_points.length == this.ideal_points.length) {
            for (let i = 0; i < this.ideal_points.length; i++) {
                this.render_points[i] = Vec.lerp(this.ideal_points[i], this.render_points[i], 0.8)
            }
        }
        

        // RENDER
        // Render debug info
        ctx.fillText(this.state, 100, 100)
        if(this.fit) {
            // ctx.fillText(this.fit.type, 100, 120)
            // ctx.fillText(this.arc_fit.fitness, 100, 140)
            // ctx.fillText(this.circle_fit.fitness, 100, 160)
            //ctx.fillText(JSON.stringify(this.arc_fit.arc), 100, 160)
            //ctx.fillText(Arc.innerAngle(this.arc_fit.arc), 100, 180)
            // ctx.fillText(this.line_fit.fitness + " - " + this.line_fit.length, 100, 140)
            // ctx.fillText(this.arc_fit.fitness + " - " + this.arc_fit.radius, 100, 160)
            if(this.fit.type == "arc") {
                let start_pos = Vec.add(this.fit.arc.center, Vec.polar(this.fit.arc.startAngle, this.fit.arc.radius))
                ctx.fillRect(start_pos.x, start_pos.y, 4, 4)
            }
        }

        // render snaps
        ctx.strokeStyle = "#D2BBF9";
        Object.keys(this.snaps).forEach(snap_key=>{
            const snap = this.snaps[snap_key]
            ctx.beginPath()
            ctx.moveTo(snap.a.x, snap.a.y)
            ctx.lineTo(snap.b.x, snap.b.y)
            ctx.stroke()
        })

        
        ctx.strokeStyle = "#000000";

        // render stroke
        let points = this.render_points
        if(points.length > 1) {
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y)    
            }
            ctx.stroke()
        }

        if(this.state != "fixed") {
            ctx.strokeStyle = "#00000022";
            points = this.input_points
            if(points.length > 1) {
                ctx.beginPath()
                ctx.moveTo(points[0].x, points[0].y)
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y)    
                }
                ctx.stroke()
            }
        }

        if(this.arc_fit) {
            ctx.beginPath();
            ctx.ellipse(this.arc_fit.arc.center.x, this.arc_fit.arc.center.y, 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        
        // render fit
        // if(this.arc_fit) {
        //     ctx.strokeStyle = "#AAAAAA";
        //     let circle = this.arc_fit.arc
        //     ctx.beginPath()
        //     //ctx.ellipse(circle.center.x, circle.center.y, circle.radius, circle.radius, 0, 0, Math.PI*2);
        //     ctx.ellipse(circle.center.x, circle.center.y, circle.radius, circle.radius, 0, circle.startAngle, circle.endAngle, !circle.clockwise);
        //     ctx.stroke()
        // }

    }
}