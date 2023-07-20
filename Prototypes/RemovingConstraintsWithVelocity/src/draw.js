import Vec from "./lib/vec"

class Draw {
    constructor(){
        this.pencil_down = false
        this.strokes = []
        this.wet_strokes = []
        this.drawing_stroke = null
    }

    begin_stroke(pos){
        let stroke = {
            input_points: [Vec.clone(pos)],
            display_points: [Vec.clone(pos)],
            fitted_curve: null,
            velocity: new SmoothArray(0)
        }
        this.drawing_stroke = stroke
        this.wet_strokes.push(stroke)
        this.strokes.push(stroke)
    }

    update_stroke(pos) {
        let prev_pos = this.drawing_stroke.input_points[this.drawing_stroke.input_points.length-1]
        let v = Vec.dist(prev_pos, pos)
        this.drawing_stroke.velocity.push(v)
        this.drawing_stroke.input_points.push(pos)
        this.drawing_stroke.display_points.push(Vec.clone(pos))

        // Fit curve
        this.drawing_stroke.fitted_curve = fit_stroke(this.drawing_stroke.input_points)

        // ARC
        if(this.drawing_stroke.input_points.length > 3) {
            this.drawing_stroke.arc = fit_circle(this.drawing_stroke.input_points)
        }


        // Handle Velocity
        let start = this.drawing_stroke.input_points[0]
        let total_dist = Vec.dist(start, pos)
        if(total_dist > 10 && v < 0.075) {
            this.drawing_stroke.done = true
            this.drawing_stroke = null
            
            // New stroke
            this.begin_stroke(pos)
        }
    }
    
    update(events){
        // Handle input
        events.pencil.forEach(event=>{
            let pos = Vec(event.x, event.y)
            if(event.type == "began") {
                this.begin_stroke(pos)
            }
            if(event.type == "moved") {
                if(this.drawing_stroke) {
                    this.update_stroke(pos)
                }
            }
            if(event.type == "ended") {
                if(this.drawing_stroke) {
                    this.drawing_stroke.done = true
                    this.drawing_stroke = null
                }
            }
        })

        // Update Wet strokes
        for(let j = 0; j < this.wet_strokes.length; j++) {
            const stroke = this.wet_strokes[j]
            if(stroke.fitted_curve) {

                if(stroke.fitted_curve.type == "line") {
                    const line = stroke.fitted_curve.line

                    for (let i = 1; i < stroke.display_points.length-1; i++) {
                        let pt = stroke.display_points[i]
                        let npt = Vec.scalarProjection(pt, line.a, line.b)
                        let diff = Vec.sub(npt, pt)
                        let dpt = Vec.add(pt, Vec.mulS(diff, 0.1))
                        pt.x = dpt.x
                        pt.y = dpt.y
                    }
    
                    if(stroke.done){
                        let fitness = fit_line(stroke.display_points).fitness
                        if(fitness < 0.1) {
                            stroke.display_points = [line.a, line.b]
                            this.wet_strokes.splice(j, 1)
                        }
                    }
                } else if(stroke.fitted_curve.type == "circle") { 
                    for (let i = 1; i < stroke.display_points.length-1; i++) {
                        let pt = stroke.display_points[i]
                        let npt = closest_point_on_circle(pt, stroke.fitted_curve)
                        let diff = Vec.sub(npt, pt)
                        let dpt = Vec.add(pt, Vec.mulS(diff, 0.1))
                        pt.x = dpt.x
                        pt.y = dpt.y
                    }
                }
                
            }
        }
    }

    render(ctx) {
        // STROKES
        for(const stroke of this.strokes) {
            ctx.strokeStyle = "#000000";
            
            // STROKE
            let points = stroke.display_points
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y)    
            }
            ctx.stroke()

            // Fitted line projection

            // ctx.strokeStyle = "#00000044"
            // if(stroke.input_points) {
            //     let points = stroke.input_points
            //     ctx.beginPath()
            //     ctx.moveTo(points[0].x, points[0].y)
            //     for (let i = 1; i < points.length; i++) {
            //         ctx.lineTo(points[i].x, points[i].y)    
            //     }
            //     ctx.stroke()
            // }

            // if(stroke.simplified) {
            //     let points = stroke.simplified
            //     ctx.beginPath()
            //     ctx.moveTo(points[0].x, points[0].y)
            //     for (let i = 1; i < points.length; i++) {
            //         ctx.lineTo(points[i].x, points[i].y)    
            //     }
            //     ctx.stroke()
            // }

