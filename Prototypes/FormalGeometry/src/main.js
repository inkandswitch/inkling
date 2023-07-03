import Vec from "./lib/vec";
import engine from "./engine";
import Canvas from "./canvas";

import Draw from "./draw"

let draw = new Draw()

let canvas = new Canvas(document.body, ctx=>{
    ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
    draw.render(ctx)

    // for(const stroke of state.strokes) {
    //     ctx.strokeStyle = "#000000";
    //     let points = stroke.detailed
    //     ctx.beginPath()
    //     ctx.moveTo(points[0].x, points[0].y)
    //     for (let i = 1; i < points.length; i++) {
    //         ctx.lineTo(points[i].x, points[i].y)    
    //     }
    //     ctx.stroke()


    //     let fit = stroke.fit
    //     if(fit) {
    //         // if(fit.type == "line") {
    //         //     ctx.beginPath()
    //         //     ctx.moveTo(fit.line.a.x, fit.line.a.y)
    //         //     ctx.lineTo(fit.line.b.x, fit.line.b.y)
    //         //     ctx.stroke()
    //         // }
    //     }
    //     // //console.log(circle);
    //     // if(circle != null) {
    //     //     
    //     //     ctx.beginPath()
    //     //     ctx.ellipse(circle.center.x, circle.center.y, circle.radius, circle.radius, 0, 0, Math.PI*2)
    //     //     ctx.stroke()
    //     // }
        
    // }
    
    // // for(const circle of state.circles) { 
    // //     ctx.beginPath()
    // //     ctx.ellipse(circle.center.x, circle.center.y, circle.radius, circle.radius, 0, 0, Math.PI*2)
    // //     ctx.stroke()
    // // }
})

engine((events)=>{
  draw.update(events)
  canvas.render()
    // state.did_move++
    // events.pencil.forEach(event=>{
    //     if(event.type == "began") {
    //         state.did_move = 0
    //         let pos = Vec(event.x, event.y)
    //         state.drawing = true
    //         state.strokes.push({
    //             detailed: [pos],
    //             fit: null
    //         })
    //     }
    //     if(event.type == "moved") {
    //         let stroke = state.strokes[state.strokes.length-1]
    //         let last_point = stroke.detailed[stroke.detailed.length-1]
    //         let pos = Vec(event.x, event.y)
    //         if(Vec.dist(last_point, pos) > 1) {
    //             stroke.detailed.push(pos)
    //             //stroke.fit = fitArcToPoints(stroke.detailed)
                
    //         }

    //         if(Vec.dist(last_point, pos) > 2) {
    //             state.did_move = 0
    //         }
            
            
    //     }
    //     if(event.type == "ended") {
    //         state.drawing = false
    //         let stroke = state.strokes[state.strokes.length-1]
    //         //state.circles.push(fitArcToPoints(stroke))
    //         //
    //     }
    // })

    // if(state.drawing && state.did_move>10) {
        
    //     let stroke = state.strokes[state.strokes.length-1]
    //     //stroke.fit = fitArcToPoints(stroke.detailed)
    //     let line_fit = computeStraightness(stroke.detailed)
    //     if(line_fit && line_fit.fitness < 2) {
    //         stroke.fit = line_fit
    //         state.strokes.push({
    //             detailed: [Vec.clone(stroke.detailed[stroke.detailed.length-1])],
    //             fit: null
    //         })
    //         state.did_move = 0
    //     }
        
    // }

    // let stroke = state.strokes[state.strokes.length-1]
    // if(stroke && stroke.fit) {
    //     let line = stroke.fit.line
        
    //     for (let i = 1; i < stroke.detailed.length-1; i++) {
    //         let pt = stroke.detailed[i]
    //         let npt = Vec.scalarProjection(pt, line.a, line.b)

    //         let diff = Vec.mulS(Vec.sub(npt, pt), 0.2)
    //         let dpt = Vec.add(pt, diff)
    //         pt.x = dpt.x
    //         pt.y = dpt.y
    //         //ctx.lineTo(stroke[i].x, stroke[i].y)    
    //     }
    // }

    // 
})

