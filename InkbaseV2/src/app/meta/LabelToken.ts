import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';
import Label from './Label';
import * as ohm from 'ohm-js';

export default class LabelToken extends Token {
  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.BLUE,
  });

  protected readonly textElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.WHITE,
    'font-size': '30px',
  });

  readonly strokeElements: SVGElement[] = [];

  constructor(
    public readonly label: Label,
    source?: ohm.Interval
  ) {
    super(source);
    console.log('lll', label.display);
    if (typeof label.display === 'string') {
      this.textElement.textContent = label.display;
      this.width = this.textElement.getComputedTextLength() + 10;
    } else {
      for (const stroke of label.display.strokeData) {
        this.strokeElements.push(
          SVG.add('polyline', {
            points: SVG.points(stroke),
            transform: `translate(${this.position.x}, ${this.position.y})`,
            stroke: 'white',
            fill: 'none',
            'stroke-width': 2,
          })
        );
      }
      this.width = label.display.width;
    }
    SVG.update(this.boxElement, { width: this.width });
  }

  isPrimary() {
    return true;
  }

  render(): void {
    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
    });

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 30,
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
