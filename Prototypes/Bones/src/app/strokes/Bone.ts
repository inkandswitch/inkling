import { Position, PositionWithPressure } from "../../lib/types";
import Vec from "../../lib/vec";
import { lerp, clip } from "../../lib/math";
import SVG, { updateSvgElement } from "../Svg";
import Page from "../Page";
import generateId from "../generateId";
import TransformationMatrix from "../../lib/transform_matrix";

export default class Bone {
  id = generateId();
  posElm: SVGElement;
  tarElm: SVGElement;
  armElm: SVGElement;
  debugElm: SVGElement;
  length = 0;
  angle = 0;

  constructor(svg: SVG, public position: Position, public target: Position, public parent?: Bone) {
    let elm = svg.addElement("g", {});
    this.posElm = svg.addElement("circle", { r: 2, fill: "black", display: "none" }, elm);
    this.tarElm = svg.addElement("circle", { r: 3, stroke: "black", display: "none" }, elm);
    this.armElm = svg.addElement(
      "polyline",
      { stroke: "hsla(0, 0%, 0%, 1)", "stroke-width": 3 },
      elm
    );
    this.debugElm = svg.addElement("polyline", { stroke: "red", display: "none" }, elm);
  }

  finish() {
    this.length = Vec.dist(this.position, this.target);
    this.angle = Vec.angle(Vec.sub(this.target, this.position));
  }

  move(newPos: Position, depth: number, page: Page) {
    // Store the start positions
    let oldPos = this.position;
    let oldTar = this.target;

    // let blend = lerp(Math.pow(newPos.pressure / 3.2, 0.01), 0.8, 1, 0, 1);

    // let newGoal = Vec.add(
    //   Vec.Smul(1 - blend, Vec.sub(oldTar, newPos)),
    //   Vec.Smul(blend, Vec.sub(oldTar, oldPos))
    // );
    let newGoal = Vec.sub(oldTar, newPos);

    let oldPosToTar = Vec.sub(oldTar, oldPos);
    let newPosToTar = Vec.mulS(Vec.normalize(newGoal), this.length);

    let oldAngle = Vec.angle(oldPosToTar);
    let newAngle = Vec.angle(newPosToTar);

    let newTar = Vec.add(newPos, newPosToTar);

    newTar = Vec.lerp(newTar, oldTar, Math.pow(depth / 100, 1));

    // Move the bone
    this.position = newPos;
    this.target = newTar;

    // Get the transform from the old line to the new line
    let translation = Vec.sub(newPos, oldPos);
    let rotation = newAngle - oldAngle;

    let matrix = new TransformationMatrix();
    matrix.rotate(rotation);
    matrix.translate(translation.x, translation.y);

    // Transform strokes near this bone
    page.strokes.forEach((stroke) => {
      stroke.points.forEach((p) => {
        // let d = Vec.dist(p, oldPos) / this.length;
        // if (d < 1) {
        let newP = matrix.transformPoint(p);
        p.x = newP.x;
        p.y = newP.y;
        // }
      });
    });

    // Update bones that were close to the target
    page.objects
      .filter((b) => b instanceof Bone && b.parent === this)
      .forEach((bone: Bone) => bone.move(Object.assign({}, this.target), depth + 1, page));
  }

  render() {
    if (isNaN(this.position.x)) throw "STOP";
    if (isNaN(this.target.x)) throw "STOP";
    if (isNaN(this.angle)) throw "STOP";

    updateSvgElement(this.posElm, { cx: this.position.x, cy: this.position.y });
    updateSvgElement(this.tarElm, { cx: this.target.x, cy: this.target.y });
    updateSvgElement(this.armElm, {
      points: [this.position.x, this.position.y, this.target.x, this.target.y].join(" "),
    });
    let x = this.position.x + Math.cos(this.angle) * 50;
    let y = this.position.y + Math.sin(this.angle) * 50;
    updateSvgElement(this.debugElm, {
      points: [this.position.x, this.position.y, x, y].join(" "),
    });
  }
}
