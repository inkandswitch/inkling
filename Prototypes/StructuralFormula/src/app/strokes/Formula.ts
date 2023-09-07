import Vec, { Vector } from '../../lib/vec';
import SVG from '../Svg';
import formulaChars from "../tools/FormulaToolChars"
import { Position } from '../../lib/types';
import * as constraints from '../constraints';


const HEIGHT = 50;
const CHARWIDTH = 35;
const MARGIN = 5;
const TOKEN_MIDDLE = Vec(CHARWIDTH/2, HEIGHT/2)

export type FormulaToken = FormulaNumber | FormulaOp;

export default class Formula { 

  expressionWidthInChars = 0;
  emptySpaceInChars = 2;
  animatedWidthInChars = 2;

  tokens: Array<FormulaToken> = new Array();

  active: boolean = true;


  constructor(private position: Position) {
    this.addChar("1")
    this.addChar("5")
    this.addChar("+")
    this.addChar("1")
    this.addChar("5")
    this.addChar("=")
    this.addChar("3")
    this.addChar("0")

    let a = this.tokens[0].constraintVariable;
    let b = this.tokens[2].constraintVariable;
    let c = this.tokens[4].constraintVariable;

    console.log(a, b, c);
    
    const aPlusB = constraints.formula([a, b], ([a, b]) => a + b).variables.result;
    constraints.equals(c, aPlusB);
  }

  addChar(char: string){
    const isNumeric = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(char) > -1;
    let newPosition = Vec.clone(this.position)
    if(this.tokens.length > 0) {
      let lastToken = this.tokens[this.tokens.length-1]
      newPosition.x = lastToken.position.x + lastToken.width
    }

    if(isNumeric) {
      const lastToken = this.tokens[this.tokens.length-1];

      if(lastToken && lastToken.type == "number") {
        (lastToken as FormulaNumber).addChar(char);
      } else {
        this.tokens.push(new FormulaNumber(newPosition, char));
      }
    } else {
      this.tokens.push(new FormulaOp(newPosition, char));
    }

    this.expressionWidthInChars += 1;
  }

  increaseSpace(widthInPix: number){
    this.emptySpaceInChars = (widthInPix / CHARWIDTH) + 2;
  }

  findTokenNear(position: Position) {
    for(const token of this.tokens) {
      if(token.isInside(position)) {
        return token
      }
    }
  }

  render(dt: number, time: number){
    // Update loop
    this.tokens.forEach(token=>{
      if(token.type == "number") {
        token.updateLoop();
      }
    })

    // Reflow
    let offsetPosition = Vec.clone(this.position)
    this.tokens.forEach(token=>{
      token.position = Vec.clone(offsetPosition)
      offsetPosition.x += token.width
    })


    const fullWidthInChars = this.expressionWidthInChars + this.emptySpaceInChars;
    if(this.animatedWidthInChars < fullWidthInChars) {
      this.animatedWidthInChars += dt * 5;
    } else {
      this.animatedWidthInChars = fullWidthInChars;
    }

    let fullWidth = CHARWIDTH * this.animatedWidthInChars;

    SVG.now("rect", {
      x: this.position.x, y: this.position.y,
      width: fullWidth, height: HEIGHT,
      stroke: "none", fill: "#D8E2E4",
      rx: 6
    })

    SVG.now("rect", {
      x: this.position.x+MARGIN + (fullWidth - this.emptySpaceInChars * CHARWIDTH), y: this.position.y+MARGIN,
      width: this.emptySpaceInChars*CHARWIDTH - MARGIN*2, height: HEIGHT - MARGIN*2,
      stroke: "none", fill: "white",
      rx: 4
    })

    let offset = Vec.clone(this.position)
    
    this.tokens.forEach(token=>{
      //token.updatePosition();
      token.render();
    })
  }
}

export class FormulaNumber {
  type = "number";
  stringValue: string = "";
  numericValue: number | null = null;
  width = 0;
  constraintVariable: constraints.Variable = constraints.variable(5);

  constructor(public position: Position, char: string){
    this.addChar(char);
  }

  addChar(char: string){
    this.stringValue += char;
    let tokens = this.stringValue.split("");
    this.width = tokens.length*(CHARWIDTH);

    this.numericValue = parseInt(this.stringValue);
    this.constraintVariable.value = this.numericValue;
  }

  updateValue(value: number){
    this.numericValue = Math.round(Math.abs(value));
    this.stringValue = this.numericValue.toString();
    let tokens = this.stringValue.split("");
    this.width = tokens.length*(CHARWIDTH);
    this.constraintVariable.value = this.numericValue;
  }

  isInside(position: Position) {
    return  position.x > this.position.x &&
            position.y > this.position.y &&
            position.x < this.position.x+this.width &&
            position.y < this.position.y+HEIGHT
  }

  updateLoop(){
    if(this.constraintVariable.value != this.numericValue) {
      this.updateValue(this.constraintVariable.value)
    }
  }

  render(){
    let tokens = this.stringValue.split("")
    let offset = Vec.clone(this.position);
    
    SVG.now("rect", {
      x: offset.x + MARGIN, y: offset.y + MARGIN,
      width: this.width, height: HEIGHT - MARGIN*2,
      stroke: "none", fill: "#1878EA",
      rx: 4
    })

    tokens.forEach(char=>{
      let charOffset = Vec.add(offset, TOKEN_MIDDLE)
      renderChar(charOffset, char, "white")
      offset.x += (CHARWIDTH)
    })
  }
}

export class FormulaOp {
  type = "op";
  stringValue: string = "";
  width = CHARWIDTH;

  constructor(public position: Position, char: string){
    this.stringValue = char;
  }

  isInside(position: Position) {
    return  position.x > this.position.x &&
            position.y > this.position.y &&
            position.x < this.position.x+this.width &&
            position.y < this.position.y+HEIGHT
  }

  render(){
    let offset = Vec.clone(this.position);
    let charOffset = Vec.add(offset, TOKEN_MIDDLE)
    renderChar(charOffset, this.stringValue, "black")
  }
}

function renderChar(offset: Vector, name: string, color: string = 'black'){
  let strokes = formulaChars.find(s=>s.name == name)!.strokes

  strokes.forEach(stroke=>{
    let offsetStroke = stroke.map(pt=>Vec.add(pt, offset))

    SVG.now("polyline", {
      points: SVG.points(offsetStroke),
      fill: 'none',
      stroke: color,
      'stroke-width': 2,
    })
  })
}