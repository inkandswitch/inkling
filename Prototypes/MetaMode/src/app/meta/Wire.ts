import { Position } from "../../lib/types"
import NumberToken from "./NumberToken"
import SVG from "../Svg";
import COLORS from "./Colors";
import Vec from "../../lib/vec";

export default class Wire {
  input: NumberToken | null = null;
  output: NumberToken | null = null;
  
  points: Array<Position> = new Array();
  offsets: Array<'v'|'h'|'?'> = new Array();
  
  protected wireElement = SVG.add('polyline', { 
    points: "",
    stroke: COLORS.BLUE,
    fill: "none"
  });

  constructor (position: Position) {
    this.points = [Vec.clone(position), Vec.clone(position)];
    this.offsets = ['?']
  }

  drawPoint(position: Position){
    
    this.points[this.points.length-1] = position;

    let currentOffset = this.offsets[this.offsets.length-1]
    let a = this.points[this.points.length-1]
    let b = this.points[this.points.length-2]
    if(currentOffset == 'v') {
      if(Math.abs(a.x - b.x) > 10) {
        this.points.push(position)
        this.offsets.push('h')
      }
      a.x = b.x
    } else if(currentOffset == 'h') {
      if(Math.abs(a.y - b.y) > 10) {
        this.points.push(position)
        this.offsets.push('v')
      }
      a.y = b.y
    } else {
      if(Vec.dist(a, b) > 5) {
        if(Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
          this.offsets[this.offsets.length-1] = 'h'
        } else {
          this.offsets[this.offsets.length-1] = 'v'
        }
      }
    }
    
    this.updateView();
  }

  updateView(){
    SVG.update(this.wireElement, {
      points: SVG.points(this.points)
    })
  }
}