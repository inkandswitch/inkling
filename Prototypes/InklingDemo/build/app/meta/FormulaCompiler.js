import {aLabelToken} from "./LabelToken.js";
import {aNumberToken} from "./NumberToken.js";
import {aPropertyPicker} from "./PropertyPicker.js";
import SVG from "../Svg.js";
import * as constraints from "../constraints.js";
import * as ohm from "../../_snowpack/pkg/ohm-js.js";
const formulaGrammar = ohm.grammar(String.raw`

Formula {
  Formula
    = Exp "=" ref end  -- oneExp
    | Exp "=" Exp  -- twoExps

  Exp
    = AddExp

  AddExp
    = AddExp ("+" | "-") MulExp  -- add
    | MulExp

  MulExp
    = MulExp "×" UnExp  -- mul
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
export default class FormulaCompiler {
  constructor(page) {
    function getVariableByTokenId(id, type, aThing) {
      const token = page.root.find({
        what: aThing,
        that: (thing) => thing.id === id
      });
      if (!token) {
        console.error("invalid", type, "token id", id);
        throw ":(";
      }
      return token.getVariable();
    }
    this.semantics = formulaGrammar.createSemantics().addAttribute("variable", {
      numberRef(at, idDigits) {
        const id = parseInt(idDigits.sourceString);
        return getVariableByTokenId(id, "number", aNumberToken);
      },
      labelRef(hash, idDigits) {
        const id = parseInt(idDigits.sourceString);
        return getVariableByTokenId(id, "label", aLabelToken);
      },
      propRef(bang, idDigits) {
        const id = parseInt(idDigits.sourceString);
        return getVariableByTokenId(id, "propertyPicker", aPropertyPicker);
      }
    }).addOperation("collectVars(vars)", {
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
      }
    }).addAttribute("vars", {
      Exp(e) {
        const vars = new Set();
        e.collectVars(vars);
        return vars;
      }
    }).addOperation("compile", {
      AddExp_add(a, op, b) {
        return `(${a.compile()} ${op.sourceString} ${b.compile()})`;
      },
      MulExp_mul(a, op, b) {
        return `(${a.compile()} * ${b.compile()})`;
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
      }
    }).addOperation("toConstraint", {
      Formula_oneExp(e, eq, ref, end) {
        let vars;
        try {
          vars = e.vars;
        } catch {
          return null;
        }
        const formula = createFormulaConstraint([...vars], e.compile());
        constraints.equals(ref.variable, formula.result);
        return formula;
      },
      Formula_twoExps(left, eq, right) {
        let leftVars, rightVars;
        try {
          leftVars = left.vars;
          rightVars = right.vars;
        } catch {
          return null;
        }
        const leftFormula = createFormulaConstraint([...leftVars], left.compile());
        const rightFormula = createFormulaConstraint([...rightVars], right.compile());
        constraints.equals(rightFormula.result, leftFormula.result);
        return {
          remove() {
            leftFormula.remove();
            rightFormula.remove();
          }
        };
      }
    });
  }
  compile(input) {
    const m = formulaGrammar.match(input);
    if (m.succeeded()) {
      return this.semantics(m).toConstraint();
    } else {
      SVG.showStatus(m.shortMessage);
      console.error(m.message);
      return null;
    }
  }
}
function createFormulaConstraint(vars, compiledExp) {
  const argNames = vars.map((v) => `v${v.id}`);
  const func = new Function(`[${argNames}]`, `return ${compiledExp}`);
  return constraints.formula(vars, func);
}
