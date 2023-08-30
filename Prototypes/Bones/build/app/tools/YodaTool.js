import Vec from "../../lib/vec.js";
import SVG from "../Svg.js";
import YodaStroke from "../strokes/YodaStroke.js";
import {Tool} from "./Tool.js";
import Config from "../Config.js";
export default class Yoda extends Tool {
  constructor(svg, buttonX, buttonY, page) {
    super(svg, buttonX, buttonY);
    this.page = page;
    this.recentVelocities = [];
  }
  startStroke(position) {
    this.point = this.page.findPointNear(position, Config.yodaAttachDist);
    if (this.point) {
      this.stroke = this.point.stroke;
    } else {
      const start = this.page.addPoint(position);
      const end = this.page.addPoint(position);
      this.point = end;
      this.stroke = new YodaStroke(this.svg, start, end, [position]);
      this.page.addStroke(this.stroke);
    }
    this.lastPosition = position;
    this.recentVelocities = [];
  }
  extendStroke(position) {
    if (!this.stroke || !this.point || !this.lastPosition)
      return;
    let currentVelocity = Vec.sub(position, this.lastPosition);
    if (Vec.len(currentVelocity) < 5)
      return;
    this.recentVelocities.unshift(currentVelocity);
    let nRecentVelocities = 1;
    this.recentVelocities.splice(nRecentVelocities, Infinity);
    this.lastPosition = position;
    let pencilVelocity = this.recentVelocities.reduce(Vec.add, Vec());
    pencilVelocity = Vec.divS(pencilVelocity, this.recentVelocities.length);
    let minLength = this.stroke.age < 20 ? 20 : 2;
    if (this.stroke.points.length <= minLength) {
      this.doExtend(position, this.point, this.stroke);
      return;
    }
    let points = Array.from(this.stroke.points);
    if (this.point == this.stroke.end) {
      points = points.reverse();
    }
    let nRecentPoints = 2;
    let recentPoints = points.slice(0, nRecentPoints);
    let strokeDirection = recentPoints.reduce((acc, v, i) => {
      return i === 0 ? acc : Vec.add(acc, Vec.sub(recentPoints[i - 1], v));
    }, Vec());
    let distancesToRecentPoints = points.slice(0, 20).map((p) => Vec.dist(position, p));
    let dot = Vec.dot(Vec.normalize(strokeDirection), Vec.normalize(pencilVelocity));
    if (dot > 0) {
      return this.doExtend(position, this.point, this.stroke);
    }
    let pencilSpeed = this.recentVelocities.reduce((s, v) => s + Vec.len(v), 0);
    pencilSpeed /= this.recentVelocities.length;
    let cullRadius = Math.max(15, 10 * pencilSpeed);
    if (Vec.dist(position, points[0]) < cullRadius) {
      this.doRetract(this.point, this.stroke, "yellow");
    }
  }
  doRetract(point, stroke, color) {
    let p;
    if (point == stroke.end) {
      p = stroke.points.pop();
    } else {
      p = stroke.points.shift();
    }
    if (p)
      stroke.deadPoints.push({...p, color});
    stroke.updatePoints();
    stroke.dirty = true;
  }
  doExtend(position, point, stroke) {
    if (point == stroke.end) {
      stroke.points.push(position);
    } else {
      stroke.points.unshift(position);
    }
    stroke.age++;
    stroke.updatePoints();
    stroke.dirty = true;
  }
  endStroke() {
    if (!this.stroke)
      return;
    if (this.stroke.points.length < 3) {
      this.stroke.points = [];
    }
    this.stroke.finished = true;
    this.stroke = void 0;
    this.point = void 0;
  }
}
function debugLine(c, ...points) {
  SVG.now("polyline", {points: SVG.points(points), stroke: c});
}
