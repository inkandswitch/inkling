import Arc from "./arc"
import Line from "./line"
import Vec from "./vec"


const Fit = {}
export default Fit

Fit.line = (stroke) => {
    let total_dist = 0
    let line = Line(Vec.clone(stroke[0]), Vec.clone(stroke[stroke.length-1]))
    
    for (let i = 1; i < stroke.length-1; i++) {
        let pt = stroke[i]
        let npt = Vec.scalarProjection(pt, line.a, line.b)
        let dist = Vec.dist(npt, pt)
        total_dist += dist
    }

    let line_dist = Vec.dist(line.a, line.b)
    
    return {
        type: "line",
        line,
        fitness: total_dist / line_dist
    }
}

Fit.arc = (points) => {
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

    let arc = Arc(Vec(centerX, centerY), radius, startAngle, endAngle)

    // Compute fitness
    let arc_dist = Arc.len(arc)
    
    let total_dist = 0
    points.forEach(point=>{
        total_dist += Arc.point_circle_distance(point, circle)
    })


    return {
        type: "arc",
        arc,
        fitness: total_dist / arc_dist
    }
}

