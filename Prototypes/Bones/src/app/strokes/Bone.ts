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
  arrowElm: SVGElement;
  length = 0;
  angle = 0;

  children: Bone[] = [];

  constructor(svg: SVG, public position: Position, public target: Position, public parent?: Bone) {
    let elm = svg.addElement("g", {});
    this.posElm = svg.addElement("circle", { r: 3, fill: "green" }, elm);
    this.tarElm = svg.addElement("circle", { r: 3, stroke: "red" }, elm);
    this.armElm = svg.addElement(
      "polyline",
      { stroke: "hsla(0, 0%, 0%, 1)", "stroke-width": 1, "stroke-dasharray": "5 2" },
      elm
    );
    this.arrowElm = svg.addElement(
      "polyline",
      { stroke: "hsla(0, 0%, 0%, 1)", "stroke-width": 1 },
      elm
    );

    // this.angle = Vec.angle(Vec.sub(this.target, this.position));

    if (parent) {
      parent.children.push(this);

      // this.angle = Vec.angleBetween(Vec.sub(target, position), Vec.sub(parent.target, parent.position));
    }
  }

  finish() {
    this.length = Vec.dist(this.position, this.target);
    this.angle = Vec.angle(Vec.sub(this.target, this.position));
    this.update();
  }

  move(newPos: Position, depth: number, page: Page) {
    this.position = newPos;
  }

  update() {
    if (this.parent) {
      this.position = this.parent.target;
    }

    let newAngle = Vec.angle(Vec.sub(this.target, this.position));

    newAngle = (this.angle + newAngle) / 2;

    this.angle += (newAngle - this.angle) / 10;

    let newPosToTar = {
      x: this.length * Math.cos(newAngle),
      y: this.length * Math.sin(newAngle),
    };

    this.target = Vec.add(this.position, newPosToTar);

    // Update bones that were close to the target
    // page.objects
    //   .filter((b) => b instanceof Bone && b.parent === this)
    //   .forEach((bone: Bone) => bone.move(Object.assign({}, this.target), depth + 1, page));
  }

  render() {
    if (isNaN(this.position.x)) throw "STOP";
    if (isNaN(this.target.x)) throw "STOP";
    if (isNaN(this.angle)) throw "STOP";

    this.update();

    updateSvgElement(this.posElm, { cx: this.position.x, cy: this.position.y });
    updateSvgElement(this.tarElm, { cx: this.target.x, cy: this.target.y });

    updateSvgElement(this.armElm, { points: SVG.points(this.position, this.target) });
    updateSvgElement(this.arrowElm, {
      points: SVG.points(
        this.position,
        Vec.add(this.position, Vec.renormalize(Vec.sub(this.target, this.position), 20))
      ),
    });
  }
}