            // if(stroke.arc) {
            //     let circle = stroke.arc
            //     ctx.beginPath()
            //     //ctx.ellipse(circle.center.x, circle.center.y, circle.radius, circle.radius, 0, 0, Math.PI*2);
            //     ctx.ellipse(circle.center.x, circle.center.y, circle.radius, circle.radius, 0, circle.startAngle, circle.endAngle);
            //     ctx.stroke()
            // }
        }

        ctx.strokeStyle = "#00000022";
        
        // VELOCITY PLOT
        let recent_stroke = this.wet_strokes[this.wet_strokes.length-1]
        if(recent_stroke) {
            let velocity = recent_stroke.velocity.data
            ctx.beginPath()
            ctx.moveTo(50, velocity[0]*50+50)
            for (let i = 1; i < velocity.length; i++) {
                ctx.lineTo(50+i*2, velocity[i]*50+50) 
            }
            ctx.stroke()
        }

        ctx.beginPath()
        ctx.moveTo(50, 0.75*50+50)
        ctx.lineTo(50+400, 0.75*50+50) 
        ctx.stroke()


        // Projection
        if(this.drawing_stroke && this.drawing_stroke.fitted_curve && this.drawing_stroke.fitted_curve.type == "line") {
            ctx.globalAlpha = (this.drawing_stroke.fitted_curve.length / 300)*0.2
            ctx.strokeStyle = "#000000";
            

            let line = this.drawing_stroke.fitted_curve.line
            let projected_b = Vec.add(line.a, Vec.mulS(Vec.sub(line.b, line.a), 100))
            ctx.beginPath()
            ctx.moveTo(line.a.x, line.a.y)
            ctx.lineTo(projected_b.x, projected_b.y) 
            ctx.stroke()

            ctx.globalAlpha = 1.0

        }

    }
}

export default Draw

class SmoothArray {
    constructor(value, alpha = 0.05){
        this.data = [value];
        this.filtered = value;
        this.alpha = alpha
    }

    push(value) {
        this.filtered = this.alpha * value + (1 - this.alpha) * this.filtered
        this.data.push(this.filtered)
    }
}

// SIMPLIFY
function simplify_triangle(line){
    let start = line[0]
    let end = line[line.length-1]

    var largestDistance = -1;
    var furthestIndex = -1;
    
    for (let i = 0; i < line.length; i++) {
      let point = line[i]
      let dist = point_line_distance(point, start, end)
      if(dist > largestDistance) {
        largestDistance = dist
        furthestIndex = i
      }
    }

    return [start, line[furthestIndex], end]
}

function point_line_distance(p, a, b) {
    let norm = Vec.scalarProjection(p, a, b)
    return Vec.len(Vec.sub(p,norm))
}


// FIT CURVE
function fit_stroke(points){
    // Fit straight line
    let line_fit = fit_line(points)
    let arc_fit = fit_circle(points)

    if(line_fit.fitness < 7) {
        return line_fit
    } else {
        return arc_fit
    }
    
}



function fit_line(stroke){
    let total_dist = 0
    let line = {a: Vec.clone(stroke[0]), b: Vec.clone(stroke[stroke.length-1])}
    
    for (let i = 1; i < stroke.length-1; i++) {
        let pt = stroke[i]
        let npt = Vec.scalarProjection(pt, line.a, line.b)
        let dist = Vec.dist(npt, pt)
        total_dist += dist
    }

    let line_dist = Vec.dist(line.a, line.b)

    let fitness = total_dist / line_dist

    // Snap Line
    if(Math.abs(line.a.x-line.b.x) < 20) {
        line.b.x = line.a.x
    }

    if(Math.abs(line.a.y-line.b.y) < 20) {
        line.b.y = line.a.y
    }

    return {
        type: "line",
        length: line_dist,
        fitness,
        line
    }
}

function fit_circle(points) {
    if(points.length < 3) return null
    let simplified = simplify_triangle(points);
    let [a, b, c] = simplified

    if(!b) return null

    let x1 = a.x;
    let y1 = a.y;
    let x2 = b.x;
    let y2 = b.y;
    let x3 = c.x;
    let y3 = c.y;

    const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    const centerX = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
    const centerY = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / D;
    const radius = Math.sqrt((x1 - centerX) * (x1 - centerX) + (y1 - centerY) * (y1 - centerY));
    
    const startAngle = Math.atan2(y1 - centerY, x1 - centerX);
    const endAngle = Math.atan2(y3 - centerY, x3 - centerX);

    let circle = {
        type: "circle",
        center: { x: centerX, y: centerY },
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle
    };

    // Compute fitness
    let arc_dist = arc_length(radius, startAngle, endAngle)

    let total_dist = 0
    points.forEach(point=>{
        total_dist += point_circle_distance(point, circle)
    })

    circle.fitness = total_dist / arc_dist

    return circle
}

function arc_length(radius, startAngle, endAngle) {
    // Convert angles from degrees to radians
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    // Calculate the arc length using the formula: arc length = radius * angle
    const length = radius * Math.abs(endAngleRad - startAngleRad);
    
    // Return the arc length
    return length;
  }


function point_circle_distance(point, circle) {
    let {x, y} = point
    let circleX = circle.center.x
    let circleY = circle.center.y
    let radius = circle.radius

    // Calculate the distance between the point and the center of the circle
    const distance = Math.sqrt((x - circleX) ** 2 + (y - circleY) ** 2);
    
    // Subtract the radius from the distance to get the shortest distance from the point to the circle's circumference
    const shortestDistance = distance - radius;
    
    // Return the absolute value of the shortest distance (to make sure it's positive)
    return Math.abs(shortestDistance);
}

function closest_point_on_circle(point, circle) {
    let {x, y} = point
    let circleX = circle.center.x
    let circleY = circle.center.y
    let radius = circle.radius

    // Calculate the angle between the point and the center of the circle
    const angle = Math.atan2(y - circleY, x - circleX);
    
    // Calculate the closest point on the circle using trigonometry
    const closestX = circleX + radius * Math.cos(angle);
    const closestY = circleY + radius * Math.sin(angle);
    
    // Return the coordinates of the closest point
    return { x: closestX, y: closestY };
  }

// Snapping
function generate_snaps(stroke){

}

