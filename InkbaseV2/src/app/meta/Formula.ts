import Token from './Token';
import COLORS from './Colors';
import SVG from '../Svg';

import Vec from '../../lib/vec';
import NumberToken from './NumberToken';
import * as constraints from '../constraints';
import { Variable } from '../constraints';
import LabelToken from './LabelToken';
import OpToken from './OpToken';

const PADDING = 3;

export default class Formula extends Token {
  readonly height = 40 + PADDING * 2;

  protected readonly boxElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
  });

  readonly vars: Variable[] = [];

  constructor() {
    super();
  }

  isPrimary() {
    return false;
  }

  addToken(t: Token) {
    this.adopt(t);
    this.parseFormula();
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

  parseFormula() {
    // Remove the old variables along with any constraints that reference them.
    while (this.vars.length > 0) {
      const variable = this.vars.pop()!;
      variable.remove();
    }

    const tokens = [...(this.children as Set<Token>)];
    while (tokens.length > 0) {
      const idxOfEqualSign = tokens.findIndex(isEqualSign);
      if (idxOfEqualSign >= 0) {
        this.processExpr(tokens.splice(0, idxOfEqualSign));
        tokens.shift(); // discard the equal sign
      } else {
        this.processExpr(tokens.splice(0, tokens.length));
      }
    }
  }

  processExpr(tokens: Token[]) {
    const newVar = this.addFormulaConstraint(tokens);
    if (!newVar) {
      return;
    }

    const lastVar = this.vars[this.vars.length - 1];
    if (lastVar) {
      constraints.equals(lastVar, newVar);
    }

    this.vars.push(newVar);
  }

  addFormulaConstraint(tokens: Token[]) {
    if (tokens.length === 1 && hasVariable(tokens[0])) {
      return tokens[0].getVariable();
    }

    const expr = [] as string[];
    const vars: Record<string, Variable> = {};
    let numVars = 0;
    for (const token of tokens) {
      if (token instanceof OpToken) {
        expr.push(token.stringValue);
      } else if (hasVariable(token)) {
        const varName = `v${++numVars}`;
        vars[varName] = token.getVariable();
        expr.push(varName);
      } else {
        throw new Error('unsupported token type ' + token.constructor.name);
      }
    }

    try {
      console.log(expr.join(' '));
      const func = new Function(
        `[${[...Object.keys(vars)].join(',')}]`,
        `return ${expr.join(' ')}`
      ) as (xs: number[]) => number;
      const args = [...Object.values(vars)];
      return constraints.formula(args, func).variables.result;
    } catch {
      console.log('invalid formula');
      return null;
    }
  }
}

// helpers

function isEqualSign(token: Token) {
  return token instanceof OpToken && token.stringValue === '=';
}

function hasVariable(token: Token): token is NumberToken | LabelToken {
  return token instanceof NumberToken || token instanceof LabelToken;
}
