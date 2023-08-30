import FreehandStroke from "./FreehandStroke";
import ClipperShape from "@doodle3d/clipper-js"
import Voronoi from "voronoi"
import Vec from "../../lib/vec";
import simplify from "simplify-js";
import {SkeletonBuilder} from 'straight-skeleton';
import triangulate from 'delaunay-triangulate';


var voronoi = new Voronoi();

export default class StrokeGroup {
  strokes = new Set<FreehandStroke>();
  outlineShape: ClipperShape;
  skeleton: any[] = [];
  dirty = false;

  svgElements: SVGElement[] = [];

  mesh: any;

  addStroke(stroke){
    this.strokes.add(stroke)

    // Generate outline shape
    //let points = rdp_simplify(stroke.points, 2)
    let shape = new ClipperShape([rdp_simplify(stroke.points, 1)], false, true, true, true)
    shape = shape.offset( 15, {
      jointType: 'jtSquare',
      endType: 'etOpenSquare',
      miterLimit: 2.0,
      roundPrecision: 0.25
    })

    let extraoffsetshape = new ClipperShape([rdp_simplify(stroke.points, 1)], false, true, true, true)
    extraoffsetshape = extraoffsetshape.offset( 20, {
      jointType: 'jtSquare',
      endType: 'etOpenSquare',
      miterLimit: 2.0,
      roundPrecision: 0.25
    })

    if(this.outlineShape == null) {
      this.outlineShape = shape
    } else {
      this.outlineShape = this.outlineShape.union(shape);
    }

    // Simplify outlines
    this.outlineShape.paths = this.outlineShape.paths.map(path=>{
      return simplify(path.map(pt=>({x: pt.X, y: pt.Y})), 1).map(pt=>({X: pt.x, Y: pt.y}))
    })

    let simplifiedStroke = simplify(stroke.points, 2)

    //this.generateSkeleton();

    // Generate mesh
    //let points = poissonDiskSampling(this.outlineShape, 15);
    let outlinePoints = this.outlineShape.paths.flatMap(path=>path.map(pt=>({x: pt.X, y: pt.Y})));
    let points = simplifiedStroke.concat(outlinePoints)

    let triangles = triangulate(points.map(pt=>([pt.x, pt.y])));

    let edges: any[] = [];
    triangles.forEach(triangle=>{
      let edgesForTriangle = [
        [triangle[0], triangle[1]],
        [triangle[1], triangle[2]],
        [triangle[2], triangle[0]]
      ];

      edgesForTriangle.forEach(edge=>{
        if(!edges.find(e=>{
          return (e[0] == edge[0] && e[1] == edge[1]) || (e[1] == edge[0] && e[0] == edge[1])
        })) {
          let midpoint = Vec.mulS(Vec.add(points[edge[0]], points[edge[1]]), 0.5);
          if(extraoffsetshape.pointInShape(midpoint, true, true)) {
            edges.push(edge);
          }
        }
      })
    })

    this.mesh = {
      points,
      edges
    }
    //console.log(mesh);
    

    this.dirty = true;
  }
  
  intersects(shape){
    return this.outlineShape.intersect(shape).paths.length > 0;
  }

