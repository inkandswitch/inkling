import Token from "./Token";
import COLORS from './Colors';
import SVG from '../Svg';
import {Variable} from '../constraints';
import { Position } from "../../lib/types";
import Vec from "../../lib/vec";

export default class LabelToken extends Token {
  variable = new Variable(123);

  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: 3,
    fill: COLORS.BLUE,
  });

  strokeElements: Array<SVGElement> = [];

  constructor(strokeData: Array<Array<Position>>, width: number){
    super();
    this.strokeElements = strokeData.map(stroke=>{
      return SVG.add('polyline', {
        points: SVG.points(stroke), 
        transform: `translate(${this.position.x}, ${this.position.y})`,
        stroke: "white", 
        fill: "none", 
        "stroke-width": 2
      })
    })
    this.width = width;
  }
  
  addChar(char: number) {
    let stringValue = this.variable.value.toString() + char;
    this.variable.value = parseInt(stringValue);
  }

  render(dt: number, t: number): void {
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
}