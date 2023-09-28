import { GameObject } from "../GameObject";
import { Position } from '../../lib/types';
import COLORS from './Colors';
import SVG from '../Svg';

import Formula, { OpToken } from "./Formula"
import Page from "../Page";
import Vec from "../../lib/vec";
import Stroke from "../strokes/Stroke";
import WritingRecognizer from "../recognizers/WritingRecognizer";
import NumberToken from "./NumberToken";
import LabelToken from "./LabelToken";

const PADDING = 3;
const PADDING_BIG = 5;

export default class FormulaEditor extends GameObject {
  formula: WeakRef<Formula> | null = null;

  width: number = 90;
  height: number = 46;
  position: Position = {x: 100, y: 100};

  editWidth: number = 46;
  mode: "default" | "label" = "default";

  recognizer = new WritingRecognizer();

  labelStrokes: Array<WeakRef<Stroke>> = [];

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

  newFormula(){
    const f = new Formula();
    this.page.adopt(f);
    this.formula = new WeakRef(f);

    f.position = Vec.add(this.position, Vec(PADDING, PADDING));
  }

  // STROKE CAPTURE
  captureStroke(stroke: WeakRef<Stroke>) {
    let f = this.formula?.deref();
    let s = stroke.deref();
    if(f != null && s != null) {
      if(this.mode == 'label') {
        this.captureLabelStroke(stroke, f);
      } else {
        const capturePosition = Vec.add(this.position, Vec(f.width + this.editWidth/2, 20))
        let distance = s.distanceToPoint(capturePosition)
        if(distance && distance < 20) {
          console.log("capture", s);
          this.captureRecognizedStroke(s, f);
        }
      }
    }
  }

  captureLabelStroke(stroke: WeakRef<Stroke>, f: Formula){
    this.labelStrokes.push(stroke);
    stroke.deref()!.color = '#FFF'

    let maxX = 0;
      for(const stroke of this.labelStrokes) {
        for(const pt of stroke.deref()!.points) {
          if(pt.x > maxX) {
            maxX = pt.x;
          }
        }
      }
      
      this.editWidth = maxX - (this.position.x + f.width) + 46;
  }

  captureRecognizedStroke(s: Stroke, f: Formula){
    let result = this.recognizer.recognize([s.points]);
    console.log(result);

    let char = result.Name;
    if(result.isNumeric) {
      let lastToken = f.lastToken();
      if(lastToken instanceof NumberToken) {
        lastToken.addChar(char);
      } else {
        f.addToken(new NumberToken(parseInt(char)));
      }
    } else {
      f.addToken(new OpToken(char));
    }
    
    s.remove();
  }

  // TODO: All the derefs are kind of a pain here. But w/e
  addLabelToken(){
    if(this.labelStrokes.length == 0) {
      return;
    }
    // Normalize the stroke positions to the the top corner of the token
    const normalizedStrokes = this.labelStrokes.map(s=>{
      return s.deref()!.points.map(pt=>{
        return Vec.sub(pt, Vec.add(this.position, Vec(this.formula?.deref()?.width!+PADDING*2,+PADDING)));
      })
    });

    let labelToken = new LabelToken(normalizedStrokes, this.editWidth - 46);
    this.formula?.deref()?.addToken(labelToken);
    
    this.labelStrokes.forEach(stroke=>{
      stroke.deref()!.remove();
    })
    this.labelStrokes = [];
  }

  // MODES
  isPositionNearToggle(position: Position){
    return  this.formula &&
            position.x > this.position.x + this.width - 25 &&
            position.y > this.position.y &&
            position.x < this.position.x + this.width &&
            position.y < this.position.y + this.height;
  }

  toggleMode(){
    if(this.mode == "label") {
      this.addLabelToken();
    }

    this.mode = this.mode == "label" ? "default" : "label";
    this.editWidth = 46;
  }

  // Active
  isActive(){
    return this.formula != null;
  }

  activateFromFormula(formula: WeakRef<Formula>){
    this.formula = formula;
  }

  activateFromPosition(position: Position) {
    this.position = position;
    this.newFormula();
  }

  deactivate(){
    let f = this.formula?.deref();
    if(f== null) {
      return
    }
    // Finish off work if we still have something to do
    if(this.mode=="label") {
      this.addLabelToken();
      f.render(0,0);
    }

    // Unwrap if formula only has one child
    if(f.children.size == 0) {
      f.remove();
    }
    if(f.children.size == 1) {
      let child = Array.from(f.children).pop();
      this.page.adopt(child!);
      f.remove();
    } 
    this.formula = null;
    this.mode = 'default';
    this.editWidth = 46;
  }

  render(dt: number, t: number): void {
    let f = this.formula?.deref();
    if(f != null) {

      let offsetWidth = this.editWidth + PADDING_BIG * 2+ PADDING * 6;
      if(this.formula != null) {
        this.position = f.position
        this.width = f.width +offsetWidth
      } else {
        this.width = offsetWidth;
      }

      // Update total wrapper
      SVG.update(this.wrapperElement, {
        x: this.position.x-PADDING_BIG, y: this.position.y-PADDING_BIG,
        width: this.width, height: this.height + PADDING_BIG*2,
        visibility: "visible"
      })

      // Char elements
      let position = Vec.add(this.position, Vec(f.width, 0))
      SVG.update(this.nextCharElement, {
        x: position.x+PADDING, y: this.position.y,
        width: this.editWidth,
        visibility: "visible"
      })
      
      // Toggle
      SVG.update(this.toggleElement, {
        cx: position.x+ this.editWidth + 4*PADDING, cy: this.position.y + this.height/2,
        visibility: "visible"
      })
    } else {
      SVG.update(this.nextCharElement, {visibility: "hidden"});
      SVG.update(this.toggleElement, {visibility: "hidden"});
      SVG.update(this.wrapperElement, {visibility: "hidden"});
    }

    // Mode
    SVG.update(this.toggleElement, {
      fill: this.mode == "label" ? COLORS.GREY_MID : COLORS.BLUE
    });

    SVG.update(this.nextCharElement, {
      fill: this.mode == "label" ? COLORS.BLUE : COLORS.GREY_MID
    });
  }
}