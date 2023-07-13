import * as ohm from 'ohm-js';

const g = ohm.grammar(String.raw`
  Constraints {
    Label = Expr | ident

    Expr = number ident -- times
         | number       -- const

    number = digit+ ("." digit+)? -- wholeAndFrac
           | "." digit+           -- onlyFrac

    ident = letter alnum*
  }
`);

const s = g.createSemantics().addOperation('parse', {
  Expr_times(n, x) {
    return { operator: '*', args: [n.parse(), x.parse()] };
  },
  number(_) {
    return parseFloat(this.sourceString);
  },
  ident(_1, _2) {
    return this.sourceString;
  }
});

function parse(input) {
  try {
    const r = g.match(input);
   return s(r).parse();
  } catch (e) {
    return null;
  }
}

export default parse;
