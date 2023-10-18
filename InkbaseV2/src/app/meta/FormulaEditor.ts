import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';
import SVG from '../Svg';
import Stroke, { aStroke } from '../ink/Stroke';
import Vec from '../../lib/vec';
import Rect from '../../lib/rect';

import WritingRecognizer from '../recognizers/WritingRecognizer';
import FormulaParser from './FormulaParser';
import { signedDistanceToBox } from '../../lib/SignedDistance';
import { boundingBoxFromStrokes } from '../../lib/bounding_box';

const PADDING = 2;

const writingRecognizer = new WritingRecognizer();

export default class FormulaEditor extends GameObject {
  width = 200;
  height = 44;
  position: Position = { x: 100, y: 100 };

  formulaParser: FormulaParser | null = null;

  active = false;

  // SVG
  protected readonly svgBackgroundElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    visibility: 'hidden',
    class: 'formula-editor',
  });

  protected readonly svgCellElements: Array<SVGElement> = [];

  constructor() {
    super();
  }

  isActive() {
    return this.active;
  }

  activateFromFormula() {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addLabelTokenFromExisting(_: any) {}

  activateFromPosition(position: Position) {
    this.position = position;
    this.adopt(new FormulaEditorCell());
    this.adopt(new FormulaEditorCell());
    this.adopt(new FormulaEditorCell());
    this.adopt(new FormulaEditorCell());
    this.adopt(new FormulaEditorCell());
    this.active = true;
  }

  deactivate() {
    for (const child of this.children) {
      child.remove();
    }

    this.active = false;
  }

  captureStroke(stroke: Stroke) {
    for (const cell of this.findAll({ what: aFormulaEditorCell })) {
      if (cell.captureStroke(stroke)) {
        this.recognizeStrokes(cell);
        return;
      }
    }
  }

  // Attempt to regcognize strokes on all the cells except the most recent one
  // (The user may be still want to add more strokes on that one)
  recognizeStrokes(exceptCell?: FormulaEditorCell) {
    for (const cell of this.findAll({ what: aFormulaEditorCell })) {
      if (cell !== exceptCell) {
        cell.recognizeStrokes();
      }
    }
    this.refresh();
  }

  refresh() {
    this.ensureEmptySpace();
    //TODO: this is where we potentially do syntax highlighting
    // But we've punted on that for now.

    // If the last character is an equals sign, we parse and close the editor
    const lastChar = this.lastCharacter();
    if (lastChar?.stringValue === '=') {
      this.parseFormulaAndClose();
    }
  }

  lastCharacter() {
    const cells = this.findAll({ what: aFormulaEditorCell });

    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].stringValue !== '') {
        return cells[i];
      }
    }

    return null;
  }

  ensureEmptySpace() {
    // make sure there are at least two empty cells at the end
    const cells = this.findAll({ what: aFormulaEditorCell });
    for (let i = 1; i < 3; i++) {
      if (cells[cells.length - i].stringValue !== '') {
        this.adopt(new FormulaEditorCell());
      }
    }
  }

  getAsString() {
    const cells = this.findAll({ what: aFormulaEditorCell });
    const stringValue = cells.reduce((acc, cell) => {
      return acc + cell.stringValue;
    }, '');
    return stringValue.replace('=', '');
  }

  parseFormulaAndClose() {
    // Find the formula parser
    const string = this.getAsString();
    const result = this.formulaParser!.parse(string, this.position);
    if (result) {
      this.deactivate();
    }
  }

  render(dt: number, t: number): void {
    // Layout cells
    let offset = Vec.add(this.position, Vec(PADDING, PADDING));
    for (const cell of this.findAll({ what: aFormulaEditorCell })) {
      cell.position = offset;
      offset = Vec.add(offset, Vec(cell.width + PADDING, 0));
      cell.render(dt, t);
    }

    this.width = offset.x - this.position.x;

    // Update background rect
    SVG.update(this.svgBackgroundElement, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      visibility: this.active ? 'visible' : 'hidden',
    });
  }

  distanceToPoint(point: Position): number | null {
    return signedDistanceToBox(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      point.x,
      point.y
    );
  }

  // Track longpress in here? Probably not ideal, but okay for now I guess
  switchCellMode(position: Position) {
    const cell = this.find({ what: aFormulaEditorCell, near: position });

    cell?.setTypeLabel();
  }

  addGesture(name: string) {
    const cells = this.findAll({ what: aFormulaEditorCell });
    const lastCell = cells[cells.length - 3];

    writingRecognizer.addGesture(name, lastCell.strokeData);
  }

  printGestures() {
    writingRecognizer.printGestures();
  }
}

