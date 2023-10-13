import Token from './Token';
import SVG from '../Svg';
import Vec from '../../lib/vec';
import { isTokenWithVariable } from './token-helpers';
import NumberToken from './NumberToken';
import OpToken from './OpToken';

const PADDING = 3;

export default class ParsedFormula extends Token {
  readonly height = 30 + PADDING * 2;

  protected readonly boxElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    class: 'parsed-formula',
  });

  constructor(
    exprTokens: Token[],
    protected readonly resultToken: NumberToken | null
  ) {
    super();
    for (const token of exprTokens) {
      token.bringToFront();
      this.adopt(token);
    }
    if (resultToken) {
      this.adopt(new OpToken(' = '));
      resultToken.bringToFront();
      this.adopt(resultToken);
    }
  }

  isPrimary() {
    return false;
  }

  render(dt: number, t: number): void {
    // Layout child tokens in horizontal sequence
    let nextTokenPosition = Vec.add(this.position, Vec(PADDING, PADDING));
    for (const token of this.children as Set<Token>) {
      token.position = nextTokenPosition;
      token.render(dt, t);
      token.embedded = true;
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
    for (const token of this.children as Set<Token>) {
      if (isTokenWithVariable(token)) {
        token.getVariable().remove();
      }
    }
    super.remove();
  }
}
