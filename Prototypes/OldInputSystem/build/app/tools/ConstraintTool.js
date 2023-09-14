import Vec from "../../lib/vec.js";
import * as constraints from "../constraints.js";
import FreehandStroke from "../strokes/FreehandStroke.js";
import Tool from "./Tool.js";
import SVG from "../Svg.js";
import {toDegrees} from "../../lib/helpers.js";
import Handle from "../strokes/Handle.js";
export default class ConstraintTool extends Tool {
  constructor(label, buttonX, buttonY, page, options) {
    super(label, buttonX, buttonY, page, FreehandStroke);
    this.options = options;
    this.lastTapInfo = {
      timestampMillis: 0,
      strokeGroup: null
    };
    this.refStrokeGroup = null;
    this.constraintCandidates = new Set();
    this.appliedCandidates = new Set();
    this.onActionState = void 0;
  }
  addStrokeGroup(p1, p2) {
    const stroke = this.page.addStroke(new FreehandStroke([
      {...p1, pressure: 1},
      {...p2, pressure: 1}
    ]));
    return this.page.addStrokeGroup(new Set([stroke]));
  }
  onAction() {
    if (!this.onActionState) {
      const a = Handle.create("informal", {x: 100, y: 100});
      const {variable: ay} = constraints.property(a, "y").variables;
      const b = Handle.create("informal", {x: 200, y: 100});
      const {variable: by} = constraints.property(b, "y").variables;
      const {result} = this.onActionState = constraints.formula([ay, by], ([ay2, by2]) => ay2 + by2).variables;
      setInterval(() => {
        SVG.showStatus(`ay=${ay.value}, by=${by.value}, result=${result.value}`);
      }, 10);
    } else {
      const {result} = this.onActionState;
      result.value = 450;
      console.log("set result value to", result.value);
      constraints.now.constant(result);
      console.log("added temp constant constraint on result");
    }
  }
  update(events) {
    super.update(events);
    const fingerDown = events.find("finger", "began");
    if (fingerDown) {
      this.updateLastTap(this.page.findStrokeGroupNear(fingerDown.position, 40));
    }
    if (events.find("finger", "moved")) {
      this.onFingerMoved();
    }
    if (events.find("finger", "ended")) {
      this.applyConstraintCandidates();
    }
  }
  updateLastTap(strokeGroup) {
    const timestampMillis = Date.now();
    const isDoubleTap = timestampMillis - this.lastTapInfo.timestampMillis <= 150;
    const oldStrokeGroup = this.lastTapInfo.strokeGroup;
    if (isDoubleTap && strokeGroup === oldStrokeGroup) {
      if (strokeGroup) {
        for (const stroke of strokeGroup.strokes) {
          stroke.deselect();
        }
      }
      this.refStrokeGroup = strokeGroup;
    }
    this.lastTapInfo = {timestampMillis, strokeGroup};
  }
  onFingerMoved() {
    this.constraintCandidates.clear();
    for (const strokeGroup of this.page.strokeGroups) {
      if (strokeGroup.a.isSelected || strokeGroup.b.isSelected) {
        this.addConstraintCandidates(strokeGroup);
      }
    }
  }
  addConstraintCandidates(strokeGroup) {
    const {a, b} = strokeGroup;
    const vertical = this.options.vertical && Math.abs(a.position.x - b.position.x) < 5;
    if (vertical) {
      this.addConstraintCandidate("vertical", strokeGroup);
    }
    const horizontal = this.options.horizontal && Math.abs(a.position.y - b.position.y) < 5;
    if (horizontal) {
      this.addConstraintCandidate("horizontal", strokeGroup);
    }
    if (strokeGroup === this.refStrokeGroup || !this.refStrokeGroup) {
      return;
    }
    const {a: ra, b: rb} = this.refStrokeGroup;
    const refDist = Vec.dist(ra.position, rb.position);
    const dist = Vec.dist(a.position, b.position);
    const diff = Math.abs(refDist - dist);
    if (this.options.distance && diff < 10) {
      this.addConstraintCandidate("distance", strokeGroup, this.refStrokeGroup);
    }
    if (this.options.angle && !vertical && !horizontal) {
      const refAngle = toDegrees(Vec.angle(Vec.sub(rb.position, ra.position)));
      const angle = toDegrees(Vec.angle(Vec.sub(b.position, a.position)));
      const diff2 = refAngle - angle;
      if (Math.abs(diff2 - nearestMultiple(diff2, 90)) < 1 && Math.abs(refAngle - nearestMultiple(refAngle, 90)) > 5) {
        this.addConstraintCandidate("angle", strokeGroup, this.refStrokeGroup);
      }
    }
  }
  addConstraintCandidate(type, strokeGroup, refStrokeGroup = null) {
    for (const applied of this.appliedCandidates) {
      if (applied.type === type && applied.strokeGroup === strokeGroup && applied.refStrokeGroup === refStrokeGroup) {
        return;
      }
    }
    this.constraintCandidates.add({type, strokeGroup, refStrokeGroup});
  }
  endStroke() {
    const stroke = this.stroke;
    super.endStroke();
    this.page.addStrokeGroup(new Set([stroke]));
  }
  render() {
    super.render();
    for (const {type, strokeGroup} of this.constraintCandidates) {
      const {a, b} = strokeGroup;
      switch (type) {
        case "vertical":
          SVG.now("polyline", {
            points: SVG.points([
              {x: a.position.x, y: 0},
              {x: a.position.x, y: 1e4}
            ]),
            stroke: "rgba(0, 0, 255, 0.2)"
          });
          break;
        case "horizontal":
          SVG.now("polyline", {
            points: SVG.points([
              {x: 0, y: a.position.y},
              {x: 1e4, y: a.position.y}
            ]),
            stroke: "rgba(0, 0, 255, 0.2)"
          });
          break;
        case "distance":
          SVG.now("polyline", {
            points: SVG.points([a.position, b.position]),
            stroke: "cornflowerblue",
            "stroke-width": 12
          });
          break;
        case "angle": {
          SVG.now("polyline", {
            points: SVG.points([
              Vec.lerp(a.position, b.position, 1e4),
              Vec.lerp(a.position, b.position, -1e4)
            ]),
            stroke: "rgba(255, 0, 0, 0.2)"
          });
          const {a: ra, b: rb} = this.refStrokeGroup;
          SVG.now("polyline", {
            points: SVG.points([
              Vec.lerp(ra.position, rb.position, 1e4),
              Vec.lerp(ra.position, rb.position, -1e4)
            ]),
            stroke: "rgba(255, 0, 0, 0.2)"
          });
          break;
        }
      }
    }
    if (this.refStrokeGroup) {
      const {a, b} = this.refStrokeGroup;
      SVG.now("polyline", {
        points: SVG.points([a.position, b.position]),
        stroke: "rgba(243, 149, 57, 0.5)",
        "stroke-width": 12
      });
    }
  }
  applyConstraintCandidates() {
    const ra = this.refStrokeGroup?.a;
    const rb = this.refStrokeGroup?.b;
    for (const candidate of this.constraintCandidates) {
      const {
        type,
        strokeGroup: {a, b}
      } = candidate;
      switch (type) {
        case "vertical":
          constraints.vertical(a, b);
          break;
        case "horizontal":
          constraints.horizontal(a, b);
          break;
        case "distance": {
          constraints.equalDistance(ra, rb, a, b);
          break;
        }
        case "angle": {
          constraints.fixedAngle(ra, rb, a, b, nearestMultiple(Vec.angle(Vec.sub(rb.position, ra.position)) - Vec.angle(Vec.sub(b.position, a.position)), Math.PI / 2));
          break;
        }
      }
      this.appliedCandidates.add(candidate);
    }
    this.constraintCandidates.clear();
  }
}
function nearestMultiple(n, m) {
  return Math.round(n / m) * m;
}
