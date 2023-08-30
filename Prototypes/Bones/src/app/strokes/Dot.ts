import { Position } from "../../lib/types";
import { TAU, lerp, clip } from "../../lib/math";
import Vec from "../../lib/vec";
import SVG from "../Svg";
import Bone from "./Bone";
import Config from "../Config";

export default class Dot implements Position {
  locked = false;
  bones: Bone[] = [];

  constructor(public position: Position) {}

  get x() {
    return this.position.x;
  }
  get y() {
    return this.position.y;
  }
  set x(x) {
    this.position.x = x;
  }
  set y(y) {
    this.position.y = y;
  }

  at(p: Position) {
    this.position = p;
  }

  connections(): [Bone, Dot][] {
    return this.bones.map((bone) => (bone.a === this ? [bone, bone.b] : [bone, bone.a]));
  }

  physics() {}

  render() {
    if (this.locked) {
      SVG.now("circle", { r: Config.lockedSize, fill: "#000", cx: this.x, cy: this.y });
    }

    if (Config.showDebugWedges) {
      this.connections().forEach(([boneA, adjA]) => {
        this.connections().forEach(([boneB, adjB]) => {
          if (boneA === boneB) return;

          let angle = Math.PI - Vec.angleBetween(Vec.sub(adjA, this), Vec.sub(adjB, this));

          let pos = Vec.avg(adjA, adjB);
          let rot = Vec.angle(Vec.sub(pos, this));
          pos = Vec.add(pos, Vec.polar(rot, 10));

          // SVG.now("text", {
          //   content: ((angle * 180) / Math.PI).toFixed(2),
          //   x: pos.x,
          //   y: pos.y,
          //   fill: "red",
          //   "font-size": 12,
          //   transform: `rotate(${(rot * 180) / Math.PI}, ${pos.x}, ${pos.y})`,
          // });

          let good = false;

          SVG.now("polyline", {
            stroke: good ? "#0F45" : "#F405",
            fill: good ? "#0F45" : "#F405",
            points: SVG.points(this, adjA, adjB),
          });
        });
      });
    }
  }
}
