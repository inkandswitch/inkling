import { Position } from "../../lib/types";

import QDollarRecognizer from '../../lib/qdollar'
import WritingRecognizerChars from './WritingRecognizerChars'

export default class WritingRecognizer {
  //@ts-ignore
  qdollar: any = new QDollarRecognizer();

  constructor (){
    WritingRecognizerChars.forEach(gesture=>{
      this.qdollar.AddGestureLoad(gesture.name, gesture.strokes);
    })
  }

  recognize(strokes: Array<Array<Position>>){
    const r = this.qdollar.RecognizeStrokes(strokes);
    
    const isNumeric = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(r.Name) > -1;
    
    r.isNumeric = isNumeric;

    return r;
  }

}