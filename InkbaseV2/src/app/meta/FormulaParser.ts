import Page from '../Page';
import ParsedFormula from './ParsedFormula';
import Token from './Token';
import LabelToken from './LabelToken';
import NumberToken from './NumberToken';
import OpToken from './OpToken';
import * as ohm from 'ohm-js';

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
  private readonly semantics = formulaGrammar
    .createSemantics()
    .addOperation<Token>('createToken(page)', {
      number(_) {
        const n = parseFloat(this.sourceString);
        return new NumberToken(n, this.source);
      },
      name(_first, _rest) {
        const label = (this.args.page as Page).namespace.createNewLabel(
          this.sourceString
        );
        return new LabelToken(label, this.source);
      },
      any(_c) {
        return new OpToken(this.sourceString, this.source);
      },
    })
    .addOperation<Token[]>('createTokens(page)', {
      tokens(ts) {
        return ts.children.map(t => t.createToken(this.args.page));
      },
    });

  constructor(private readonly page: Page) {}

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
    const tokens = this.tokenize(input);

    const m = formulaGrammar.match(input);
    let resultToken: NumberToken | null = null;
    if (m.succeeded()) {
      // TODO
      console.log('parse succeeded');
      resultToken = new NumberToken(0);
    } else {
      console.log('parse failed');
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
    return this.semantics(m).createTokens(this.page);
  }
}
