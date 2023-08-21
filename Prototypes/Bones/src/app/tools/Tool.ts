import { PositionWithPressure, PositionWithRadius } from "../../lib/types";
import Events, { FingerEvent, PencilEvent } from "../NativeEvents";
import SVG, { updateSvgElement } from "../Svg";

export class Tool {
  button: SVGElement;
  isSelected = false;

  constructor(public svg: SVG, public buttonX: number, public buttonY: number) {
    this.button = svg.addElement("circle", { cx: buttonX, cy: buttonY, r: 20 });
    let text = svg.addElement("text", {
      x: buttonX,
      y: buttonY,
      fill: "#aaa",
      "text-anchor": "middle",
      "font-weight": 200,
      "font-size": 17,
      "alignment-baseline": "central",
      "letter-spacing": -5,
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
    // no op by default, but can be overridden by subclass
  }

  onDeselected() {
    this.isSelected = false;
    this.refreshButton();
  }

  update(events: Events) {
    const pencilDown = events.did("pencil", "began") as PencilEvent | undefined;
    if (pencilDown !== undefined) {
      this.startStroke({ ...pencilDown.position, ...pencilDown });
    }

    const pencilMoves = events.didAll("pencil", "moved") as PencilEvent[];
    pencilMoves.forEach((pencilMove) => {
      this.extendStroke({ ...pencilMove.position, ...pencilMove });
    });

    const pencilUp = events.did("pencil", "ended");
    if (pencilUp != null) {
      this.endStroke();
    }

    const fingerDown = events.did("finger", "began") as FingerEvent | undefined;
    if (fingerDown !== undefined) {
      this.startFinger({ ...fingerDown.position, ...fingerDown });
    }

    const fingerMoves = events.didAll("finger", "moved") as FingerEvent[];
    fingerMoves.forEach((fingerMove) => {
      this.moveFinger({ ...fingerMove.position, ...fingerMove });
    });

    const fingerUp = events.did("finger", "ended");
    if (fingerUp != null) {
      this.endFinger();
    }
  }

  startStroke(point: PositionWithPressure) {}
  extendStroke(point: PositionWithPressure) {}
  endStroke() {}

  startFinger(point: PositionWithRadius) {}
  moveFinger(point: PositionWithRadius) {}
  endFinger() {}

  render(_svg: SVG) {
    // no op by default, but can be overridden by subclass
  }

  private refreshButton() {
    updateSvgElement(this.button, { fill: this.isSelected ? "black" : "lightgrey" });
  }
}
