import {updateSvgElement} from "../Svg.js";
export class Tool {
  constructor(svg, buttonX, buttonY) {
    this.svg = svg;
    this.buttonX = buttonX;
    this.buttonY = buttonY;
    this.isSelected = false;
    this.button = svg.addElement("circle", {cx: buttonX, cy: buttonY, r: 20});
    let text = svg.addElement("text", {
      x: buttonX,
      y: buttonY,
      fill: "#aaa",
      "text-anchor": "middle",
      "font-weight": 200,
      "font-size": 17,
      "alignment-baseline": "central",
      "letter-spacing": -5
    });
    text.textContent = this.constructor.name.toUpperCase();
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
    const pencilDown = events.did("pencil", "began");
    if (pencilDown !== void 0) {
      this.startStroke({...pencilDown.position, ...pencilDown});
    }
    const pencilMoves = events.didAll("pencil", "moved");
    pencilMoves.forEach((pencilMove) => {
      this.extendStroke({...pencilMove.position, ...pencilMove});
    });
    const pencilUp = events.did("pencil", "ended");
    if (pencilUp != null) {
      this.endStroke();
    }
    const fingerDown = events.did("finger", "began");
    if (fingerDown !== void 0) {
      this.startFinger({...fingerDown.position, ...fingerDown});
    }
    const fingerMoves = events.didAll("finger", "moved");
    fingerMoves.forEach((fingerMove) => {
      this.moveFinger({...fingerMove.position, ...fingerMove});
    });
    const fingerUp = events.did("finger", "ended");
    if (fingerUp != null) {
      this.endFinger();
    }
  }
  startStroke(point) {
  }
  extendStroke(point) {
  }
  endStroke() {
  }
  startFinger(point) {
  }
  moveFinger(point) {
  }
  endFinger() {
  }
  render(_svg) {
  }
  refreshButton() {
    updateSvgElement(this.button, {fill: this.isSelected ? "black" : "lightgrey"});
  }
}
