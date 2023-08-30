import {generatePathFromPoints, updateSvgElement} from "../Svg.js";
import {strokeSvgProperties} from "../strokes/FreehandStroke.js";
import {Tool} from "./Tool.js";
export default class Free extends Tool {
  constructor(svg, buttonX, buttonY, page) {
    super(svg, buttonX, buttonY);
    this.page = page;
    this.mode = "unistroke";
    this.pencilIsDown = false;
    this.dirty = false;
    this.strokeElement = svg.addElement("path", {d: "", ...strokeSvgProperties});
  }
  update(events) {
    const pencilDown = events.did("pencil", "began");
    if (pencilDown != null) {
      this.pencilIsDown = true;
      if (this.points == null) {
        this.startStroke({...pencilDown.position, pressure: pencilDown.pressure});
      } else {
        this.extendStroke({...pencilDown.position, pressure: -1});
        this.extendStroke({...pencilDown.position, pressure: pencilDown.pressure});
      }
    }
    if (this.points == null) {
      return;
    }
    const pencilMoves = events.didAll("pencil", "moved");
    pencilMoves.forEach((pencilMove) => {
      this.extendStroke({...pencilMove.position, pressure: pencilMove.pressure});
    });
    const pencilUp = events.did("pencil", "ended");
    if (pencilUp != null) {
      this.pencilIsDown = false;
    }
    if (!this.pencilIsDown && this.mode === "unistroke") {
      this.endStroke();
    }
  }
  startStroke(point) {
    this.points = [point];
    this.dirty = true;
  }
  extendStroke(point) {
    this.points.push(point);
    this.dirty = true;
  }
  endStroke() {
    this.page.addFreehandStroke(this.points);
    this.points = void 0;
    this.dirty = true;
  }
  onAction() {
    if (this.mode === "unistroke") {
      this.mode = "multistroke";
      this.multistrokeModeDotElement = this.svg.addElement("circle", {
        cx: this.buttonX,
        cy: this.buttonY,
        r: 10,
        fill: "white"
      });
    } else {
      this.mode = "unistroke";
      this.multistrokeModeDotElement.remove();
      this.multistrokeModeDotElement = void 0;
    }
  }
  onDeselected() {
    if (this.points != null) {
      this.endStroke();
      this.updatePath();
    }
    super.onDeselected();
    this.mode = "unistroke";
  }
  render() {
    if (!this.dirty) {
      return;
    }
    this.updatePath();
    this.dirty = false;
  }
  updatePath() {
    const path = this.points == null ? "" : generatePathFromPoints(this.points);
    updateSvgElement(this.strokeElement, {d: path});
  }
}
