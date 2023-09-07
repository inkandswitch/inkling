import Vec, { Vector } from '../../lib/vec';
import SVG from '../Svg';
import formulaChars from "../tools/FormulaToolChars"
import { Position } from '../../lib/types';


interface FormulaToken {
  type: ("number" | "op"),
  value: string
}

export default class Formula {
  position: Position;
  tokens = new Array<FormulaToken>()

  constructor(position: Position){
    this.position = position;
  }

  addToken(token: FormulaToken) {
    this.tokens.push(token)
  }

  addChar(char: string) {
    const isNumeric = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(char) > -1;

    if(isNumeric) {
      const lastToken = this.tokens[this.tokens.length-1]

      if(lastToken && lastToken.type == "number") {
        lastToken.value += char
      } else {
        this.tokens.push({type: "number", value: char})
      }
    } else {
      this.tokens.push({type: "op", value: char})
    }
  }

  render() {
    let offset = Vec.clone(this.position)
    this.tokens.forEach((value, i)=>{
      
      if(value.type == "number") {
        SVG.now("rect", {
          x: offset.x - 10, y: offset.y - 20,
          width: value.value.length*20, height: 40,
          stroke: "none", fill: "#DAE1E5",
          rx: 5
        })  
      }

      let tokens = value.value.split('')
      tokens.forEach(token=>{
        this.renderToken(offset, token, "black")
        offset.x += 20
      })

      
      offset.x += 5
      
    })

  }

  renderToken(offset: Vector, name: string, color: string){
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
}