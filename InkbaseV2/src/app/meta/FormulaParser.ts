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
    | name
    | number

  // lexical rules

  number  (a number literal)
    = digit* "." digit+  -- fract
    | digit+             -- whole

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
          const label = page.namespace.createNewLabel(this.sourceString);
          return new LabelToken(label, this.source);
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
        number(_) {
          return `v${this.token.getVariable().id}`;
        },
      });
  }

  /**
   * Parses the expression in `input` and returns the `Token`s corresponding
   * to the input string. If the parse is successful, this method also creates
   * a `NumberToken` whose value is constrained to be equal to the value of the
   * expression.
   *
   * Note that each token that corresponds to part of the input has a `source`
   * property that tells us exactly what part of the input it comes from.
   *
   * If the optional `addToCanvas` argument is `true`, this method also adds
   * a `ParsedFormula` widget to the page.
   */
  parse(input: string, addToCanvas = false) {
    const m = formulaGrammar.match(input);
    let tokens: Token[];
    let resultToken: NumberToken | null = null;
    if (m.succeeded()) {
      const sm = this.semantics(m);
      tokens = [];
      sm.collectTokens(tokens);
      const resultVar = this.addConstraints(
        m,
        tokens.filter(isTokenWithVariable).map(t => t.getVariable())
      );
      resultToken = new NumberToken(resultVar);
    } else {
      console.log('parse failed');
      tokens = this.semantics(formulaGrammar.match(input, 'tokens')).tokens;
    }

    if (addToCanvas) {
      const formula = new ParsedFormula(tokens, resultToken);
      formula.position = { x: 100, y: 250 };
      this.page.adopt(formula);
    }

    return { tokens, resultToken };
  }

  tokenize(input: string): Token[] {
    const m = formulaGrammar.match(input, 'tokens');
    return this.semantics(m).tokens;
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
