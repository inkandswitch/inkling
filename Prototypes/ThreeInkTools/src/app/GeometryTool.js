import Arc from "../lib/arc";
import Fit from "../lib/fit";
import Line from "../lib/line";
import Vec from "../lib/vec";

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

    }

    pen_down(pos){
        this.input_points = [pos]
        this.render_points = [Vec.clone(pos)]
        this.prev_pos = pos
        this.velocity = 0
        this.max_velocity = 0
    }

    pen_move(pos) {
        // Compute filtered velocity
        const new_velocity = Vec.dist(this.prev_pos, pos)
        const alpha = 0.05 // Filtering constant
        this.velocity = alpha * new_velocity + (1 - alpha) * this.velocity
        this.max_velocity = Math.max(this.max_velocity, this.velocity)
        this.prev_pos = pos

        if(Vec.dist(this.input_points[this.input_points.length-1], pos) > 1) {
            // Add point to input buffer
            this.input_points.push(pos)
            this.render_points.push(Vec.clone(pos))
        }

        
        

        // Fit curve
        if(this.input_points.length > 100) {
            this.state = "guess"
        }

        if(this.velocity < 0.5 && this.velocity < this.max_velocity) {
            this.state = "fixed"
        }


        if(this.state != "unknown") {
            let line_fit = Fit.line(this.input_points)
            let arc_fit = Fit.arc(this.input_points)
            let circle_fit = Fit.circle(this.input_points)

            this.arc_fit = arc_fit
            this.line_fit = line_fit
            this.circle_fit = circle_fit

            this.fit = line_fit
            if(arc_fit && arc_fit.arc.radius < 500 && arc_fit.fitness < line_fit.fitness) {
                this.fit = arc_fit

                if(Math.abs(Arc.directedInnerAngle(arc_fit.arc)) > 1.5*Math.PI) {
                    if(circle_fit && circle_fit.circle.radius < 500 && circle_fit.fitness < arc_fit.fitness) {
                        this.fit = circle_fit
                    }
                }
            }
            

            if(this.fit) {

                if(this.fit.type == "line") {
                    this.ideal_points = Line.spreadPointsAlong(this.fit.line, this.input_points.length)
                } else if(this.fit.type == "arc") {
                    this.ideal_points = Arc.spreadPointsAlong(this.fit.arc, this.input_points.length)
                } else if(this.fit.type == "circle") {
                    this.ideal_points = Arc.spreadPointsAlong(this.fit.circle, this.input_points.length)
                }
                
            }
        }
        

    }

    pen_up(pos) {
        this.input_points = []
        this.state = "unknown"
    }

    render(ctx){
        ctx.strokeStyle = "#000000";


        //Interpolate animation render points
        if(this.render_points.length == this.ideal_points.length) {
            for (let i = 0; i < this.ideal_points.length; i++) {
                this.render_points[i] = Vec.lerp(this.ideal_points[i], this.render_points[i], 0.9)
            }
        }
        

        // RENDER
        // Render debug info
        ctx.fillText(this.state, 100, 100)
        if(this.fit) {
            ctx.fillText(this.fit.type, 100, 120)
            ctx.fillText(this.arc_fit.fitness, 100, 140)
            ctx.fillText(this.circle_fit.fitness, 100, 160)
            //ctx.fillText(JSON.stringify(this.arc_fit.arc), 100, 160)
            //ctx.fillText(Arc.innerAngle(this.arc_fit.arc), 100, 180)
            // ctx.fillText(this.line_fit.fitness + " - " + this.line_fit.length, 100, 140)
            // ctx.fillText(this.arc_fit.fitness + " - " + this.arc_fit.radius, 100, 160)
        }

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

        ctx.strokeStyle = "#00000044";
        points = this.input_points
        if(points.length > 1) {
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y)    
            }
            ctx.stroke()
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