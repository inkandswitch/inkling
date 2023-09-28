import { Position } from "../../lib/types";
import Formula, { OpToken } from "./Formula";
import SVG from "../Svg";
import COLORS from "./Colors";
import Vec from "../../lib/vec";

import WritingRecognizer from "./WritingRecognizer";
import NumberToken from "./NumberToken";
import { Label, Variable } from "./Scope";
import MetaLayer from "./MetaLayer";
import LabelToken from "./LabelToken";

const PADDING = 3;
const PADDING_BIG = 5;

export default class FormulaEditor {
  recognizer = new WritingRecognizer();
  formula: Formula | null = null;

  width: number = 90;
  height: number = 46;
  position: Position = {x: 100, y: 100};

  strokes: Array<Array<Position>> = [];
  strokeElements: Array<SVGElement> = [];
  editWidth: number = 46;
  
  // State
  active: boolean = false;
  mode: "default" | "label" = "default";

  constructor(private metaLayer: MetaLayer){}
  
  // SVG Elements
  protected wrapperElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.height, height: this.height,
    rx: 3,
    fill: COLORS.GREY_BRIGHT,
    stroke: "rgba(0,0,0,0.2)",
    "stroke-width": 0.3,
    visibility: "hidden"
  });

  protected nextCharElement = SVG.add('rect', {
    x: this.position.x+this.width+PADDING, y: this.position.y,
    width: this.height, height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
    visibility: "hidden"
  });

  protected toggleElement = SVG.add('circle', {
    cx: this.position.x, cy: this.position.y,
    r: 5,
    fill: COLORS.BLUE,
    visibility: "hidden"
  });

  updateView(){
    if(this.active) {

      let offsetWidth = this.editWidth + PADDING_BIG * 2+ PADDING * 6;
      if(this.formula != null) {
        this.position = this.formula.position;
        this.width = this.formula.width +offsetWidth;
      } else {
        this.width = offsetWidth;
      }
      
      
      // Update total wrapper
      SVG.update(this.wrapperElement, {
        x: this.position.x-PADDING_BIG, y: this.position.y-PADDING_BIG,
        width: this.width, height: this.height + PADDING_BIG*2,
        visibility: "visible"
      });

      // Char elements
      let position = Vec.add(this.position, Vec(this.formula ? this.formula.width : 0, 0))
      SVG.update(this.nextCharElement, {
        x: position.x+PADDING, y: this.position.y,
        width: this.editWidth,
        visibility: "visible"
      });
      
      // Toggle
      SVG.update(this.toggleElement, {
        cx: position.x+ this.editWidth + 4*PADDING, cy: this.position.y + this.height/2,
        visibility: "visible"
      });
    } else {
      SVG.update(this.nextCharElement, {visibility: "hidden"});
      SVG.update(this.toggleElement, {visibility: "hidden"});
      SVG.update(this.wrapperElement, {visibility: "hidden"});
    }
    
    // Label stuff
    SVG.update(this.toggleElement, {
      fill: this.mode == "label" ? COLORS.GREY_MID : COLORS.BLUE
    });

    SVG.update(this.nextCharElement, {
      fill: this.mode == "label" ? COLORS.BLUE : COLORS.GREY_MID
    });
  }

  isPointInside(position: Position): boolean {
    return this.active &&
           position.x > this.position.x &&
           position.y > this.position.y &&
           position.x < this.position.x + this.width &&
           position.y < this.position.y + this.height;
  }

  isToggleMode(position: Position): boolean {
    return this.active &&
           position.x > this.position.x + this.width - 25 &&
           position.y > this.position.y &&
           position.x < this.position.x + this.width &&
           position.y < this.position.y + this.height;
  }

  activate(position: Position){
    this.position = position;
    this.active = true;
    this.strokes = [];
    this.formula = null;
    this.updateView();
  }

  close(){
    this.active = false;
    if(this.mode == 'label') {
      console.log("make label");
      this.makeLabelFromStrokes();
    }
    this.strokes = [];
    this.strokeElements.forEach(se=>se.remove());
    this.updateView();
  }

  toggleMode(){
    this.mode = this.mode == "label" ? "default" : "label";
    this.updateView();
  }

  // Writing in the box
  addStroke(position: Position) {
    this.strokes.push([
      position
    ]);

    this.strokeElements.push(SVG.add('polyline', {points: "", stroke: "black", fill: "none", "stroke-width": 2}));
  }

  addStrokePoint(position: Position){
    let last = this.strokes[this.strokes.length-1];
    last.push(position);

    let lastElement = this.strokeElements[this.strokeElements.length-1];
    SVG.update(lastElement, {
      points: SVG.points(last)
    });
  }

  endStroke(layer: MetaLayer){
    if(this.mode == "default") {
      this.parseStrokes(layer);
    } else {
      let maxX = 0;
      for(const stroke of this.strokes) {
        for(const pt of stroke) {
          if(pt.x > maxX) {
            maxX = pt.x;
          }
        }
      }
      
      this.editWidth = maxX - this.position.x + 46;
      this.updateView();
    }
  }

  makeLabelFromStrokes() {
    let label = new Label(this.strokes);
    let token = new LabelToken(this.position,label);
    this.metaLayer.tokens.push(token);
  }

  parseStrokes(layer: MetaLayer){
    let r = this.recognizer.recognize(this.strokes);
    let char = r.Name
    if(this.formula == null) {
      this.formula = new Formula();
      this.formula.position = this.position;
    }

    const isNumeric = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(char) > -1;
    
    if(isNumeric) {
      let lastToken = this.formula.lastToken();
      if(lastToken && lastToken.type == "number") {
        (lastToken as NumberToken).addChar(char);
      } else {
        let n = layer.addNumberToken(this.formula.position, parseInt(char))
        this.formula.addToken(n);
      }
    } else {
      let n = new OpToken(char);
      this.formula.addToken(n);
    }

    this.strokes = [];
    this.strokeElements.forEach(s=>s.remove());
    this.strokeElements = [];

    this.formula.updateView();
    this.updateView();
  }
}