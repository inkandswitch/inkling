import {closestPointOnPolygon} from "../../lib/polygon.js";
import {GameObject} from "../GameObject.js";
import SVG from "../Svg.js";
import {aStroke} from "../ink/Stroke.js";
import {MetaStruct} from "./MetaSemantics.js";
import Token from "./Token.js";
import {WirePort} from "./Wire.js";
import ClipperShape from "../../_snowpack/pkg/@doodle3d/clipper-js.js";
export default class Component extends GameObject {
  constructor() {
    super(...arguments);
    this.editing = false;
    this.position = {x: 400, y: 100};
    this.width = 100;
    this.height = 100;
    this.scope = new MetaStruct([]);
    this.outline = [];
    this.clipperShape = new ClipperShape([]);
    this.wirePorts = [];
    this.svgOutline = SVG.add("path", SVG.metaElm, {
      class: "component"
    });
  }
  getWirePortNear(pos) {
    const closestPoint = closestPointOnPolygon(this.outline, pos);
    const newPort = new WirePort(closestPoint, this.scope);
    this.wirePorts.push(newPort);
    return newPort;
  }
  render(dt, t) {
    SVG.update(this.svgOutline, {
      d: SVG.path(this.outline)
    });
    for (const child of this.children) {
      if (child instanceof Token) {
        child.hidden = !this.editing;
      }
      child.render(dt, t);
    }
  }
  distanceToPoint(pos) {
    if (this.clipperShape.pointInShape(pos, true)) {
      return 0;
    } else {
      return Infinity;
    }
  }
  updateOutline() {
    const strokes = this.findAll({what: aStroke});
    this.clipperShape = new ClipperShape(strokes.map((stroke) => stroke.points), true, true, true, true);
    this.clipperShape = this.clipperShape.offset(7, {
      jointType: "jtRound",
      endType: "etOpenRound",
      miterLimit: 2,
      roundPrecision: 0.1
    });
    const shapePaths = this.clipperShape.paths.map((path) => {
      const p = path.map((pt) => {
        return {x: pt.X, y: pt.Y};
      });
      return p.concat([p[0]]);
    });
    this.outline = shapePaths[0];
  }
}
export const aComponent = (gameObj) => gameObj instanceof Component ? gameObj : null;
