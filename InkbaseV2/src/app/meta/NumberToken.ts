import Token from './Token';
import { WirePort } from './Wire';
import { MetaNumber } from './MetaSemantics';
import SVG from '../Svg';
import { Variable } from '../constraints';
import * as constraints from '../constraints';
import * as ohm from 'ohm-js';

export default class NumberToken extends Token {
  private lastRenderedValue = 0;

  protected readonly elm = SVG.add('g', SVG.metaElm, { class: 'number-token' });

  protected readonly boxElm = SVG.add('rect', this.elm, {
    class: 'token-box',
    height: this.height,
  });

  protected readonly wholeElm = SVG.add('text', this.elm, {
    class: 'token-text',
  });

  protected readonly fracElm = SVG.add('text', this.elm, {
    class: 'token-frac-text',
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
      this.variable = constraints.variable(arg, {
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
    SVG.update(this.elm, {
      transform: `translate(${this.position.x} ${this.position.y})`,
      'is-locked': this.getVariable().isLocked.toString(),
      'is-embedded': this.embedded.toString(),
    });

    this.wirePort.position = this.midPoint();

    // getComputedTextLength() is slow, so we're gonna do some dirty checking here
    if (this.variable.value != this.lastRenderedValue) {
      this.lastRenderedValue = this.variable.value;

      [this.wholeElm.textContent, this.fracElm.textContent] =
        this.variable.value.toFixed(2).split('.');

      const wholeWidth = this.wholeElm.getComputedTextLength();
      const fracWidth = this.fracElm.getComputedTextLength();
      this.width = 5 + wholeWidth + 2 + fracWidth + 5;

      SVG.update(this.boxElm, {
        width: this.width,
      });

      SVG.update(this.fracElm, {
        dx: wholeWidth + 2,
      });
    }
  }

  getVariable() {
    return this.variable;
  }

  onTap() {
    this.getVariable().toggleLock();
  }
}
