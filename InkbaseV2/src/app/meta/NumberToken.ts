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

  protected readonly wholeTextElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.WHITE,
    'font-size': '30px',
    'font-family': 'monospace',
  });

  protected readonly fracTextElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 10,
    fill: COLORS.GREY_LIGHT,
    'font-size': '10px',
    'font-family': 'monospace',
  });

  readonly variable: Variable;

  constructor(value?: number, source?: ohm.Interval);
  constructor(variable: Variable, source?: ohm.Interval);
  constructor(arg: number | Variable = 0, source?: ohm.Interval) {
    super(source);
    this.variable = arg instanceof Variable ? arg : new Variable(arg);
  }

  isPrimary() {
    return true;
  }

  addChar(char: number) {
    const stringValue = this.variable.value.toString() + char;
    this.variable.value = parseInt(stringValue);
  }

  render(): void {
    [this.wholeTextElement.textContent, this.fracTextElement.textContent] =
      this.variable.value.toFixed(2).split('.');

    const wholeWidth = this.wholeTextElement.getComputedTextLength();
    const fracWidth = this.fracTextElement.getComputedTextLength();
    this.width = 5 + wholeWidth + 2 + fracWidth + 5;

    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
    });

    SVG.update(this.wholeTextElement, {
      x: this.position.x + 5,
      y: this.position.y + 30,
    });

    SVG.update(this.fracTextElement, {
      x: this.position.x + 5 + wholeWidth + 2,
      y: this.position.y + 30,
    });
  }

  getVariable() {
    return this.variable;
  }

  onTap() {
    console.log('user tapped on', this);
  }
}
