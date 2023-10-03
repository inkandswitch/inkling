import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import Label from './Label';

export class Namespace {
  labels = new Set<Label>();

  createNewLabel(strokeData: Position[][], width: number): Label {
    const l = new Label(strokeData, width);
    this.labels.add(l);
    return l;
  }
}

export default class LabelToken extends Token {
  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.BLUE,
  });

  readonly strokeElements: SVGElement[];

  constructor(public readonly label: Label) {
    super();
    this.strokeElements = label.strokeData.map(stroke =>
      SVG.add('polyline', {
        points: SVG.points(stroke),
        transform: `translate(${this.position.x}, ${this.position.y})`,
        stroke: 'white',
        fill: 'none',
        'stroke-width': 2,
      })
    );
    this.width = label.width;
  }

  isPrimary() {
    return true;
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
