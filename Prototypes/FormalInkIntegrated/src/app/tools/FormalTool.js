import Arc from "../../lib/arc.js"
import Fit from "../../lib/fit.js"
import Line from "../../lib/line.js"
import Vec from "../../lib/vec.js"
import { generatePathFromPoints } from "../Svg.js"

export default class FormalTool {
    constructor(page, svg){
        this.page = page
        
        this.svg = svg
        this.element = null

        // Data for guessing
        this.input_points = null
        this.ideal_points = null
        this.render_points = null

        // Speed (not velocity, lol)
        this.speed = 0
        this.max_speed = 0
        this.previous_position = null

        // Curve fitting
        this.mode = "unknown" // unknown, guess, can still change, fixed
        this.fit = null
    }

    update(events){
        // PENCIL DOWN
        let pencil_down = events.did("pencil", "began")
        if(pencil_down) {
            this.input_points = [pencil_down.position]
            this.render_points = [Vec.clone(pencil_down.position)]

            this.speed = 0
            this.max_speed = 0
            this.previous_position = pencil_down.position

            this.state = "unknown"
            this.dirty = true
        }

        // PENCIL MOVE
        let pencil_moves = events.did_all("pencil", "moved")
        pencil_moves.forEach(pencil_move=>{
            // Compute speed
            const new_speed = Vec.dist(this.previous_position, pencil_move.position)
            const alpha = 0.05 // Filter speed to get rid of spikes
            this.speed = alpha * new_speed + (1 - alpha) * this.speed
            this.max_speed = Math.max(this.max_speed, this.speed)
            this.previous_position = pencil_move.position

            // Guessing system
            // STATES
            if(this.mode != "fixed") {
                //if(Vec.dist(this.input_points[this.input_points.length-1], pos) > 1) {
                    // Add point to input buffer
                    this.input_points.push(pencil_move.position)
                    this.render_points.push(Vec.clone(pencil_move.position))
                //}
            }

            if(this.state == "guess") {
                this.do_fit()
            }

            //STATE TRANSITIONS
            // If the stroke is long enough, show feedback of inital guess
            if(this.mode == "unknown" && this.input_points.length > 100) {
                this.state = "guess"
            }

            // If the user slows down, and the stroke is long enough, switch to fixed
            if(this.state != "fixed" && this.input_points.length > 10 && this.velocity < 1 && this.velocity < this.max_velocity) {
                this.do_fit()
                //this.state = "fixed"
            }
            this.dirty = true
        })

        // PENCIL UP
        let pencil_up = events.did("pencil", "ended")
        if(pencil_up) {
            this.do_fit()
            //this.state = "fixed"
            if(this.fit.type == "line") {
                let a = this.page.addPoint(this.fit.line.a);
                let b = this.page.addPoint(this.fit.line.b);
                this.page.addLineSegment(a, b);
            } else if(this.fit.type == "arc") {
                let {start, end} = Arc.points(this.fit.arc)
                let a = this.page.addPoint(start);
                let b = this.page.addPoint(end);
                let c = this.page.addPoint(this.fit.arc.center);
                this.page.addArcSegment(a, b, c);
            }

            // Data for guessing
            this.input_points = null
            this.ideal_points = null
            this.render_points = null
            this.element.remove()
            this.element = null;
            //this.dirty = true
        }

        //Interpolate animation render points
        if(this.ideal_points && this.render_points.length == this.ideal_points.length) {
            for (let i = 0; i < this.ideal_points.length; i++) {
                this.render_points[i] = Vec.lerp(this.ideal_points[i], this.render_points[i], 0.8)
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
            // this.do_snap()
            this.update_ideal()
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

    render(svg){
        if(this.dirty) {
            if(this.render_points && !this.element) {
                this.element = svg.addElement("path", {d: "", stroke: "black", fill: "none"});
            }

            if(this.element) {
                let path = generatePathFromPoints(this.render_points);
                svg.updateElement(this.element, {d: path});
            }
        }
    }
}