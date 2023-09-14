import SVG from "../Svg.js";
import FreehandStroke from "../strokes/FreehandStroke.js";
import Tool from "./Tool.js";
export default class FreehandTool extends Tool {
  constructor(label, buttonX, buttonY, page) {
    super(label, buttonX, buttonY, page, FreehandStroke);
    this.modeInfo = {mode: "unistroke"};
  }
  startStroke(point) {
    super.startStroke(point);
    if (this.modeInfo.mode === "multistroke") {
      this.modeInfo.accumulatedStrokes.push(this.stroke);
    }
  }
  onAction() {
    this.toggleModes();
  }
  onDeselected() {
    super.onDeselected();
    this.setMode("unistroke");
  }
  toggleModes() {
    this.setMode(this.modeInfo.mode === "unistroke" ? "multistroke" : "unistroke");
  }
  setMode(mode) {
    switch (mode) {
      case "multistroke":
        if (this.modeInfo.mode !== "multistroke") {
          this.modeInfo = {
            mode: "multistroke",
            accumulatedStrokes: [],
            multistrokeModeDotElement: SVG.add("circle", {
              cx: this.buttonX,
              cy: this.buttonY,
              r: 17,
              stroke: "#fff",
              fill: "none"
            })
          };
        }
        break;
      case "unistroke":
        if (this.modeInfo.mode !== "unistroke") {
          this.addStrokeGroupForAccumulatedStrokes(this.modeInfo.accumulatedStrokes);
          this.modeInfo.multistrokeModeDotElement.remove();
          this.modeInfo = {mode: "unistroke"};
        }
        break;
      default:
        throw new Error("unsupported mode: " + mode);
    }
  }
  addStrokeGroupForAccumulatedStrokes(accumulatedStrokes) {
    accumulatedStrokes = accumulatedStrokes.filter((stroke) => !stroke.group);
    if (accumulatedStrokes.length > 0) {
      this.page.addStrokeGroup(new Set(accumulatedStrokes));
    }
  }
}
