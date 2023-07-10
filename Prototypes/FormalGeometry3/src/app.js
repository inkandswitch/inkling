import { generateStrokeGeometry } from "./stroke-geometry"
import Vec from "./lib/vec";
import m from "mithril"
import Fit from "./lib/fit";

// Freehand stroke
class FreehandStrokeCapture {
    constructor(){
        this.wet_stroke = null
    }

    // PEN EVENTS
    begin_stroke(pos) {
        let points = [pos];
        this.wet_stroke = {
            type: "stroke", 
            points, 
            svg_path: generateStrokeGeometry(points)
        };
    }

    update_stroke(pos) {
        if(this.wet_stroke) {
            this.wet_stroke.points.push(pos);
            this.wet_stroke.svg_path = generateStrokeGeometry(this.wet_stroke.points.map(pt=>([pt.x, pt.y, pt.force*0.5])));
        }
    }

    end_stroke(pos) {
        this.wet_stroke = null;
    }
}

// Formal Stroke
class FormalStrokeCapture {
    constructor(){
        this.input_points = null
        this.wet_stroke = null
        this.last_pos = null
        this.velocity = 0
        this.max_velocity = 0
        this.line = null

        this.wet_stroke = null
    }

    // PEN EVENTS
    begin_stroke(pos) {

        this.input_points = [{...pos}]
        this.display_points = [{...pos}]

        this.last_pos = pos
        this.velocity = 0
        this.max_velocity = 0

        this.line = null

        this.snap_lines = []

        this.wet_stroke = {
            type: "stroke", 
            points: this.display_points, 
            svg_path: generateStrokeGeometry(this.display_points)
        };
    }

    update_stroke(pos) {
        if(!this.wet_stroke) return
        // Add new points to arrays
        this.input_points.push({...pos})
        this.display_points.push({...pos})

        // Compute velocity
        let new_velocity = Vec.dist(this.last_pos, pos)
        this.last_pos = Vec.clone(pos)
        this.velocity = 0.05 * new_velocity + (1 - 0.05) * this.velocity // Filter velocity
        this.max_velocity = Math.max(this.max_velocity, this.velocity)

        // Fit formal geom
        this.line = Fit.line(this.input_points).line

        if(this.line) {
            // Reset all snaps
            this.v_snap = false
            this.h_snap = false

            // Snap
            if(Math.abs(this.line.a.x-this.line.b.x) < 10) {
                this.line.b.x = this.line.a.x + 0.1
                this.v_snap = true
            }

            if(Math.abs(this.line.a.y-this.line.b.y) < 10) {
                this.line.b.y = this.line.a.y + 0.1
                this.h_snap = true
            }


            // Morph display points
            for (let i = 1; i < this.display_points.length; i++) {
                let pt = this.display_points[i]
                let npt = Vec.scalarProjection(pt, this.line.a, this.line.b)
                let diff = Vec.sub(npt, pt)
                let dpt = Vec.add(pt, Vec.mulS(diff, 0.1))
                Vec.update(pt, dpt)
            }
        }
        
        this.wet_stroke.svg_path = generateStrokeGeometry(this.wet_stroke.points.map(pt=>([pt.x, pt.y, 0.5])));

        // Generate snap line geometry
        this.snap_lines = []
        if (this.h_snap || this.v_snap) {
            const a = Vec.add(this.line.b, Vec.mulS(Vec.sub(this.line.a, this.line.b), 100));
            const b = Vec.add(this.line.a, Vec.mulS(Vec.sub(this.line.b, this.line.a), 100));
            this.snap_lines.push({a, b})
        }

    }

    end_stroke(pos) {
        this.wet_stroke = null;
    }
}

class TextStrokeCapture {
    constructor(){}
}

class App {
    constructor(){
        // View state
        this.tools = ["freehand", "formal", "text"];
        this.active_tool = 0;

        this.brushes = ["black", "red", "construction"];
        this.active_brush = 0;

        // Canvas state
        this.strokes = [];
        this.control_points = [];

        // Stroke Capture
        this.stroke_capture = [
            new FreehandStrokeCapture(),
            new FormalStrokeCapture(),
            new TextStrokeCapture()
        ]
    }



    update(events) {
        events.pencil.forEach(event => {
            const pos = event;
            let stroke_capture = this.stroke_capture[this.active_tool]
            if (event.type === 'began') {
                let new_stroke = stroke_capture.begin_stroke(pos);
                this.strokes.push(stroke_capture.wet_stroke);
            } else if (event.type === 'moved') {
                stroke_capture.update_stroke(pos);
            } else if (event.type === 'ended') {
                stroke_capture.end_stroke(pos);
            }
        });

        m.redraw()
    }

    // PEN EVENTS
    begin_stroke(pos) {
        let points = [pos];
        this.wet_stroke = {
            type: "stroke", 
            points, 
            svg_path: generateStrokeGeometry(points)
        };
        this.strokes.push(this.wet_stroke);
    }

    update_stroke(pos) {
        if(this.wet_stroke) {
            this.wet_stroke.points.push(pos);

            if(this.active_tool == 0) { // Freehand
                this.wet_stroke.svg_path = generateStrokeGeometry(this.wet_stroke.points.map(pt=>([pt.x, pt.y, pt.force*0.5])));
            } else if(this.active_tool == 1) { // Formal ink

            }

            
        }
        m.redraw()
    }

    end_stroke(pos) {
        this.wet_stroke = null;
        m.redraw()
    }

    // TOUCH EVENTS
}

let app = new App()


export default app