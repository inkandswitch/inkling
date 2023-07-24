import Arc from "./arc"
import Line from "./line"
import Vec from "./vec"


const Fit = {}
export default Fit

Fit.line = (stroke) => {
    if(stroke.length < 3) return null
    let total_dist = 0
    let line = Line(Vec.clone(stroke[0]), Vec.clone(stroke[stroke.length-1]))
    
    for (let i = 1; i < stroke.length-1; i++) {
        total_dist += Line.distToPoint(line, stroke[i])
    }

    let line_len = Line.len(line)
    
    return {
        type: "line",
        line,
        fitness: total_dist / line_len,
        length: line_len
    }
}

Fit.arc = (points) => {
    if(points.length < 3) return null
    let simplified = Fit.innerTriangle(points);
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
    
    let startAngle = Math.atan2(y1 - centerY, x1 - centerX);
    let endAngle = Math.atan2(y3 - centerY, x3 - centerX);

    // Compute winding order
    let ab = Vec.sub(simplified[0], simplified[1])
    let bc = Vec.sub(simplified[1], simplified[2])
    let clockwise = Vec.cross(ab, bc) > 0

    let arc = Arc(Vec(centerX, centerY), radius, startAngle, endAngle, clockwise)

    // Compute fitness
    let arc_dist = Arc.len(arc)
    
    let total_dist = 0
    points.forEach(point=>{
        total_dist += Arc.distToPointCircle(arc, point)
    })


    return {
        type: "arc",
        arc,
        fitness: total_dist / arc_dist,
        length: arc_dist
    }
}

Fit.innerTriangle = (points) => {
    let start = points[0]
    let end = points[points.length-1]

    var largestDistance = -1;
    var furthestIndex = -1;
    
    for (let i = 0; i < points.length; i++) {
      let point = points[i]
      let dist = Line.distToPoint(Line(start, end), point)
      if(dist > largestDistance) {
        largestDistance = dist
        furthestIndex = i
      }
    }

    return [start, points[furthestIndex], end]
}

Fit.circle = (points) => {
    if(points.length < 3) return null
    // Do a basic circular regression
    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    let sumXY = 0;
    let sumX3 = 0;
    let sumY3 = 0;
    let sumXY2 = 0;
    let sumX2Y = 0;

    for (const point of points) {
        const { x, y } = point;
        sumX += x;
        sumY += y;
        sumX2 += x * x;
        sumY2 += y * y;
        sumXY += x * y;
        sumX3 += x * x * x;
        sumY3 += y * y * y;
        sumXY2 += x * y * y;
        sumX2Y += x * x * y;
    }

    const C = n * sumX2 - sumX * sumX;
    const D = n * sumXY - sumX * sumY;
    const E = n * sumX3 + n * sumXY2 - (sumX2 + sumY2) * sumX;
    const G = n * sumY2 - sumY * sumY;
    const H = n * sumX2Y + n * sumY3 - (sumX2 + sumY2) * sumY;

    const a = (H * D - E * G) / (C * G - D * D);
    const b = (H * C - E * D) / (D * D - G * C);
    const c = -(a * sumX + b * sumY + sumX2 + sumY2) / n;

    // Construct circle
    const center = Vec(-a / 2, -b/2);
    const radius = Math.sqrt(center.x * center.x + center.y * center.y - c);

    // Compute angles
    const startAngle = Math.atan2(points[0].y - center.y, points[0].x - center.x)
    const endAngle = Math.atan2(points[points.length-1].y - center.y, points[points.length-1].x - center.x)

    // Determine winding order
    // Compute winding order
    let ab = Vec.sub(points[0], points[1])
    let bc = Vec.sub(points[1], points[2])
    let clockwise = Vec.cross(ab, bc) > 0

    let circle  = {center, radius, startAngle, endAngle, clockwise}

    // check fitness
    let total_dist = 0
    points.forEach(point=>{
        total_dist += Arc.distToPointCircle(circle, point)
    })

    let circumference = 2*Math.PI*radius

    return { 
        type: "circle",
        circle,
        fitness: total_dist / circumference
    };
}