  generateSkeleton(){
    //let sb = new SkeletonBuilder()
    let info = clipperShapeToArrayPoints(this.outlineShape)
    console.log(info);
    
    try {
      const diagram = SkeletonBuilder.BuildFromGeoJSON([info]);
      console.log(diagram);
  
      this.skeleton = [];
  
      console.log(this.outlineShape);
      
      for(const edge of diagram.Edges) {
  
        for (let i = 0; i < edge.Polygon.length-1; i++) {
          let a = edge.Polygon[i]
          let b = edge.Polygon[(i+1) % (edge.Polygon.length-1)]
          if(!pointInClipperShape(this.outlineShape, a) && !pointInClipperShape(this.outlineShape, b)) {
            this.skeleton.push({
              a: Vec(a.X, a.Y), 
              b: Vec(b.X, b.Y), 
            })  
          }
        }
      }
    } catch {

    }
    

    console.log(this.skeleton);
    


    


    // // Compute voronoi diagram based on outline points
    // const bb = this.outlineShape.shapeBounds()
    // const boundingBox = {xl: bb.left, xr: bb.right, yt: bb.top, yb: bb.bottom};
    // //const boundingBox = {xl: 0, xr: window.innerWidth, yt: 0, yb: window.innerHeight}; // TODO: narrow this down to group bbox
    
    // const outlinePoints = clipperShapeToPoints(this.outlineShape).map(path=>{
    //   return gaussianSmooth(simplify(path, 1, true), 1)
    // }).flat();
    // const diagram = voronoi.compute(outlinePoints, boundingBox);

    // console.log(outlinePoints, diagram);
    
    
    // // The skeleton is simply the voronoi edges that are inside the bounds of the outline shape
    // this.skeleton = [];
    // diagram.edges.forEach(edge=>{
    //   //if(this.outlineShape.pointInShape(edge.va, true, true) && this.outlineShape.pointInShape(edge.vb, true, true)) {
    //     this.skeleton.push({a: edge.va, b: edge.vb});
    //   //}
    // })
  }

  render(svg){
    if(!this.dirty) {
      return
    }

    for (const elem of this.svgElements) {
      elem.remove();
    }
    
    const outlinePath = clipperShapeToSVGPath(this.outlineShape)

    let skeletonPath = "";
    this.skeleton.forEach(edge=>{      
        skeletonPath += `M ${edge.a.x} ${edge.a.y} L ${edge.b.x} ${edge.b.y}`
    })
    
    this.svgElements = [
      svg.addElement("path", {
        d: outlinePath,
        fill: "rgba(0,0,0,0.05)",
        stroke: "rgba(0,0,0,0.05)",
      }),

      svg.addElement("path", {
        d: skeletonPath,
        fill: "none",
        stroke: "rgba(0,0,255,1)",
        "stroke-width": "4"
      })
    ];

    // this.mesh.triangles.forEach(tri=>{
    //   let points = tri.map(pti=>this.mesh.points[pti]);
      
    //   let polylinePoints = points.map(pt=>`${pt.x} ${pt.y}`).join(' ')

    //   this.svgElements.push(svg.addElement("polyline", {
    //     points: polylinePoints,
    //     fill: "none",
    //     stroke: "rgba(0,0,255,1)",
    //   }))
    // })

    this.dirty = false;
  }

  remove(){
    for (const elem of this.svgElements) {
      elem.remove();
    }
  }
}


// Clipper utilities
function clipperShapeToPoints(shape){
  return shape.paths.map(path=>{
    return path.map(pt=>{
      return {x: pt.X, y: pt.Y}
    })
  })
}

function clipperShapeToArrayPoints(shape){
  return shape.paths.map(path=>{
    return path.map(pt=>{
      return [pt.X, pt.Y]
    })
  })
}

function shapeToSVGPath(shape){
  let svgPath = "";
  for(const path of shape.paths) {
    svgPath += `M ${path[0].x} ${path[0].y} `;
    for (let i = 1; i < path.length; i++) {
      svgPath += `L ${path[i].x} ${path[i].y} `;
    }
    svgPath += `L ${path[0].x} ${path[0].y} `;
  }
  return svgPath
}

function pointInClipperShape(shape, point){
  return shape.paths.find(path=>{
    return path.find(pt=>{
      return pt.X == point.X && pt.Y == point.Y
    })
  })
}

function clipperShapeToSVGPath(shape){
  let svgPath = "";
  for(const path of shape.paths) {
    svgPath += `M ${path[0].X} ${path[0].Y} `;
    for (let i = 1; i < path.length; i++) {
      svgPath += `L ${path[i].X} ${path[i].Y} `;
    }
    svgPath += `L ${path[0].X} ${path[0].Y} `;
  }
  return svgPath
}

// Path Simplification
function rdp_simplify(line, epsilon = 20) {
  if(line.length == 2) {
    return line
  }
  
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
  
  if(largestDistance > epsilon) {
    let segment_a = rdp_simplify(line.slice(0,furthestIndex), epsilon)
    let segment_b = rdp_simplify(line.slice(furthestIndex), epsilon)
    
    return segment_a.concat(segment_b.slice(1))
  }
  return [start, end]
}

