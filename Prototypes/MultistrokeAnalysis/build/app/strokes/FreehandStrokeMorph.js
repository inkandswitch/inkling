import Vec from "../../lib/vec.js";
import {generatePathFromPoints, updateSvgElement} from "../Svg.js";
import generateId from "../generateId.js";
export default class FreehandStrokeMorph {
  constructor(svg, points) {
    this.points = points;
    this.id = generateId();
    this.dirty = true;
    this.selected = false;
    this.id;
    this.pointsMorphed = points;
    const path = generatePathFromPoints(this.pointsMorphed);
    this.elements = {
      normal: svg.addElement("path", {
        d: path,
        stroke: "darkgrey",
        "stroke-width": 2,
        fill: "none"
      })
    };
  }
  applyMorphs(morphPoints) {
    this.pointsMorphed = this.points.map((pt) => {
      let dists = morphPoints.map((morph) => {
        const d = Vec.dist(morph.firstPosition, pt);
        return 1 / Math.pow(d, 2);
      });
      const totalDist = dists.reduce((acc, d) => acc + d, 0);
      dists = dists.map((d) => d / totalDist);
      const vecs = morphPoints.map((morph, i) => {
        const multiplyer = dists[i];
        const translation = Vec.mulS(morph.morphVector, multiplyer);
        const rotated = Vec.rotateAround(pt, morph.firstPosition, morph.angle * multiplyer * multiplyer);
        const rotationDelta = Vec.sub(rotated, pt);
        return Vec.add(translation, rotationDelta);
      });
      const totalVec = vecs.reduce((acc, v) => Vec.add(acc, v), Vec(0, 0));
      return Vec.add(pt, totalVec);
    });
    this.dirty = true;
  }
  move(position) {
    this.dirty = true;
    this.position = position;
  }
  select() {
    this.dirty = true;
    this.selected = true;
  }
  deselect() {
    this.dirty = true;
    this.selected = false;
  }
  render(svg) {
    if (!this.dirty) {
      return;
    }
    const path = generatePathFromPoints(this.pointsMorphed);
    updateSvgElement(this.elements.normal, {d: path});
    this.dirty = false;
  }
}
