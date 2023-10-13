import Token from './Token';
import SVG from '../Svg';
import { Variable } from '../constraints';
import * as ohm from 'ohm-js';
import { WirePort } from './Wire';
import { MetaNumber } from './MetaSemantics';

export default class NumberToken extends Token {
  protected readonly boxElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    //rx: 3,
    class: 'token-box',
  });

  protected readonly wholeTextElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 10,
    class: 'token-text',
    'font-size': '24px',
    'font-family': 'monospace',
  });

  protected readonly fracTextElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 10,
    class: 'token-frac-text',
    'font-size': '10px',
    'font-family': 'monospace',
  });

  readonly variable: Variable;

  wirePort: WirePort;

  constructor(value?: number, source?: ohm.Interval);
  constructor(variable: Variable, source?: ohm.Interval);
  constructor(arg: number | Variable = 0, source?: ohm.Interval) {
    super(source);
    if (arg instanceof Variable) {
      this.variable = arg;
    } else {
      this.variable = new Variable(arg, {
        object: this,
        property: 'number-token-value',
      });
    }
    this.wirePort = this.adopt(
      new WirePort(this.position, new MetaNumber(this.variable))
    );
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
      'is-locked': this.getVariable().isLocked.toString(),
      'is-embedded': this.embedded.toString()
    });

    SVG.update(this.wholeTextElement, {
      x: this.position.x + 5,
      y: this.position.y + 24,
    });

    SVG.update(this.fracTextElement, {
      x: this.position.x + 5 + wholeWidth + 2,
      y: this.position.y + 24,
    });

    this.wirePort.position = this.midPoint();
  }

  getVariable() {
    return this.variable;
  }

  onTap() {
    this.getVariable().toggleLock();
  }
}
