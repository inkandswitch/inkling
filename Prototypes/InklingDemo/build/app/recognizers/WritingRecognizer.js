import QDollarRecognizer from "../../lib/qdollar.js";
import WritingRecognizerChars from "./WritingRecognizerChars.js";
import Vec from "../../lib/vec.js";
export default class WritingRecognizer {
  constructor() {
    this.qdollar = new QDollarRecognizer();
    WritingRecognizerChars.forEach((gesture) => {
      this.qdollar.AddGestureLoad(gesture.name, gesture.strokes);
    });
  }
  recognize(strokes) {
    const r = this.qdollar.RecognizeStrokes(strokes);
    const isNumeric = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(r.Name) > -1;
    r.isNumeric = isNumeric;
    return r;
  }
  addGesture(name, strokes) {
    this.qdollar.AddGestureStrokes(name, strokes);
    let gesture = {
      name,
      strokes: strokes.map((points) => {
        return points.map((pt) => {
          return {x: pt.x, y: pt.y};
        });
      })
    };
    let total = gesture.strokes.reduce((acc, st) => {
      return Vec.add(st.reduce((acc2, v) => Vec.add(acc2, v), Vec(0, 0)), acc);
    }, Vec(0, 0));
    let totalLen = gesture.strokes.reduce((acc, st) => acc + st.length, 0);
    let midPoint = Vec.divS(total, totalLen);
    gesture.strokes = gesture.strokes.map((st) => {
      return st.map((pt) => Vec.sub(pt, midPoint));
    });
    WritingRecognizerChars.push(gesture);
  }
  printGestures() {
    console.log(JSON.stringify(WritingRecognizerChars));
  }
}
