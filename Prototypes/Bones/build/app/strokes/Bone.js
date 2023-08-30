import Vec from "../../lib/vec.js";
import {TAU} from "../../lib/math.js";
import SVG from "../Svg.js";
import generateId from "../generateId.js";
import Config from "../Config.js";
export default class Bone {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.id = generateId();
    this.diff = 0;
    this.length = Vec.dist(a, b) * Config.lengthMultiple;
    this.angle = Vec.pointAngle(a, b);
    a.bones.push(this);
    b.bones.push(this);
  }
  neighbours() {
    return this.a.bones.concat(this.b.bones).filter((bone) => bone !== this);
  }
  dir() {
    return Vec.polar(this.angle, 1);
  }
  update() {
    let {a, b, angle, length} = this;
    if (a.locked && b.locked)
      return;
    let newDir = Vec.normalize(Vec.sub(b, a));
    let oldDir = this.dir();
    let avg = Vec.avg(newDir, oldDir);
    this.diff = 0;
    this.angle = Vec.angle(avg);
    let a_B = Vec.polar(this.angle, length);
    let B = Vec.add(a, a_B);
    let b_B = Vec.sub(B, b);
    if (a.locked) {
      this.b.at(Vec.add(b, Vec.half(b_B)));
    } else if (b.locked) {
      this.a.at(Vec.sub(a, Vec.half(b_B)));
    } else {
      this.a.at(Vec.sub(a, Vec.half(b_B)));
      this.b.at(Vec.add(b, Vec.half(b_B)));
    }
  }
  physics() {
    this.update();
  }
  render() {
    SVG.now("polyline", {
      stroke: "#000",
      "stroke-width": Config.thinWhenStretched ? Config.boneWidth * this.length / Vec.dist(this.a, this.b) : Config.boneWidth,
      points: SVG.points(this.a, this.b)
    });
    let pos = Vec.add(Vec.avg(this.a, this.b), Vec.polar(this.angle - TAU / 4, 10));
    let off = Vec.polar(this.angle + TAU / 4, 10);
  }
}
