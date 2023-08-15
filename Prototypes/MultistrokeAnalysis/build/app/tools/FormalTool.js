import Arc from "../../lib/arc.js";
import Fit from "../../lib/fit.js";
import Line from "../../lib/line.js";
import Vec from "../../lib/vec.js";
import {generatePathFromPoints, updateSvgElement} from "../Svg.js";
import {Tool} from "./Tool.js";
export default class FormalTool extends Tool {
  constructor(svg, buttonX, buttonY, page, snaps) {
    super(svg, buttonX, buttonY);
    this.page = page;
    this.snaps = snaps;
    this.speed = 0;
    this.maxSpeed = 0;
    this.mode = "unknown";
  }
  update(events) {
    const pencilDown = events.did("pencil", "began");
    if (pencilDown) {
      this.inputPoints = [pencilDown.position];
      this.renderPoints = [Vec.clone(pencilDown.position)];
      this.speed = 0;
      this.maxSpeed = 0;
      this.previousPosition = pencilDown.position;
      this.mode = "unknown";
      this.dirty = true;
    }
    const pencilMoves = events.didAll("pencil", "moved");
    pencilMoves.forEach((pencilMove) => {
      const newSpeed = Vec.dist(this.previousPosition, pencilMove.position);
      const alpha = 0.05;
      this.speed = alpha * newSpeed + (1 - alpha) * this.speed;
      this.maxSpeed = Math.max(this.maxSpeed, this.speed);
      this.previousPosition = pencilMove.position;
      if (this.mode !== "fixed") {
        this.inputPoints.push(pencilMove.position);
        this.renderPoints.push(Vec.clone(pencilMove.position));
        if (this.mode === "guess") {
          this.doFit();
        }
      } else {
        const updatedPosition = pencilMove.position;
        const pointPositions = new Map();
        pointPositions.set(this.fixedStroke.a, this.fixedStroke.a.position);
        pointPositions.set(this.fixedStroke.b, updatedPosition);
        const snappedPositions = this.snaps.snapPositions(pointPositions);
        this.fixedStroke.a.setPosition(snappedPositions.get(this.fixedStroke.a));
        this.fixedStroke.b.setPosition(snappedPositions.get(this.fixedStroke.b));
      }
      if (this.mode === "unknown" && this.inputPoints.length > 100) {
        this.mode = "guess";
      }
      if (this.mode !== "fixed" && this.inputPoints.length > 10 && this.speed < Math.min(1, this.maxSpeed)) {
        this.doFit();
        this.createStroke();
        this.clearGuess();
        this.mode = "fixed";
      }
      this.dirty = true;
    });
    const pencilUp = events.did("pencil", "ended");
    if (pencilUp) {
      if (this.mode !== "fixed") {
        this.doFit();
        this.createStroke();
        this.clearGuess();
      }
      this.page.mergePoint(this.fixedStroke.a);
      this.page.mergePoint(this.fixedStroke.b);
      this.fixedStroke = null;
      this.mode = "unknown";
      this.snaps.clear();
    }
    if (this.idealPoints && this.renderPoints.length === this.idealPoints.length) {
      for (let i = 0; i < this.idealPoints.length; i++) {
        this.renderPoints[i] = Vec.lerp(this.idealPoints[i], this.renderPoints[i], 0.8);
      }
    }
  }
  doFit() {
    const lineFit = Fit.line(this.inputPoints);
    const arcFit = Fit.arc(this.inputPoints);
    const circleFit = Fit.circle(this.inputPoints);
    this.fit = lineFit;
    if (arcFit != null && Math.abs(Arc.directedInnerAngle(arcFit.arc)) > 0.4 * Math.PI && (lineFit == null || arcFit.fitness < lineFit.fitness)) {
      this.fit = arcFit;
      if (circleFit != null && Math.abs(Arc.directedInnerAngle(arcFit.arc)) > 1.5 * Math.PI && circleFit.circle.radius < 500 && circleFit.fitness < arcFit.fitness) {
        this.fit = circleFit;
      }
    }
    if (this.fit != null) {
      this.updateIdeal();
    }
  }
  createStroke() {
    if (this.fit.type === "line") {
      const a = this.page.addPoint(this.fit.line.a);
      const b = this.page.addPoint(this.fit.line.b);
      const stroke = this.page.addLineSegment(a, b);
      this.fixedStroke = stroke;
    } else if (this.fit.type === "arc") {
      const {start, end} = Arc.points(this.fit.arc);
      const a = this.page.addPoint(start);
      const b = this.page.addPoint(end);
      const c = this.page.addPoint(this.fit.arc.center);
      const stroke = this.page.addArcSegment(a, b, c);
      this.fixedStroke = stroke;
    }
  }
  clearGuess() {
    this.inputPoints = null;
    this.idealPoints = null;
    this.renderPoints = null;
    this.element.remove();
    this.element = null;
  }
  updateIdeal() {
    if (this.fit.type === "line") {
      this.idealPoints = Line.spreadPointsAlong(this.fit.line, this.inputPoints.length);
    } else if (this.fit.type === "arc") {
      this.idealPoints = Arc.spreadPointsAlong(this.fit.arc, this.inputPoints.length);
    } else if (this.fit.type === "circle") {
      this.idealPoints = Arc.spreadPointsAlong(this.fit.circle, this.inputPoints.length);
    }
  }
  render(svg) {
    if (!this.dirty) {
      return;
    }
    if (this.renderPoints) {
      if (!this.element) {
        this.element = svg.addElement("path", {
          d: "",
          stroke: "black",
          fill: "none"
        });
      }
      const path = generatePathFromPoints(this.renderPoints);
      updateSvgElement(this.element, {d: path});
    }
    this.dirty = false;
  }
}
