import * as ohm from 'ohm-js';
import NumberToken from './NumberToken';
import Page from '../Page';
import LabelToken from './LabelToken';

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

// const semantics = formulaGrammar.createSemantics().addOperation('makeToken', {
//   number(_) {
//     const n = parseFloat(this.sourceString);
//     return new NumberToken(n);
//   },
//   name(_first, _rest) {
//     const
//   }
// });

export default class FormulaParser {
  constructor(private readonly page: Page) {}

  parse(input: string) {
    const token = new LabelToken(this.page.namespace.createNewLabel(input));
    token.position = { x: 100, y: 250 };
    this.page.adopt(token);
  }
}