class FormulaEditorCell extends GameObject {
  type: 'default' | 'label' | 'property' = 'default';

  width = 30;
  height = 40;
  position: Position = { x: 100, y: 100 };

  stringValue = '';

  timer: number | null = null;

  // Remember stroke data so we can add it to the library if we want
  strokeData: Position[][] = [];

  protected readonly svgCell = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    class: 'formula-editor-cell',
  });

  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 30,
    class: 'formula-editor-cell-text',
  });

  render(dt: number, t: number) {
    // Update timer
    if (this.timer) {
      this.timer -= dt;
      if (this.timer < 0) {
        this.recognizeStrokes();
        (this.parent! as FormulaEditor).refresh();
        this.timer = null;
      }
    }

    // Do rendering pass
    SVG.update(this.svgCell, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      'is-default-type': this.type === 'default',
    });

    if (this.type === 'default') {
      SVG.update(this.textElement, {
        x: this.position.x + 5,
        y: this.position.y + 30,
        content: this.stringValue,
      });
    }
  }

  captureStroke(stroke: Stroke): boolean {
    if (!stroke.overlapsRect(Rect(this.position, this.width, this.height))) {
      return false;
    }

    this.adopt(stroke);
    if (this.type === 'default') {
      this.timer = 0.5;
    } else {
      this.recomputeWidth();
    }
    return true;
  }

  recomputeWidth(withSpace = true) {
    const strokes = this.findAll({ what: aStroke });
    const bb = boundingBoxFromStrokes(strokes.map(stroke => stroke.points));

    if (withSpace) {
      this.width = Math.max(100, bb.width + 100);
    } else {
      // Balance margin
      const leftPadding = bb.minX - this.position.x;
      this.width = bb.width + leftPadding * 2;
    }
  }

  recognizeStrokes() {
    const strokes = this.findAll({ what: aStroke }).map(s => s.points);
    if (strokes.length === 0) {
      return;
    }

    if (this.type === 'default') {
      const result = writingRecognizer.recognize(strokes);
      this.stringValue = result.Name;

      // Remember stroke data if we want to add it to the library
      this.strokeData = strokes;

      // Clean up strokes that have been recognized
      this.children.forEach(child => {
        child.remove();
      });
    } else {
      this.recomputeWidth(false);
      // Normalize strokes
      const normalizedStrokes = strokes.map(points => {
        return points.map(pt => {
          return Vec.sub(pt, this.position);
        });
      });

      const label = this.page.scope.createLabel(normalizedStrokes);
      console.log(label);

      this.stringValue = '#' + label.id.toString();
    }
  }

  remove(): void {
    super.remove();
    this.svgCell.remove();
    this.textElement.remove();
    for (const child of this.children) {
      child.remove();
    }
  }

  setTypeLabel() {
    this.type = 'label';
    this.width = 100;
  }

  distanceToPoint(point: Position): number | null {
    return signedDistanceToBox(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      point.x,
      point.y
    );
  }
}

export const aFormulaEditor = (gameObj: GameObject) =>
  gameObj instanceof FormulaEditor ? gameObj : null;

export const aFormulaEditorCell = (gameObj: GameObject) =>
  gameObj instanceof FormulaEditorCell ? gameObj : null;
