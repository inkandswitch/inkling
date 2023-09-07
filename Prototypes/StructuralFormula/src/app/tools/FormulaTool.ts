import Vec from '../../lib/vec';
import { PositionWithPressure } from '../../lib/types';
import Page from '../Page';
import Tool from './Tool';
import Stroke from '../strokes/Stroke';
import QDollarRecognizer from '../../lib/qdollar.js'
import SVG from '../Svg';
import formulaChars from "./FormulaToolChars.ts"

export default class FormulaTool extends Tool<Stroke> {
  tokenStrokes: Array<Stroke> = new Array();
  recognizer = new QDollarRecognizer();
  time = 0;
  recognizedTime = -1;
  recognized = null;
  recognizing = false;
  
  initGestures: any[] = formulaChars;
  

  value: any[] = [
    // {type: "number", value: "200"},
    // {type: "op", value: "+"},
    // {type: "number", value: "14"},
    // {type: "op", value: "="},
    // {type: "number", value: "214"},
  ];
  

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page, Stroke);

    this.initGestures.forEach(gesture=>{
      this.recognizer.AddGestureLoad(gesture.name, gesture.strokes)
    })

    window.addGesture = (name: string)=>{
      this.recognizer.AddGestureStokes(name, this.tokenStrokes)

      let gesture = {
        name, strokes: this.tokenStrokes.map(stroke=>{
          return stroke.points.map(pt=>{
            return {x: pt.x, y: pt.y}
          })
        })
      }

      // Normallize Points
      let total = gesture.strokes.reduce((acc, st)=>{
        return Vec.add(
          st.reduce((acc, v)=>Vec.add(acc, v), Vec(0,0)),
          acc
        )
      }, Vec(0,0))
      let totalLen = gesture.strokes.reduce((acc, st)=>acc+st.length, 0)
      let midPoint = Vec.divS(total, totalLen)

      gesture.strokes = gesture.strokes.map(st=>{
        return st.map(pt=>Vec.sub(pt, midPoint))
      })

      

      this.initGestures.push(gesture);
    }

    window.PrintGestures = ()=>{
      console.log(JSON.stringify(this.initGestures));  
    }
  }

  startStroke(point: PositionWithPressure) {
    super.startStroke(point);
  }

  extendStroke(point: PositionWithPressure) {
    super.extendStroke(point);
  }

  endStroke(): void {
    console.log(this.tokenStrokes);
    if(this.recognizing == false) {
      this.tokenStrokes = []
      this.recognizing = true;
    }
    this.tokenStrokes.push(this.stroke!);
    this.recognizedTime = this.time;
  }

  render(dt: number, time: number): void {
    // Timed recognition
    this.time = time
    if(this.recognizing && this.time - this.recognizedTime > 0.5 ) {

      let r = this.recognizer.RecognizeStrokes(this.tokenStrokes);
      this.recognized = r;

      if(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(r.Name) > -1) {
        let last = this.value[this.value.length-1]
        if(last && last.type == "number") {
          last.value += r.Name
        } else {
          this.value.push({type: "number", value: r.Name})
        }
      } else {
        this.value.push({type: "op", value: r.Name})
      }
      
      // Remove drawn strokes
      this.tokenStrokes.forEach(stroke=>{
        this.page.removeStroke(stroke);
      })

      //SVG.showStatus(`Recognized: ${this.recognized.map(r=>r.name).join(", ")}`);

      console.log("timeout");
      this.recognizing = false;
    }

    // Rendering
    let totalLength = this.value.reduce((acc, v)=>{
      return acc+v.value.length*20 + 5
    }, 0)

    SVG.now("rect", {
      x: 200 - 15, y: 200 - 25,
      width: totalLength+35, height: 50,
      stroke: "none", fill: "#4A9FC4",
      rx: 10
    })

    
    let offset = Vec(200, 200)
    this.value.forEach((value, i)=>{
      
      if(value.type == "number") {
        SVG.now("rect", {
          x: offset.x - 10, y: offset.y - 20,
          width: value.value.length*20, height: 40,
          stroke: "none", fill: "#3B7E9B",
          rx: 10
        })  
      }

      let tokens = value.value.split('')
      tokens.forEach(token=>{
        this.renderToken(offset, token)
        offset.x += 20
      })

      
      offset.x += 5
      
    })

    



    // for (let i = 0; i < 20; i++) {
    //   SVG.now("rect", {
    //     x: 200 + i*30, y: 200,
    //     width: 20, height: 30,
    //     stroke: "grey", fill: "none"
    //   })  
    // }

    
  }

  renderToken(offset, name: string){
    let strokes = formulaChars.find(s=>s.name == name)!.strokes

    strokes.forEach(stroke=>{
      let offsetStroke = stroke.map(pt=>Vec.add(pt, offset))

      SVG.now("polyline", {
        points: SVG.points(offsetStroke),
        fill: 'none',
        stroke: 'white',
        'stroke-width': 2,
      })
    })
  }


}
