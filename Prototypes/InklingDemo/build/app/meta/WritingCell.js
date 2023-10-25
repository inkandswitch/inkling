import {GameObject} from "../GameObject.js";
import SVG from "../Svg.js";
import {aStroke} from "../ink/Stroke.js";
import WritingRecognizer from "../recognizers/WritingRecognizer.js";
import {signedDistanceToBox} from "../../lib/SignedDistance.js";
const writingRecognizer = new WritingRecognizer();
export default class WritingCell extends GameObject {
  constructor() {
    super(...arguments);
    this.width = 24;
    this.height = 30;
    this.position = {x: 100, y: 100};
    this.timer = null;
    this.stringValue = "";
    this.svgCell = SVG.add("rect", SVG.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "formula-editor-cell"
    });
  }
  render(dt, t) {
    if (this.timer) {
      this.timer -= dt;
      if (this.timer < 0) {
        this.recognizeStrokes();
        this.timer = null;
      }
    }
    SVG.update(this.svgCell, {
      x: this.position.x,
      y: this.position.y,
      width: this.width
    });
  }
  captureStroke(stroke) {
    this.adopt(stroke);
    this.timer = 0.5;
  }
  recognizeStrokes() {
    const strokes = this.findAll({what: aStroke}).map((s) => s.points);
    if (strokes.length === 0) {
      return;
    }
    const result = writingRecognizer.recognize(strokes);
    this.stringValue = result.Name;
    this.children.forEach((child) => {
      child.remove();
    });
  }
  distanceToPoint(point) {
    return signedDistanceToBox(this.position.x, this.position.y, this.width, this.height, point.x, point.y);
  }
  remove() {
    this.svgCell.remove();
    for (const child of this.children) {
      child.remove();
    }
    super.remove();
  }
}
export const aWritingCell = (gameObj) => gameObj instanceof WritingCell ? gameObj : null;
