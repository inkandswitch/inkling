import {updateSvgElement} from "../Svg.js";
export class Tool {
  constructor(svg, buttonX, buttonY) {
    this.buttonX = buttonX;
    this.buttonY = buttonY;
    this.isSelected = false;
    this.button = svg.addElement("circle", {cx: buttonX, cy: buttonY, r: 20});
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
  update(_events) {
  }
  render(_svg) {
  }
  refreshButton() {
    updateSvgElement(this.button, {fill: this.isSelected ? "black" : "lightgrey"});
  }
}
