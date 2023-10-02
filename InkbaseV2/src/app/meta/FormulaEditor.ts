import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';
import COLORS from './Colors';
import SVG from '../Svg';

import Formula from './Formula';
import Vec from '../../lib/vec';
import Stroke from '../strokes/Stroke';
import WritingRecognizer from '../recognizers/WritingRecognizer';
import NumberToken from './NumberToken';
import LabelToken, { Label } from './LabelToken';
import { forEach } from '../../lib/helpers';
import OpToken from './OpToken';

const PADDING = 3;
const PADDING_BIG = 5;

export default class FormulaEditor extends GameObject {
  formula: WeakRef<Formula> | null = null;

  width = 90;
  height = 46;
  position: Position = { x: 100, y: 100 };

  editWidth = 46;
  mode: 'default' | 'label' = 'default';

  readonly recognizer = new WritingRecognizer();

  labelStrokes: WeakRef<Stroke>[] = [];

  // SVG Elements
  protected readonly wrapperElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.height,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_BRIGHT,
    stroke: 'rgba(0,0,0,0.2)',
    'stroke-width': 0.3,
    visibility: 'hidden',
  });

  protected readonly nextCharElement = SVG.add('rect', {
    x: this.position.x + this.width + PADDING,
    y: this.position.y,
    width: this.height,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
    visibility: 'hidden',
  });

  protected readonly toggleElement = SVG.add('circle', {
    cx: this.position.x,
    cy: this.position.y,
    r: 5,
    fill: COLORS.BLUE,
    visibility: 'hidden',
  });

  newFormula() {
    const f = new Formula();
    this.page.adopt(f);
    this.formula = new WeakRef(f);

    f.position = Vec.add(this.position, Vec(PADDING, PADDING));
  }

  // STROKE CAPTURE
  captureStroke(stroke: WeakRef<Stroke>) {
    const f = this.formula?.deref();
    const s = stroke.deref();
    if (!f || !s) {
      return;
    }

    if (this.mode === 'label') {
      this.captureLabelStroke(stroke, f);
    } else {
      const capturePosition = Vec.add(
        this.position,
        Vec(f.width + this.editWidth / 2, 20)
      );
      const distance = s.distanceToPoint(capturePosition);
      if (distance !== null && distance < 20) {
        console.log('capture', s);
        this.captureRecognizedStroke(s, f);
      }
    }
  }

  captureLabelStroke(stroke: WeakRef<Stroke>, f: Formula) {
    this.labelStrokes.push(stroke);
    stroke.deref()!.color = '#FFF';

    let maxX = 0;
    forEach(this.labelStrokes, stroke => {
      for (const pt of stroke.points) {
        maxX = Math.max(pt.x, maxX);
      }
    });

    this.editWidth = maxX - (this.position.x + f.width) + 46;
  }

  captureRecognizedStroke(s: Stroke, f: Formula) {
    const result = this.recognizer.recognize([s.points]);
    console.log(result);

    const char = result.Name;
    if (result.isNumeric) {
      const lastToken = f.lastToken();
      if (lastToken instanceof NumberToken) {
        lastToken.addChar(char);
      } else {
        f.addToken(new NumberToken(parseInt(char)));
      }
    } else {
      f.addToken(new OpToken(char));
    }

    s.remove();
  }

  // TODO: All the derefs are kind of a pain here. But w/e
  addLabelToken() {
    const formula = this.formula?.deref();
    if (this.labelStrokes.length === 0 || !formula) {
      return;
    }

    // Normalize the stroke positions to the the top corner of the token
    const normalizedStrokes: Position[][] = [];
    forEach(this.labelStrokes, s => {
      const ns = s.points.map(pt =>
        Vec.sub(
          pt,
          Vec.add(this.position, Vec(formula.width! + PADDING * 2, +PADDING))
        )
      );
      normalizedStrokes.push(ns);
    });

    // Add new label token
    const label = this.page.nameSpace.createNewLabel(
      normalizedStrokes,
      this.editWidth - 46
    );
    const labelToken = new LabelToken(label);
    formula.addToken(labelToken);

    // Cleanup
    forEach(this.labelStrokes, stroke => {
      stroke.remove();
    });
    this.labelStrokes = [];
    this.editWidth = 46;
  }

  addLabelTokenFromExisting(label: Label) {
    const formula = this.formula?.deref();
    if (!formula) {
      return;
    }

    const labelToken = new LabelToken(label);
    formula.addToken(labelToken);
  }

  // MODES
  isPositionNearToggle(position: Position) {
    return (
      !!this.formula?.deref() &&
      position.x > this.position.x + this.width - 25 &&
      position.y > this.position.y &&
      position.x < this.position.x + this.width &&
      position.y < this.position.y + this.height
    );
  }

  toggleMode() {
    if (this.mode === 'label') {
      this.addLabelToken();
    }

    this.mode = this.mode === 'label' ? 'default' : 'label';
    this.editWidth = 46;
  }

  // Active
  isActive() {
    return !!this.formula?.deref();
  }

  // TODO: should this take Formula instead of WR<Formula>?
  activateFromFormula(formula: WeakRef<Formula>) {
    this.formula = formula;
  }

  activateFromPosition(position: Position) {
    this.position = position;
    this.newFormula();
  }

  deactivate() {
    const f = this.formula?.deref();
    if (!f) {
      return;
    }

    // Finish off work if we still have something to do
    if (this.mode === 'label') {
      this.addLabelToken();
      f.render();
    }

    // Unwrap if formula only has one child
    if (f.children.size === 0) {
      f.remove();
    } else if (f.children.size === 1) {
      const child = Array.from(f.children).pop()!;
      this.page.adopt(child);
      f.remove();
    }
    this.formula = null;
    this.mode = 'default';
    this.editWidth = 46;
  }

  render(): void {
    const f = this.formula?.deref();
    if (f) {
      const offsetWidth = this.editWidth + PADDING_BIG * 2 + PADDING * 6;
      this.position = f.position;
      this.width = f.width + offsetWidth;

      // Update total wrapper
      SVG.update(this.wrapperElement, {
        x: this.position.x - PADDING_BIG,
        y: this.position.y - PADDING_BIG,
        width: this.width,
        height: this.height + PADDING_BIG * 2,
        visibility: 'visible',
      });

      // Char elements
      const position = Vec.add(this.position, Vec(f.width, 0));
      SVG.update(this.nextCharElement, {
        x: position.x + PADDING,
        y: this.position.y,
        width: this.editWidth,
        visibility: 'visible',
      });

      // Toggle
      SVG.update(this.toggleElement, {
        cx: position.x + this.editWidth + 4 * PADDING,
        cy: this.position.y + this.height / 2,
        visibility: 'visible',
      });
    } else {
      SVG.update(this.nextCharElement, { visibility: 'hidden' });
      SVG.update(this.toggleElement, { visibility: 'hidden' });
      SVG.update(this.wrapperElement, { visibility: 'hidden' });
    }

    // Mode
    SVG.update(this.toggleElement, {
      fill: this.mode === 'label' ? COLORS.GREY_MID : COLORS.BLUE,
    });

    SVG.update(this.nextCharElement, {
      fill: this.mode === 'label' ? COLORS.BLUE : COLORS.GREY_MID,
    });
  }
}
