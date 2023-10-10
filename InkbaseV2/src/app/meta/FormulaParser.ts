import Page from '../Page';
import ParsedFormula from './ParsedFormula';
import Token from './Token';
import LabelToken from './LabelToken';
import NumberToken from './NumberToken';
import OpToken from './OpToken';
import * as ohm from 'ohm-js';
import * as constraints from '../constraints';
import { isTokenWithVariable } from './token-helpers';
import { Variable } from '../constraints';
import { Position } from '../../lib/types';
import SVG from '../Svg';

const formulaGrammar = ohm.grammar(String.raw`

Formula {
  Exp
    = AddExp

  AddExp
    = AddExp ("+" | "-") MulExp  -- add
    | MulExp

  MulExp
    = MulExp ("*" | "/" | "%") UnExp  -- mul
    | UnExp

  UnExp
    = "-" PriExp  -- neg
    | PriExp

  PriExp
    = "(" Exp ")"  -- paren
    | label
    | name
    | number

  // lexical rules

  number  (a number literal)
    = digit* "." digit+  -- fract
    | digit+             -- whole

  label (a label)
    = "#" digit+

  name  (a name)
    = letter alnum*

  tokens
    = (number | name | any)*
}
`);

export default class FormulaParser {
  private readonly semantics: ohm.Semantics;

  constructor(private readonly page: Page) {
    this.semantics = formulaGrammar
      .createSemantics()
      .addAttribute<Token>('token', {
        number(_) {
          const n = parseFloat(this.sourceString);
          return new NumberToken(n, this.source);
        },
        name(_first, _rest) {
          return new LabelToken(
            page.namespace.getLabelNamed(this.sourceString),
            this.source
          );
        },
        label(_hash, id) {
          return new LabelToken(
            page.namespace.getLabelWithId(parseInt(id.sourceString)),
            this.source
          );
        },
        _terminal() {
          return new OpToken(this.sourceString, this.source);
        },
      })
      .addAttribute<Token[]>('tokens', {
        tokens(ts) {
          return ts.children.map(t => t.token);
        },
      })
      .addOperation<void>('collectTokens(tokens)', {
        AddExp_add(a, op, b) {
          a.collectTokens(this.args.tokens);
          op.collectTokens(this.args.tokens);
          b.collectTokens(this.args.tokens);
        },
        MulExp_mul(a, op, b) {
          a.collectTokens(this.args.tokens);
          op.collectTokens(this.args.tokens);
          b.collectTokens(this.args.tokens);
        },
        UnExp_neg(op, e) {
          op.collectTokens(this.args.tokens);
          e.collectTokens(this.args.tokens);
        },
        PriExp_paren(oparen, e, cparen) {
          oparen.collectTokens(this.args.tokens);
          e.collectTokens(this.args.tokens);
          cparen.collectTokens(this.args.tokens);
        },
        name(_first, _rest) {
          this.args.tokens.push(this.token);
        },
        label(_hash, _id) {
          this.args.tokens.push(this.token);
        },
        number(_) {
          this.args.tokens.push(this.token);
        },
        _terminal() {
          this.args.tokens.push(this.token);
        },
      })
      .addOperation('compile', {
        AddExp_add(a, op, b) {
          return `(${a.compile()} ${op.sourceString} ${b.compile()})`;
        },
        MulExp_mul(a, op, b) {
          return `(${a.compile()} ${op.sourceString} ${b.compile()})`;
        },
        UnExp_neg(op, e) {
          return `(${op.sourceString}${e.compile()})`;
        },
        PriExp_paren(_oparen, e, _cparen) {
          return `(${e.compile()})`;
        },
        name(_first, _rest) {
          return `v${this.token.getVariable().id}`;
        },
        label(_hash, _id) {
          return `v${this.token.getVariable().id}`;
        },
        number(_) {
          return `v${this.token.getVariable().id}`;
        },
      });
  }

  parse(input: string, pos: Position = { x: 100, y: 250 }): boolean {
    const m = formulaGrammar.match(input);
    if (m.failed()) {
      SVG.showStatus(m.shortMessage!);
      console.log(m.message);
      return false;
    }

    const tokens: Token[] = [];
    this.semantics(m).collectTokens(tokens);

    const vars = tokens.filter(isTokenWithVariable).map(t => t.getVariable());
    const resultVar = this.addConstraints(m, vars);
    const resultToken = new NumberToken(resultVar);
    const formula = new ParsedFormula(tokens, resultToken);

    formula.position = pos;
    this.page.adopt(formula);
    return true;
  }

  addConstraints(m: ohm.MatchResult, vars: Variable[]): Variable {
    const argNames = vars.map(v => `v${v.id}`);
    const compiledExpr = this.semantics(m).compile();
    const func = this.createFormulaFn(argNames, compiledExpr);
    return constraints.formula(vars, func).variables.result;
  }

  createFormulaFn(
    argNames: string[],
    compiledExpr: string
  ): (xs: number[]) => number {
    // console.log('argNames', argNames);
    // console.log('compiledExpr', compiledExpr);
    try {
      return new Function(`[${argNames}]`, `return ${compiledExpr}`) as (
        xs: number[]
      ) => number;
    } catch (e) {
      console.error('uh-oh, generated code is not ok', e);
      throw new Error(':(');
    }
  }
}
