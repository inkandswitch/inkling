import Vec from "../../lib/vec.js";
import SVG from "../Svg.js";
import Config from "../Config.js";
export default class Dot {
  constructor(position) {
    this.position = position;
    this.locked = false;
    this.bones = [];
  }
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
  at(p) {
    this.position = p;
  }
  connections() {
    return this.bones.map((bone) => bone.a === this ? [bone, bone.b] : [bone, bone.a]);
  }
  physics() {
  }
  render() {
    if (this.locked) {
      SVG.now("circle", {r: Config.lockedSize, fill: "#000", cx: this.x, cy: this.y});
    }
    if (Config.showDebugWedges) {
      this.connections().forEach(([boneA, adjA]) => {
        this.connections().forEach(([boneB, adjB]) => {
          if (boneA === boneB)
            return;
          let angle = Math.PI - Vec.angleBetween(Vec.sub(adjA, this), Vec.sub(adjB, this));
          let pos = Vec.avg(adjA, adjB);
          let rot = Vec.angle(Vec.sub(pos, this));
          pos = Vec.add(pos, Vec.polar(rot, 10));
          let good = false;
          SVG.now("polyline", {
            stroke: good ? "#0F45" : "#F405",
            fill: good ? "#0F45" : "#F405",
            points: SVG.points(this, adjA, adjB)
          });
        });
      });
    }
  }
}
