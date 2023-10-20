import { aLabelToken } from './LabelToken';
import { aNumberToken } from './NumberToken';
import Page from '../Page';
import SVG from '../Svg';
import { Formula, Variable } from '../constraints';
import * as constraints from '../constraints';
import * as ohm from 'ohm-js';
import { aPropertyPicker } from './PropertyPicker';

const formulaGrammar = ohm.grammar(String.raw`

Formula {
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
    | numberRef
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
    this.semantics = formulaGrammar
      .createSemantics()
      .addAttribute('variable', {
        numberRef(at, idDigits) {
          const id = parseInt(idDigits.sourceString);
          const numberToken = page.root.find({
            what: aNumberToken,
            that: numberToken => numberToken.id === id,
          });
          if (!numberToken) {
            console.error('invalid number token id', id);
            throw ':(';
          }
          return numberToken.getVariable();
        },
        labelRef(hash, idDigits) {
          const id = parseInt(idDigits.sourceString);
          const labelToken = page.root.find({
            what: aLabelToken,
            that: labelToken => labelToken.id === id,
          });
          if (!labelToken) {
            console.error('invalid label token id', id);
            throw ':(';
          }
          return labelToken.getVariable();
        },
        propRef(bang, idDigits) {
          const id = parseInt(idDigits.sourceString);
          const propToken = page.root.find({
            what: aPropertyPicker,
            that: propToken => propToken.id === id,
          });
          if (!propToken) {
            console.error('invalid property picker token id', id);
            throw ':(';
          }
          return propToken.getVariable();
        },
      })
      .addOperation('collectVars(vars)', {
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

    const varSet = new Set<Variable>();
    try {
      this.semantics(m).collectVars(varSet);
    } catch {
      // formula has one or more number/label token refs with invalid ids
      return null;
    }

    const vars = [...varSet];
    const argNames = vars.map(v => `v${v.id}`);
    const compiledExpr = this.semantics(m).compile();
    const func = new Function(`[${argNames}]`, `return ${compiledExpr}`) as (
      xs: number[]
    ) => number;

    return constraints.formula(vars, func);
  }
}