// Define a helper function to calculate the distance between two points
function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Define a helper function to calculate the distance between a point and an arc
  function calculateDistanceToArc(point, center, radius, startAngle, endAngle) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.abs(radius - Math.sqrt(dx * dx + dy * dy));
    const angleDiff = endAngle - startAngle;
    const normalizedAngleDiff = ((angleDiff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const normalizedAngle = ((angle - startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (normalizedAngleDiff < Math.PI && (normalizedAngle < 0 || normalizedAngle > normalizedAngleDiff)) {
      return Number.POSITIVE_INFINITY;
    }
    return distance;
  }
  
  // RANSAC-based arc fitting algorithm
  function fitArcToPoints(points, iterations = 1000, threshold = 0.1) {
    const numPoints = points.length;
    if (numPoints < 3) {
      //throw new Error('At least three points are required to fit an arc.');
      return null
    }
  
    let bestCenter = null;
    let bestRadius = null;
    let bestStartAngle = null;
    let bestEndAngle = null;
    let bestInliers = [];
  
    for (let i = 0; i < iterations; i++) {
      // Randomly select three points to form an arc
      const sampleIndices = new Set();
      while (sampleIndices.size < 3) {
        sampleIndices.add(Math.floor(Math.random() * numPoints));
      }
      const sample = Array.from(sampleIndices).map(index => points[index]);
  
      // Calculate the circle parameters using the selected sample
      const pointA = sample[0];
      const pointB = sample[1];
      const pointC = sample[2];
  
      const dA = calculateDistance(pointB, pointC);
      const dB = calculateDistance(pointA, pointC);
      const dC = calculateDistance(pointA, pointB);
  
      const cosAngle = (dB * dB + dC * dC - dA * dA) / (2 * dB * dC);
      const angle = Math.acos(cosAngle);
      const radius = dA / (2 * Math.sin(angle));
  
      const midPointAB = {
        x: (pointA.x + pointB.x) / 2,
        y: (pointA.y + pointB.y) / 2
      };
      const midPointBC = {
        x: (pointB.x + pointC.x) / 2,
        y: (pointB.y + pointC.y) / 2
      };
  
      const slopeAB = (pointB.y - pointA.y) / (pointB.x - pointA.x);
      const slopeBC = (pointC.y - pointB.y) / (pointC.x - pointB.x);
  
      const slopePerpendicularAB = -1 / slopeAB;
      const slopePerpendicularBC = -1 / slopeBC;
  
      const center = {
        x: (slopePerpendicularAB * midPointAB.x - slopePerpendicularBC * midPointBC.x +
          midPointBC.y - midPointAB.y) /
          (slopePerpendicularAB - slopePerpendicularBC),
        y: slopePerpendicularAB * ((
          slopePerpendicularAB * midPointAB.x - slopePerpendicularBC * midPointBC.x +
          midPointBC.y - midPointAB.y) /
          (slopePerpendicularAB - slopePerpendicularBC)) - midPointAB.x + midPointAB.y
      };
  
      const startAngle = Math.atan2(pointA.y - center.y, pointA.x - center.x);
      const endAngle = Math.atan2(pointC.y - center.y, pointC.x - center.x);
  
      // Count inliers
      const inliers = [];
      for (let j = 0; j < numPoints; j++) {
        const point = points[j];
        const distance = calculateDistanceToArc(point, center, radius, startAngle, endAngle);
        if (distance <= threshold) {
          inliers.push(point);
        }
      }
  
      // Update the best model if the current model has more inliers
      if (inliers.length > bestInliers.length) {
        bestCenter = center;
        bestRadius = radius;
        bestStartAngle = startAngle;
        bestEndAngle = endAngle;
        bestInliers = inliers;
      }
    }

    if(!bestCenter) {
        return null
    }
  
    return {
      center: bestCenter,
      radius: bestRadius,
      startAngle: bestStartAngle,
      endAngle: bestEndAngle,
      inliers: bestInliers
    };
}

function computeStraightness(stroke){
    let total_dist = 0
    let line = {a: stroke[0], b: stroke[stroke.length-1]}
    
    for (let i = 1; i < stroke.length-1; i++) {
        let pt = stroke[i]
        let npt = Vec.scalarProjection(pt, line.a, line.b)
        let dist = Vec.dist(npt, pt)
        total_dist += dist
    }

    let line_dist = Vec.dist(line.a, line.b)

    let fitness = total_dist / line_dist
    if(fitness < 2.5) {
        return {
            type: "line",
            fitness,
            line
        }
    }
}