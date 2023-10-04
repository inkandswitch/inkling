import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';
import { Variable } from '../constraints';
import * as ohm from 'ohm-js';

export default class NumberToken extends Token {
  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_DARK,
  });

  protected readonly textElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.WHITE,
    'font-size': '30px',
    'font-family': 'monospace',
  });

  readonly variable: Variable;

  constructor(value = 0, source?: ohm.Interval) {
    super(source);
    this.variable = new Variable(value);
  }

  isPrimary() {
    return true;
  }

  addChar(char: number) {
    const stringValue = this.variable.value.toString() + char;
    this.variable.value = parseInt(stringValue);
  }

  render(): void {
    this.textElement.textContent = '' + Math.round(this.variable.value);
    this.width = this.textElement.getComputedTextLength() + 10;

    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
    });

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 30,
    });
  }

  getVariable() {
    return this.variable;
  }
}
