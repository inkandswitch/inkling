import { aLabelToken } from './LabelToken';
import { aNumberToken } from './NumberToken';
import { aPropertyPicker } from './PropertyPicker';
import { TokenWithVariable } from './token-helpers';
import Page from '../Page';
import SVG from '../Svg';
import { Formula, Variable } from '../constraints';
import * as constraints from '../constraints';
import { GameObject } from '../GameObject';
import * as ohm from 'ohm-js';

const formulaGrammar = ohm.grammar(String.raw`

Formula {
  Formula
    = Exp "=" ref  -- equation
    | Exp

  Exp
    = AddExp

  AddExp
    = AddExp ("+" | "-") MulExp  -- add
    | MulExp

  MulExp
    = MulExp ("×" | "/" | "%") UnExp  -- mul
    | UnExp

  UnExp
    = "-" PriExp  -- neg
    | PriExp

  PriExp
    = "(" Exp ")"  -- paren
    | ref

  ref
    = numberRef
    | labelRef
    | propRef

  // lexical rules

  numberRef  (a number reference)
    = "@" digit+

  labelRef (a label reference)
    = "#" digit+

  propRef (a property picker reference)
    = "!" digit+
}
`);

export default class FormulaParser {
  private readonly semantics: ohm.Semantics;

  constructor(page: Page) {
    function getVariableByTokenId<T extends TokenWithVariable>(
      id: number,
      type: string,
      aThing: (go: GameObject) => T | null
    ): Variable {
      const token = page.root.find({
        what: aThing,
        that: thing => thing.id === id,
      });
      if (!token) {
        console.error('invalid', type, 'token id', id);
        throw ':(';
      }
      return token.getVariable();
    }

    this.semantics = formulaGrammar
      .createSemantics()
      .addAttribute('variable', {
        numberRef(at, idDigits) {
          const id = parseInt(idDigits.sourceString);
          return getVariableByTokenId(id, 'number', aNumberToken);
        },
        labelRef(hash, idDigits) {
          const id = parseInt(idDigits.sourceString);
          return getVariableByTokenId(id, 'label', aLabelToken);
        },
        propRef(bang, idDigits) {
          const id = parseInt(idDigits.sourceString);
          return getVariableByTokenId(id, 'propertyPicker', aPropertyPicker);
        },
      })
      .addAttribute<Variable | null>('varToUnifyWithResult', {
        Formula_equation(e, eq, ref) {
          return ref.variable;
        },
        Exp(e) {
          return null;
        },
      })
      .addOperation('collectVars(vars)', {
        Formula_equation(e, eq, ref) {
          e.collectVars(this.args.vars);
          // ref's var is not an argument to formula constraint's function!
        },
        AddExp_add(a, op, b) {
          a.collectVars(this.args.vars);
          b.collectVars(this.args.vars);
        },
        MulExp_mul(a, op, b) {
          a.collectVars(this.args.vars);
          b.collectVars(this.args.vars);
        },
        UnExp_neg(op, e) {
          e.collectVars(this.args.vars);
        },
        PriExp_paren(oparen, e, cparen) {
          e.collectVars(this.args.vars);
        },
        numberRef(at, idDigits) {
          this.args.vars.add(this.variable);
        },
        labelRef(hash, idDigits) {
          this.args.vars.add(this.variable);
        },
        propRef(bang, idDigits) {
          this.args.vars.add(this.variable);
        },
      })
      .addOperation('compile', {
        Formula_equation(e, eq, ref) {
          return e.compile();
        },
        AddExp_add(a, op, b) {
          return `(${a.compile()} ${op.sourceString} ${b.compile()})`;
        },
        MulExp_mul(a, op, b) {
          const jsOp = op.sourceString === '×' ? '*' : op.sourceString;
          return `(${a.compile()} ${jsOp} ${b.compile()})`;
        },
        UnExp_neg(op, e) {
          return `(${op.sourceString}${e.compile()})`;
        },
        PriExp_paren(oparen, e, cparen) {
          return `(${e.compile()})`;
        },
        numberRef(at, id) {
          return `v${this.variable.id}`;
        },
        labelRef(hash, id) {
          return `v${this.variable.id}`;
        },
        propRef(bang, id) {
          return `v${this.variable.id}`;
        },
      });
  }

  /** Returns a formula constraint for this formula, if it's valid, or null otherwise. */
  parse(input: string): Formula | null {
    const m = formulaGrammar.match(input);
    if (m.failed()) {
      SVG.showStatus(m.shortMessage!);
      console.error(m.message);
      return null;
    }

    const s = this.semantics(m);

    const varSet = new Set<Variable>();
    try {
      s.collectVars(varSet);
    } catch {
      // formula has one or more number/label token refs with invalid ids
      return null;
    }

    const vars = [...varSet];
    const argNames = vars.map(v => `v${v.id}`);
    const compiledExpr = s.compile();
    const func = new Function(`[${argNames}]`, `return ${compiledExpr}`) as (
      xs: number[]
    ) => number;

    const formulaConstraint = constraints.formula(vars, func);
    if (s.varToUnifyWithResult) {
      formulaConstraint.result.makeEqualTo(s.varToUnifyWithResult);
    }
    return formulaConstraint;
  }
}
