import * as ohm from 'ohm-js';

const g = ohm.grammar(String.raw`
  Constraints {
    Label = Expr   -- expr
          | ident  -- ident
          | number -- number

    Expr = number ident -- times

    number = digit+ ("." digit+)? -- wholeAndFrac
           | "." digit+           -- onlyFrac

    ident = letter alnum*
  }
`);

const s = g.createSemantics().addOperation('parse', {
  Label_expr(e) {
    return {
      type: 'lengthFormula',
      ...e.parse(),
      label: this.sourceString
    };
  },
  Label_ident(x) {
    return {
      type: 'lengthLabel',
      name: x.parse()
    };
  },
  Label_number(n) {
    return {
      type: 'lengthConstant',
      value: n.parse()
    };
  },
  Expr_times(n, x) {
    const k = n.parse();
    const v = x.parse();
    return {
      fn: (vars) => k * vars[v].value,
      depNames: [v],
    };
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
