import Vec from '../../lib/vec';
import { PositionWithPressure } from '../../lib/types';
import Page from '../Page';
import Tool from './Tool';
import Stroke from '../strokes/Stroke';
import QDollarRecognizer from '../../lib/qdollar.js'
import SVG from '../Svg';

export default class FormulaTool extends Tool<Stroke> {
  tokenStrokes: Array<Stroke> = new Array();
  recognizer = new QDollarRecognizer();
  time = 0;
  recognizedTime = -1;
  recognized = null;
  recognizing = false;
  
  initGestures = [];
  

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page, Stroke);

    this.initGestures.forEach(gesture=>{
      this.recognizer.AddGestureLoad(gesture.name, gesture.strokes)
    })
    

    window.addGesture = (name)=>{
      this.recognizer.AddGestureStokes(name, this.tokenStrokes)
      this.initGestures.push({
        name, strokes: this.tokenStrokes.map(stroke=>{
          return stroke.points.map(pt=>{
            return {x: pt.x, y: pt.y}
          })
        })
      })
    }
    window.PrintGestures = ()=>{
      
      console.log(JSON.stringify(this.initGestures));
      
      // let text = this.recognizer.PointClouds.map(cloud=>{
      //   let points = cloud.Points.map(pt=>{
      //     return `new PointFromStorage(${pt.X}, ${pt.X}, ${pt.ID}, ${pt.IntX}, ${pt.IntY})`
      //   }).join(",")

      //   return `new PointCloudFromStorage("${cloud.Name}", new Array(${points}))`
      // }).join(",\n")
        
      // console.log(text);
      
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
    this.time = time
    if(this.recognizing && this.time - this.recognizedTime > 0.5 ) {

      let r = this.recognizer.RecognizeStokes(this.tokenStrokes);
      this.recognized = r.Name;

      SVG.showStatus(`Recognized: ${this.recognized}`);

      console.log("timeout");
      this.recognizing = false;
    }
  }
}
