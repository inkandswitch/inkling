import SVG from "../Svg.js";
export default class Tool {
  constructor(label, buttonX, buttonY, page, strokeClass) {
    this.buttonX = buttonX;
    this.buttonY = buttonY;
    this.page = page;
    this.strokeClass = strokeClass;
    this.isSelected = false;
    this.button = SVG.add("circle", {cx: buttonX, cy: buttonY, r: 20});
    SVG.add("text", {x: buttonX, y: buttonY, class: "tool", content: label});
    this.refreshButton();
  }
  onSelected() {
    if (this.isSelected) {
      this.onAction();
    } else {
      this.isSelected = true;
      this.refreshButton();
    }
  }
  onAction() {
  }
  onDeselected() {
    this.isSelected = false;
    this.refreshButton();
  }
  update(events) {
    const pencilDown = events.find("pencil", "began");
    if (pencilDown) {
      this.startStroke({...pencilDown.position, ...pencilDown});
    }
    const pencilMoves = events.findAll("pencil", "moved");
    if (this.stroke) {
      pencilMoves.forEach((pencilMove) => {
        this.extendStroke({...pencilMove.position, ...pencilMove});
      });
    }
    const pencilUp = events.find("pencil", "ended");
    if (pencilUp && this.stroke) {
      this.endStroke();
    }
    const fingerDown = events.find("finger", "began");
    if (fingerDown) {
      this.startFinger({...fingerDown.position, ...fingerDown});
    }
    const fingerMoves = events.findAll("finger", "moved");
    fingerMoves.forEach((fingerMove) => {
      this.moveFinger({...fingerMove.position, ...fingerMove});
    });
    const fingerUp = events.find("finger", "ended");
    if (fingerUp) {
      this.endFinger();
    }
  }
  startStroke(point) {
    if (this.strokeClass) {
      this.stroke = this.page.addStroke(new this.strokeClass([point]));
    }
  }
  extendStroke(point) {
    this.page.onstrokeUpdated(this.stroke);
    this.stroke.points.push(point);
  }
  endStroke() {
    this.page.onstrokeUpdated(this.stroke);
    this.stroke = void 0;
  }
  startFinger(_point) {
  }
  moveFinger(_point) {
  }
  endFinger() {
  }
  render() {
  }
  refreshButton() {
    SVG.update(this.button, {
      fill: this.isSelected ? "black" : "lightgrey"
    });
  }
}
