import FreehandStroke from './FreehandStroke';
import SVG from '../Svg';
import Handle from './Handle';

import TransformationMatrix from '../../lib/TransformationMatrix';
import { Position, PositionWithPressure } from '../../lib/types';

import { farthestPair } from '../../lib/helpers';

// import ClipperShape from "@doodle3d/clipper-js"

// import simplify from "simplify-js";
// import {SkeletonBuilder} from 'straight-skeleton';

// import Voronoi from "voronoi"
// const voronoi = new Voronoi();

export default class StrokeGroup {
  strokes: Array<FreehandStroke>;
  pointData: Array<Array<PositionWithPressure>>;

  handles: Array<Handle>;
  // outlineShape: ClipperShape;
  skeleton: Position[] = [];
  dirty = false;

  svgElements: SVGElement[] = [];

  constructor(svg: SVG, strokes: Set<FreehandStroke>) {
    this.strokes = Array.from(strokes) || [];

    // Generate Handles
    const allPoints = this.strokes.flatMap(stroke => stroke.points);
    const [aPos, bPos] = farthestPair(allPoints);
    const a = Handle.create(svg, 'informal', aPos, this);
    const b = Handle.create(svg, 'informal', bPos, this);
    this.handles = [a, b];

    // Generate transform data
    const transform = TransformationMatrix.fromLine(
      a.position,
      b.position
    ).inverse();

    this.pointData = this.strokes.map(stroke =>
      stroke.points.map(p => ({
        ...transform.transformPoint(p),
        pressure: p.pressure,
      }))
    );
  }

  updatePaths() {
    const [a, b] = this.handles;
    const transform = TransformationMatrix.fromLine(a.position, b.position);

    for (const [i, stroke] of this.strokes.entries()) {
      const newPoints = this.pointData[i].map(p => ({
        ...transform.transformPoint(p),
        pressure: p.pressure,
      }));

      stroke.updatePath(newPoints);
    }
  }

  onHandleMoved() {
    this.updatePaths();
  }

  // addStroke(stroke: FreehandStroke){
  //   this.strokes.add(stroke);
  //   this.dirty = true;

  //   // // Generate outline shape
  //   // //let points = rdp_simplify(stroke.points, 2)
  //   // let shape = new ClipperShape([rdp_simplify(stroke.points, 5)], false, true, true, true)
  //   // shape = shape.offset( 10, {
  //   //   jointType: 'jtSquare',
  //   //   endType: 'etOpenSquare',
  //   //   miterLimit: 2.0,
  //   //   roundPrecision: 0.25
  //   // })

  //   // if(this.outlineShape == null) {
  //   //   this.outlineShape = shape
  //   // } else {
  //   //   this.outlineShape = this.outlineShape.union(shape);
  //   // }

  //   // // Simplify outlines
  //   // this.outlineShape.paths = this.outlineShape.paths.map(path=>{
  //   //   return simplify(path.map(pt=>({x: pt.X, y: pt.Y})), 10).map(pt=>({X: pt.x, Y: pt.y}))
  //   // })

  //   // //this.generateSkeleton();

  // }

  //   intersects(shape){
  //     return this.outlineShape.intersect(shape).paths.length > 0;
  //   }

  generateSkeleton() {
    // //let sb = new SkeletonBuilder()
    // let info = clipperShapeToArrayPoints(this.outlineShape)
    // console.log(info);
    // try {
    //   const diagram = SkeletonBuilder.BuildFromGeoJSON([info]);
    //   console.log(diagram);
    //   this.skeleton = [];
    //   console.log(this.outlineShape);
    //   for(const edge of diagram.Edges) {
    //     for (let i = 0; i < edge.Polygon.length-1; i++) {
    //       let a = edge.Polygon[i]
    //       let b = edge.Polygon[(i+1) % (edge.Polygon.length-1)]
    //       if(!pointInClipperShape(this.outlineShape, a) && !pointInClipperShape(this.outlineShape, b)) {
    //         this.skeleton.push({
    //           a: Vec(a.X, a.Y),
    //           b: Vec(b.X, b.Y),
    //         })
    //       }
    //     }
    //   }
    // } catch {
    // }
  }

  render(svg: SVG) {
    // if(!this.dirty) {
    //   return
    // }
    // for (const elem of this.svgElements) {
    //   elem.remove();
    // }
    // const outlinePath = clipperShapeToSVGPath(this.outlineShape)
    // let skeletonPath = "";
    // this.skeleton.forEach(edge=>{
    //     skeletonPath += `M ${edge.a.x} ${edge.a.y} L ${edge.b.x} ${edge.b.y}`
    // })
    // this.svgElements = [
    //   svg.addElement("path", {
    //     d: outlinePath,
    //     fill: "rgba(0,0,0,0.05)",
    //     stroke: "rgba(0,0,0,0.05)",
    //   }),
    //   svg.addElement("path", {
    //     d: skeletonPath,
    //     fill: "none",
    //     stroke: "rgba(0,0,255,1)",
    //     "stroke-width": "4"
    //   })
    // ];
    // this.dirty = false;
  }

