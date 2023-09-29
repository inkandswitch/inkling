import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';
import { Variable } from '../constraints';
import { Position } from '../../lib/types';

export default class LabelToken extends Token {
  variable = new Variable(123);

  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.BLUE,
  });

  readonly strokeElements: SVGElement[];

  constructor(strokeData: Position[][], width: number) {
    super();
    this.strokeElements = strokeData.map(stroke => {
      return SVG.add('polyline', {
        points: SVG.points(stroke),
        transform: `translate(${this.position.x}, ${this.position.y})`,
        stroke: 'white',
        fill: 'none',
        'stroke-width': 2,
      });
    });
    this.width = width;
  }

  addChar(char: number) {
    const stringValue = this.variable.value.toString() + char;
    this.variable.value = parseInt(stringValue);
  }

  render(): void {
    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
    });

    for (const strokeElement of this.strokeElements) {
      SVG.update(strokeElement, {
        transform: `translate(${this.position.x}, ${this.position.y})`,
      });
    }
  }
}
