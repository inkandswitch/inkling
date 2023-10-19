import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';
import SVG from '../Svg';
import Stroke, { aStroke } from '../ink/Stroke';
import WritingRecognizer from '../recognizers/WritingRecognizer';
import { signedDistanceToBox } from '../../lib/SignedDistance';

const writingRecognizer = new WritingRecognizer();

export default class WritingCell extends GameObject {
  width = 24;
  height = 30;
  position: Position = { x: 100, y: 100 };
  timer: number | null = null;

  stringValue = '';

  protected readonly svgCell = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    class: 'formula-editor-cell',
  });

  render(dt: number, t: number): void {
    // Update timer
    if (this.timer) {
      this.timer -= dt;
      if (this.timer < 0) {
        this.recognizeStrokes();
        this.timer = null;
      }
    }

    SVG.update(this.svgCell, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
    });
  }

  captureStroke(stroke: Stroke) {
    this.adopt(stroke);
    this.timer = 0.5;
  }

  recognizeStrokes() {
    const strokes = this.findAll({ what: aStroke }).map(s => s.points);
    if (strokes.length === 0) {
      return;
    }

    const result = writingRecognizer.recognize(strokes);
    this.stringValue = result.Name;

    // Remember stroke data if we want to add it to the library
    //this.strokeData = strokes;

    // Clean up strokes that have been recognized
    this.children.forEach(child => {
      child.remove();
    });
  }

  distanceToPoint(point: Position) {
    return signedDistanceToBox(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      point.x,
      point.y
    );
  }

  remove() {
    this.svgCell.remove();
    super.remove();
  }
}

export const aWritingCell = (gameObj: GameObject) =>
  gameObj instanceof WritingCell ? gameObj : null;
