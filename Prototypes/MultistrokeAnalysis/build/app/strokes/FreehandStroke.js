import Vec from "../../lib/vec.js";
import TransformationMatrix from "../../lib/transform_matrix.js";
import {generatePathFromPoints, updateSvgElement} from "../Svg.js";
import generateId from "../generateId.js";
import Polygon from "../../lib/polygon.js";
import hull from "../../_snowpack/pkg/hulljs.js";
import Voronoi from "../../_snowpack/pkg/voronoi.js";
var voronoi = new Voronoi();
export const strokeSvgProperties = {
  stroke: "rgba(0, 0, 0, .5)",
  fill: "none",
  "stroke-width": 2
};
function notNull(x) {
  return x != null;
}
export default class FreehandStroke {
  constructor(svg, points, cp1, cp2) {
    this.id = generateId();
    this.dirty = true;
    this.outline = [];
    const [cp1Pos, cp2Pos] = farthestPair(points.filter(notNull));
    cp1.setPosition(cp1Pos);
    cp2.setPosition(cp2Pos);
    this.controlPoints = [cp1, cp2];
    this.points = points;
    const transform = new TransformationMatrix().fromLine(cp1Pos, cp2Pos).inverse();
    this.pointData = points.map((p) => {
      if (p === null) {
        return null;
      } else {
        const np = transform.transformPoint(p);
        return {...np, pressure: p.pressure};
      }
    });
    this.element = svg.addElement("path", {
      d: "",
      ...strokeSvgProperties
    });
    this.outlineElement = svg.addElement("path", {
      d: "",
      fill: "none",
      stroke: "grey"
    });
    this.skeletonElement = svg.addElement("path", {
      d: "",
      fill: "none",
      stroke: "red",
      "stroke-width": 2
    });
    this.generateOutline();
  }
  currentAngle() {
    return Vec.angle(Vec.sub(this.controlPoints[1].position, this.controlPoints[0].position));
  }
  generateOutline() {
    const OFFSET = 10;
    const CIRCLESTEP = 16;
    let circle = [];
    for (let i = 0; i < CIRCLESTEP; i++) {
      circle.push([
        Math.sin(i / CIRCLESTEP * Math.PI * 2) * OFFSET,
        Math.cos(i / CIRCLESTEP * Math.PI * 2) * OFFSET
      ]);
    }
    let lastPt = null;
    let hullPoints = this.points.flatMap((pt) => {
      if (pt === null)
        return [];
      if (lastPt != null && Vec.dist(pt, lastPt) < 10) {
        return [];
      }
      lastPt = pt;
      return circle.map((c) => {
        return [
          c[0] + pt.x,
          c[1] + pt.y
        ];
      });
    });
    this.outline = hull(hullPoints, 10).map((pt) => {
      return Vec(pt[0], pt[1]);
    });
    let smoothedOutline = gaussianSmooth(this.outline, 5);
    const bbox = {xl: 0, xr: window.innerWidth, yt: 0, yb: window.innerHeight};
    console.log(bbox);
    let diagram = voronoi.compute(smoothedOutline, bbox);
    let skeleton = [];
    diagram.edges.forEach((edge) => {
      if (Polygon.isPointInside(this.outline, edge.va) && Polygon.isPointInside(this.outline, edge.vb)) {
        skeleton.push({a: edge.va, b: edge.vb});
      }
    });
    this.diagram = skeleton;
    console.log(this.diagram);
  }
  onControlPointMove() {
    this.dirty = true;
  }
  updatePath() {
    const transform = new TransformationMatrix().fromLine(this.controlPoints[0].position, this.controlPoints[1].position);
    this.points = this.pointData.map((p) => {
      if (p === null) {
        return null;
      }
      const np = transform.transformPoint(p);
      return {...np, pressure: p.pressure};
    });
    const path = generatePathFromPoints(this.points);
    updateSvgElement(this.element, {d: path});
    const outlinePath = generatePathFromPoints(this.outline);
    updateSvgElement(this.outlineElement, {d: outlinePath});
    let skeletonPath = "";
    this.diagram.forEach((edge) => {
      skeletonPath += `M ${edge.a.x} ${edge.a.y} L ${edge.b.x} ${edge.b.y}`;
    });
    updateSvgElement(this.skeletonElement, {d: skeletonPath});
  }
  render() {
    if (!this.dirty) {
      return;
    }
    this.updatePath();
    this.dirty = false;
  }
}
function farthestPair(points) {
  let maxDist = -Infinity;
  let mdp1 = null;
  let mdp2 = null;
  for (const p1 of points) {
    for (const p2 of points) {
      const d = Vec.dist(p1, p2);
      if (d > maxDist) {
        mdp1 = p1;
        mdp2 = p2;
        maxDist = d;
      }
    }
  }
  return [mdp1, mdp2];
}
function gaussianSmooth(polygon, sigma = 1) {
  const kernelSize = Math.ceil(3 * sigma);
  const kernel = generateGaussianKernel(kernelSize, sigma);
  const halfKernelSize = Math.floor(kernelSize / 2);
  const smoothedPolygon = [];
  for (let i = 0; i < polygon.length; i++) {
    let smoothedPoint = {x: 0, y: 0};
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
  const kernel = [];
  const sigmaSquared = sigma * sigma;
  const constant = 1 / (2 * Math.PI * sigmaSquared);
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const distance = i - Math.floor(size / 2);
    const weight = constant * Math.exp(-(distance * distance) / (2 * sigmaSquared));
    kernel.push(weight);
    sum += weight;
  }
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}
