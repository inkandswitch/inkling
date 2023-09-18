import { Position } from "../../lib/types";

import QDollarRecognizer from '../../lib/qdollar.js'
import WritingRecognizerChars from './WritingRecognizerChars'

export default class WritingRecognizer {
  qdollar = new QDollarRecognizer();

  constructor (){
    WritingRecognizerChars.forEach(gesture=>{
      this.qdollar.AddGestureLoad(gesture.name, gesture.strokes)
    })
  }

  recognize(strokes: Array<Array<Position>>){
    const r = this.qdollar.RecognizeStrokes(strokes);
    return r;
  }

}