import { Position } from "../../lib/types";
import Vec from "../../lib/vec";
import SVG from "../Svg";
import Collection from "./Collection";
import COLORS from "./Colors";
import Formula from "./Formula";
import { Label } from "./Scope";
import Token from "./Token";

const SNAPZONE = 40;

export default class LabelToken extends Token {
  type = "label";
  label: Label;
  parent: Collection | Formula | null = null;

  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: this.height/2,
    fill: COLORS.BLUE,
  });

  strokeElements: Array<SVGElement> = [];

  constructor(position: Position, label: Label) {
    super();

    this.position = position;
    this.label = label;


    this.width = label.width + 40;

    this.strokeElements = this.label.strokes.map(stroke=>{
      return SVG.add('polyline', {
        points: SVG.points(stroke), 
        transform: `translate(${this.position.x}, ${this.position.y})`,
        stroke: "white", 
        fill: "none", 
        "stroke-width": 2
      })
    })

    this.updateView();
  }

  updateView(){
    // Update text content
    // Reposition Strokes
    SVG.update(this.boxElement, {
      x: this.position.x, y: this.position.y,
      width: this.width,
    })

    this.strokeElements.forEach(stroke=>{
      SVG.update(stroke, {
        transform: `translate(${this.position.x}, ${this.position.y})`
      })
    })
  }

  isPointSnapping(){
    return
  }
}

