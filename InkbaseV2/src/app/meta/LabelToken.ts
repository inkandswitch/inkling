import Token from './Token';
import COLORS from '../Colors';
import SVG from '../Svg';
import Label from './Label';
import * as ohm from 'ohm-js';
import { WirePort } from './Wire';
import { MetaNumber } from './MetaSemantics';

export default class LabelToken extends Token {
  protected readonly boxElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.BLUE,
  });

  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.WHITE,
    'font-size': '30px',
  });

  readonly strokeElements: SVGElement[] = [];

  wirePort: WirePort;

  constructor(
    public readonly label: Label,
    source?: ohm.Interval
  ) {
    super(source);
    if (typeof label.display === 'string') {
      this.textElement.textContent = label.display;
      this.width = this.textElement.getComputedTextLength() + 10;
    } else {
      for (const stroke of label.display.strokeData) {
        const strokeElement = SVG.add('polyline', SVG.metaElm, {
          points: SVG.points(stroke),
          transform: `translate(${this.position.x}, ${this.position.y})`,
          stroke: 'black',
          fill: 'none',
          'stroke-width': 2,
        });
        this.strokeElements.push(strokeElement);
      }
      this.width = label.display.width;
    }
    SVG.update(this.boxElement, { width: this.width });

    this.wirePort = this.adopt(
      new WirePort(this.position, new MetaNumber(this.label.variable))
    );
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

    this.wirePort.position = this.midPoint();
  }

  getVariable() {
    return this.label.variable;
  }
}
