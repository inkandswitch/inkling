import { Position } from '../../lib/types';

import QDollarRecognizer from '../../lib/qdollar';
import WritingRecognizerChars from './WritingRecognizerChars';
import Vec from '../../lib/vec';

export default class WritingRecognizer {
  //@ts-ignore
  qdollar: any = new QDollarRecognizer();

  constructor() {
    WritingRecognizerChars.forEach(gesture => {
      this.qdollar.AddGestureLoad(gesture.name, gesture.strokes);
    });
  }

  recognize(strokes: Array<Array<Position>>) {
    const r = this.qdollar.RecognizeStrokes(strokes);

    const isNumeric =
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].indexOf(r.Name) > -1;

    r.isNumeric = isNumeric;

    return r;
  }

  addGesture(name: string, strokes: Array<Array<Position>>) {
    this.qdollar.AddGestureStrokes(name, strokes);

    // Normalize and store gestures
    let gesture = {
      name,
      strokes: strokes.map(points => {
        return points.map(pt => {
          return { x: pt.x, y: pt.y };
        });
      }),
    };

    // Normallize Points
    let total = gesture.strokes.reduce(
      (acc, st) => {
        return Vec.add(
          st.reduce((acc, v) => Vec.add(acc, v), Vec(0, 0)),
          acc
        );
      },
      Vec(0, 0)
    );
    let totalLen = gesture.strokes.reduce((acc, st) => acc + st.length, 0);
    let midPoint = Vec.divS(total, totalLen);

    gesture.strokes = gesture.strokes.map(st => {
      return st.map(pt => Vec.sub(pt, midPoint));
    });

    // Add to chars
    WritingRecognizerChars.push(gesture);
  }

  printGestures() {
    console.log(JSON.stringify(WritingRecognizerChars));
  }
}
