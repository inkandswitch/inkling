import { Position } from "../../lib/types";
import Vec from "../../lib/vec";
import { TAU, lerp, clip } from "../../lib/math";
import SVG from "../Svg";
import Page from "../Page";
import generateId from "../generateId";
import Dot from "./Dot";
import Config from "../Config";

export default class Bone {
  id = generateId();

  length: number;
  angle: number;
  diff = 0;

  constructor(public a: Dot, public b: Dot) {
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
    let { a, b, angle, length } = this;

    if (a.locked && b.locked) return;

    let newDir = Vec.normalize(Vec.sub(b, a));
    let oldDir = this.dir();

    let avg = Vec.avg(newDir, oldDir);

    // Try to straighten out
    this.diff = 0;

    // if (this.neighbours().length > 1) {
    //   let hintDir = Vec.normalize(
    //     this.neighbours()
    //       .map((bone) => bone.dir())
    //       .reduce(Vec.add)
    //   );

    //   this.diff = Vec.angle(hintDir) - angle;
    // }

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
      // "stroke-dasharray": "5 2",
      "stroke-width": Config.thinWhenStretched
        ? (Config.boneWidth * this.length) / Vec.dist(this.a, this.b)
        : Config.boneWidth,
      points: SVG.points(this.a, this.b),
    });

    let pos = Vec.add(Vec.avg(this.a, this.b), Vec.polar(this.angle - TAU / 4, 10));

    // SVG.now("text", {
    //   content: (100 * this.diff).toFixed(2),
    //   x: pos.x,
    //   y: pos.y,
    //   fill: "red",
    //   "font-size": 8,
    //   transform: `rotate(${(this.angle * 180) / Math.PI - 90}, ${pos.x}, ${pos.y})`,
    // });

    let off = Vec.polar(this.angle + TAU / 4, 10);

    // get a's neighbour(s)
    // for each of them, figure out the angle difference.
    // Draw a little pointer based on the size of the diff, and color it
    // this.a.connections().forEach(([bone, dot]) => {
    //   if (bone === this) return;

    // })

    // let good = false;

    // SVG.now("polyline", {
    //   fill: good ? "#0F45" : "#F405",
    //   points: SVG.points(Vec.add(this.b, off), this.a, Vec.sub(this.b, off)),
    // });

    // SVG.now("polyline", {
    //   fill: good ? "#0F45" : "#F405",
    //   points: SVG.points(Vec.add(this.a, off), this.b, Vec.sub(this.a, off)),
    // });
  }
}
