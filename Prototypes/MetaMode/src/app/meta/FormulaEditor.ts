import { Position } from "../../lib/types";
import Formula from "./Formula";
import SVG from "../Svg";
import COLORS from "./Colors";
import Vec from "../../lib/vec";

const PADDING = 3;
const PADDING_BIG = 5;

export default class FormulaEditor {
  formula: Formula | null = null;

  width: number = 90;
  height: number = 46;
  position: Position = {x: 100, y: 100};
  
  // State
  active: boolean = true;
  mode: "default" | "label" = "default";
  
  // SVG Elements
  protected wrapperElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.height, height: this.height,
    rx: 3,
    fill: COLORS.GREY_BRIGHT,
    stroke: "rgba(0,0,0,0.2)",
    "stroke-width": 0.3,
  });

  protected nextCharElement = SVG.add('rect', {
    x: this.position.x+this.width+PADDING, y: this.position.y,
    width: this.height, height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  protected toggleElement = SVG.add('circle', {
    cx: this.position.x, cy: this.position.y,
    r: 5,
    fill: COLORS.BLUE,
  });

  updateView(){
    if(this.active && this.formula != null) {
      this.position = this.formula.position
      this.width = this.formula.width
      
      // Update total wrapper
      SVG.update(this.wrapperElement, {
        x: this.position.x-PADDING_BIG, y: this.position.y-PADDING_BIG,
        width: this.width+this.height + PADDING_BIG * 2+ PADDING*6, height: this.height + PADDING_BIG*2,
        visibility: ""
      })

      // Char elements
      let position = Vec.add(this.position, Vec(this.width, 0))
      SVG.update(this.nextCharElement, {
        x: position.x+PADDING, y: this.position.y,
        visibility: ""
      })
      
      // Toggle
      SVG.update(this.toggleElement, {
        cx: position.x+ this.height + 4*PADDING, cy: this.position.y + this.height/2,
        visibility: ""
      })

    } else {
      SVG.update(this.nextCharElement, {visibility: "hidden"});
      SVG.update(this.toggleElement, {visibility: "hidden"});
      SVG.update(this.wrapperElement, {visibility: "hidden"});
    }
    
    // label stuff
    SVG.update(this.toggleElement, {
      fill: this.mode == "label" ? COLORS.GREY_MID : COLORS.BLUE
    })
    SVG.update(this.nextCharElement, {
      fill: this.mode == "label" ? COLORS.BLUE : COLORS.GREY_MID
    })
  }
}