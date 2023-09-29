import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';

import Vec from '../../lib/vec';
import NumberToken from './NumberToken';

const PADDING = 3;

export default class Formula extends Token {
  height = 40 + PADDING * 2;

  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  constructor() {
    super();
    // this.addToken(new NumberToken(10));
    // this.addToken(new OpToken('+'));
    // this.addToken(new NumberToken(20));
    // this.addToken(new OpToken('='));
    // this.addToken(new NumberToken(30));
  }

  addToken(t: Token) {
    this.adopt(t);
  }

  lastToken() {
    return Array.from(this.children).pop();
  }

  render(): void {
    // Layout child tokens in horizontal sequence
    let nextTokenPosition = Vec.add(this.position, Vec(PADDING, PADDING));
    for (const token of this.children as Set<NumberToken>) {
      token.position = nextTokenPosition;
      token.render();
      nextTokenPosition = Vec.add(
        nextTokenPosition,
        Vec(token.width + PADDING, 0)
      );
    }

    this.width = nextTokenPosition.x - this.position.x;

    // Update box wrapper
    if (this.children.size === 0) {
      SVG.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: 0,
      });
      this.width -= PADDING * 2;
    } else {
      SVG.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: this.width,
      });
    }
  }

  remove(): void {
    this.boxElement.remove();
    super.remove();
  }
}

// OPS
export class OpToken extends Token {
  stringValue = 'x';

  protected readonly textElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.GREY_DARK,
    'font-size': '30px',
  }) as SVGTextElement;

  constructor(value: string) {
    super();
    this.stringValue = value;
  }

  render() {
    // Update text content
    this.textElement.textContent = this.stringValue;
    this.width = this.textElement.getComputedTextLength() + 10;

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 30,
    });
  }

  remove(): void {
    this.textElement.remove();
    super.remove();
  }
}
