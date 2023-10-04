import * as ohm from 'ohm-js';
import NumberToken from './NumberToken';
import Page from '../Page';
import LabelToken from './LabelToken';
import Token from './Token';
import OpToken from './OpToken';
import ParsedFormula from './ParsedFormula';

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
    | name  -- label
    | Value

  Value
    = number

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

  parse(input: string) {
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

    const formula = new ParsedFormula(tokens, resultToken);
    formula.position = { x: 100, y: 250 };
    this.page.adopt(formula);
    return formula;
  }

  tokenize(input: string): Token[] {
    const m = formulaGrammar.match(input, 'tokens');
    return this.semantics(m).createTokens(this.page);
  }
}
