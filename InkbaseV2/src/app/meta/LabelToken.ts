import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';
import { Variable } from '../constraints';
import { Position } from '../../lib/types';
import { generateId } from '../../lib/helpers';

export class Namespace {
  labels: Set<Label> = new Set();

  createNewLabel(strokeData: Position[][], width: number): Label {
    const l = new Label(strokeData, width);
    this.labels.add(l);
    return l;
  }
}

export default class LabelToken extends Token {
  primary = true;

  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.BLUE,
  });

  readonly strokeElements: SVGElement[];

  label: Label;

  constructor(label: Label) {
    super();
    this.label = label;
    this.strokeElements = label.strokeData.map(stroke => {
      return SVG.add('polyline', {
        points: SVG.points(stroke),
        transform: `translate(${this.position.x}, ${this.position.y})`,
        stroke: 'white',
        fill: 'none',
        'stroke-width': 2,
      });
    });
    this.width = label.width;
  }

  render(): void {
    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      width: this.label.width,
    });

    for (const strokeElement of this.strokeElements) {
      SVG.update(strokeElement, {
        transform: `translate(${this.position.x}, ${this.position.y})`,
      });
    }
  }

  getVariable() {
    return this.label.variable;
  }
}

export class Label {
  id: number = generateId();
  strokeData: Position[][] = [];
  variable = new Variable(0);
  width: number;

  constructor(strokeData: Position[][], width: number) {
    this.strokeData = strokeData;
    this.width = width;
  }
}