function point_line_distance(p, a, b) {
  let norm = scalar_projection(p, a, b)
  return Vec.len(Vec.sub(p,norm))
}

function scalar_projection(p, a, b) {
  let ap = Vec.sub(p, a)
  let ab = Vec.normalize(Vec.sub(b, a))
  let f = Vec.mulS(ab, Vec.dot(ap, ab))

  return Vec.add(a, f)
}

// Smoothing
function gaussianSmooth(polygon, sigma = 1) {
  const kernelSize = Math.ceil(3 * sigma); // Determine kernel size based on sigma
  const kernel = generateGaussianKernel(kernelSize, sigma);
  const halfKernelSize = Math.floor(kernelSize/2);
  
  const smoothedPolygon: any[] = [];
  
  for (let i = 0; i < polygon.length; i++) {
    let smoothedPoint = { x: 0, y: 0 };
    
    for (let j = -halfKernelSize; j <= halfKernelSize; j++) {
      const index = (i + j + polygon.length) % polygon.length;
      const weight = kernel[j + halfKernelSize];
      
      smoothedPoint.x += weight * polygon[index].x;
      smoothedPoint.y += weight * polygon[index].y;
    }
    
    smoothedPolygon.push(smoothedPoint);
  }
  
  return smoothedPolygon;
}

function generateGaussianKernel(size, sigma) {
  const kernel: any[] = [];
  const sigmaSquared = sigma * sigma;
  const constant = 1 / (2 * Math.PI * sigmaSquared);
  let sum = 0;
  
  for (let i = 0; i < size; i++) {
    const distance = i - Math.floor(size / 2);
    const weight = constant * Math.exp(-(distance * distance) / (2 * sigmaSquared));
    kernel.push(weight);
    sum += weight;
  }
  
  // Normalize the kernel
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  
  return kernel;
}

function poissonDiskSampling(shape, minDistance) {
  let bounds = shape.shapeBounds();
  console.log(bounds);
  
  const left = bounds.left;
  const top = bounds.top;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  // const width = polygon.reduce((maxX, vertex) => Math.max(maxX, vertex.x), 0);
  // const height = polygon.reduce((maxY, vertex) => Math.max(maxY, vertex.y), 0);
  const cellSize = minDistance / Math.sqrt(2);

  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);

  const grid = new Array(gridWidth * gridHeight).fill(null);
  const activePoints = [];
  const points = [];

  function gridIndex(x, y) {
    return Math.floor(x / cellSize) + Math.floor(y / cellSize) * gridWidth;
  }

  function isValidPoint(x, y) {
    if (x < left || x >= left+width || y < top || y >= top+height) {
      return false;
    }

    if(!shape.pointInShape({x, y}, true, true)) {
      return false;
    }

    const index = gridIndex(x, y);
    const neighbors = [-1, 0, 1];
    for (let yOffset of neighbors) {
      for (let xOffset of neighbors) {
        const neighborIndex = index + xOffset + yOffset * gridWidth;
        const neighbor = grid[neighborIndex];
        if (neighbor) {
          const dx = neighbor.x - x;
          const dy = neighbor.y - y;
          if (dx * dx + dy * dy < minDistance * minDistance) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function addPoint(x, y) {
    const point = { x, y };
    activePoints.push(point);
    points.push(point);
    const index = gridIndex(x, y);
    grid[index] = point;
  }

  // Choose a random starting point
  const startX = left + Math.random() * width;
  const startY = top + Math.random() * height;
  addPoint(startX, startY);

  while (activePoints.length > 0) {
    const randomIndex = Math.floor(Math.random() * activePoints.length);
    const currentPoint = activePoints[randomIndex];
    let foundValidPoint = false;

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = minDistance + Math.random() * minDistance;
      const newX = currentPoint.x + distance * Math.cos(angle);
      const newY = currentPoint.y + distance * Math.sin(angle);

      if (isValidPoint(newX, newY)) {
        addPoint(newX, newY);
        foundValidPoint = true;
      }
    }

    if (!foundValidPoint) {
      activePoints.splice(randomIndex, 1);
    }
  }

  return points;
}