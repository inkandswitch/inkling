import SVG from "./Svg.js";
import Vec from "../lib/vec.js";
import FreehandStroke from "./strokes/FreehandStroke.js";
import * as constraints from "./constraints.js";
import Line from "../lib/line.js";
function stroke(color, width = 6) {
  return {
    stroke: color,
    fill: "none",
    "stroke-linecap": "round",
    "stroke-width": width
  };
}
const green = "color(display-p3 0 1 0.8)";
const grey = "color(display-p3 0.8 0.8 0.8)";
class GizmoInstance {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.visible = true;
    this.line = this.updateLine();
    this.center = this.updateCenter();
    this.radius = this.updateRadius();
    this.polarVectorConstraint = constraints.polarVector(a, b);
  }
  updateLine() {
    const {a, b} = this;
    return this.line = Line(a.position, b.position);
  }
  updateCenter() {
    return this.center = Vec.avg(this.a.position, this.b.position);
  }
  updateRadius() {
    return this.radius = 20;
  }
  update(events) {
    const fingerDown = events.find("finger", "began");
    if (fingerDown) {
      const dist = Line.distToPoint(this.line, fingerDown.position);
      if (dist < 20) {
        return true;
      }
    }
    const fingerUp = events.find("finger", "ended");
    if (fingerUp) {
      if (Vec.dist(this.a.position, fingerUp.position) < 20) {
        return true;
      }
      if (Vec.dist(this.b.position, fingerUp.position) < 20) {
        return true;
      }
      const d = Vec.dist(this.center, fingerUp.position);
      if (Math.abs(d - this.radius) < 20) {
        if (!this.angleConstraint) {
          this.angleConstraint = constraints.constant(this.polarVectorConstraint.variables.angle, Vec.angle(Vec.sub(this.b.position, this.a.position)));
        } else {
          this.angleConstraint.remove();
          this.angleConstraint = void 0;
        }
        return true;
      }
      if (Line.distToPoint(this.line, fingerUp.position) < 20) {
        if (!this.distanceConstraint) {
          this.distanceConstraint = constraints.constant(this.polarVectorConstraint.variables.distance, Vec.dist(this.a.position, this.b.position));
        } else {
          this.distanceConstraint.remove();
          this.distanceConstraint = void 0;
        }
        return true;
      }
    }
    return false;
  }
  render(_dt, _t) {
    this.updateLine();
    this.updateCenter();
    this.updateRadius();
    if (!this.visible) {
      return;
    }
    SVG.now("circle", {
      cx: this.center.x,
      cy: this.center.y,
      r: this.radius,
      ...stroke(this.angleConstraint ? green : grey)
    });
    SVG.now("polyline", {
      points: SVG.points(this.line.a, this.line.b),
      ...stroke("#fff", 20)
    });
    SVG.now("polyline", {
      points: SVG.points(this.line.a, this.line.b),
      ...stroke(this.distanceConstraint ? green : grey, 3)
    });
  }
}
export default class Gizmo {
  constructor(page, selection, enabled = true) {
    this.page = page;
    this.selection = selection;
    this.enabled = enabled;
    this.all = [];
    if (!enabled) {
      return;
    }
    this.createStructure({x: 100, y: 500}, {x: 400, y: 400}, {x: 500, y: 200}, {x: 600, y: 100}, {x: 700, y: 300}, {x: 600, y: 500}, {x: 900, y: 600});
    this.page.strokeGroups.forEach((strokeGroup) => {
      const {a, b} = strokeGroup;
      this.findOrCreate(a, b);
    });
  }
  addStrokeGroup(p1, p2) {
    const stroke2 = this.page.addStroke(new FreehandStroke([
      {...p1, pressure: 1},
      {...p2, pressure: 1}
    ]));
    return this.page.addStrokeGroup(new Set([stroke2]));
  }
  createStructure(...positions) {
    for (let i = 1; i < positions.length; i++) {
      const a = positions[i - 1];
      const b = positions[i];
      const {a: a1, b: b1} = this.addStrokeGroup(a, b);
    }
  }
  update(events) {
    if (!this.enabled) {
      return;
    }
    this.selection.touchingGizmo = false;
    this.page.strokeGroups.forEach((strokeGroup) => {
      var _a;
      const {a, b} = strokeGroup;
      const gizmo = this.findOrCreate(a, b);
      if (gizmo.visible || a.isSelected || b.isSelected) {
        gizmo.visible = true;
        const didTouch = gizmo.update(events);
        (_a = this.selection).touchingGizmo || (_a.touchingGizmo = didTouch);
      } else {
        gizmo.visible = false;
      }
    });
  }
  findOrCreate(a, b) {
    if (a.id > b.id) {
      [a, b] = [b, a];
    }
    let giz = this.all.find((gizmo) => gizmo.a === a && gizmo.b === b);
    if (!giz) {
      this.all.push(giz = new GizmoInstance(a, b));
    }
    return giz;
  }
  render(dt, t) {
    this.all.forEach((gizmo) => gizmo.render(dt, t));
  }
}