  remove() {
    for (const elem of this.svgElements) {
      elem.remove();
    }
  }
}

// // Clipper utilities
// function clipperShapeToPoints(shape){
//   return shape.paths.map(path=>{
//     return path.map(pt=>{
//       return {x: pt.X, y: pt.Y}
//     })
//   })
// }

// function clipperShapeToArrayPoints(shape){
//   return shape.paths.map(path=>{
//     return path.map(pt=>{
//       return [pt.X, pt.Y]
//     })
//   })
// }

// function shapeToSVGPath(shape){
//   let svgPath = "";
//   for(const path of shape.paths) {
//     svgPath += `M ${path[0].x} ${path[0].y} `;
//     for (let i = 1; i < path.length; i++) {
//       svgPath += `L ${path[i].x} ${path[i].y} `;
//     }
//     svgPath += `L ${path[0].x} ${path[0].y} `;
//   }
//   return svgPath
// }

// function pointInClipperShape(shape, point){
//   return shape.paths.find(path=>{
//     return path.find(pt=>{
//       return pt.X == point.X && pt.Y == point.Y
//     })
//   })
// }

// function clipperShapeToSVGPath(shape){
//   let svgPath = "";
//   for(const path of shape.paths) {
//     svgPath += `M ${path[0].X} ${path[0].Y} `;
//     for (let i = 1; i < path.length; i++) {
//       svgPath += `L ${path[i].X} ${path[i].Y} `;
//     }
//     svgPath += `L ${path[0].X} ${path[0].Y} `;
//   }
//   return svgPath
// }

// // Path Simplification
// function rdp_simplify(line, epsilon = 20) {
//   if(line.length == 2) {
//     return line
//   }

//   let start = line[0]
//   let end = line[line.length-1]

//   var largestDistance = -1;
//   var furthestIndex = -1;

//   for (let i = 0; i < line.length; i++) {
//     let point = line[i]
//     let dist = point_line_distance(point, start, end)
//     if(dist > largestDistance) {
//       largestDistance = dist
//       furthestIndex = i
//     }
//   }

//   if(largestDistance > epsilon) {
//     let segment_a = rdp_simplify(line.slice(0,furthestIndex), epsilon)
//     let segment_b = rdp_simplify(line.slice(furthestIndex), epsilon)

//     return segment_a.concat(segment_b.slice(1))
//   }
//   return [start, end]
// }

// function point_line_distance(p, a, b) {
//   let norm = scalar_projection(p, a, b)
//   return Vec.len(Vec.sub(p,norm))
// }

// function scalar_projection(p, a, b) {
//   let ap = Vec.sub(p, a)
//   let ab = Vec.normalize(Vec.sub(b, a))
//   let f = Vec.mulS(ab, Vec.dot(ap, ab))

//   return Vec.add(a, f)
// }

// // Smoothing
// function gaussianSmooth(polygon, sigma = 1) {
//   const kernelSize = Math.ceil(3 * sigma); // Determine kernel size based on sigma
//   const kernel = generateGaussianKernel(kernelSize, sigma);
//   const halfKernelSize = Math.floor(kernelSize/2);

//   const smoothedPolygon: any[] = [];

//   for (let i = 0; i < polygon.length; i++) {
//     let smoothedPoint = { x: 0, y: 0 };

//     for (let j = -halfKernelSize; j <= halfKernelSize; j++) {
//       const index = (i + j + polygon.length) % polygon.length;
//       const weight = kernel[j + halfKernelSize];

//       smoothedPoint.x += weight * polygon[index].x;
//       smoothedPoint.y += weight * polygon[index].y;
//     }

//     smoothedPolygon.push(smoothedPoint);
//   }

//   return smoothedPolygon;
// }

// function generateGaussianKernel(size, sigma) {
//   const kernel: any[] = [];
//   const sigmaSquared = sigma * sigma;
//   const constant = 1 / (2 * Math.PI * sigmaSquared);
//   let sum = 0;

//   for (let i = 0; i < size; i++) {
//     const distance = i - Math.floor(size / 2);
//     const weight = constant * Math.exp(-(distance * distance) / (2 * sigmaSquared));
//     kernel.push(weight);
//     sum += weight;
//   }

//   // Normalize the kernel
//   for (let i = 0; i < size; i++) {
//     kernel[i] /= sum;
//   }

//   return kernel;
// }
