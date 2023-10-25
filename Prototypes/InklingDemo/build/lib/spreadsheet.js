import * as ohm from "../_snowpack/pkg/ohm-js.js";
const spreadsheetGrammar = ohm.grammar(String.raw`

Spreadsheet {
  Properties
    = Property*

  Property
    = name Edges Formula

  Edges
    = edges Edge*  -- edges
    |              -- none

  Edge
    = dir Value

  Formula
    = Exp

  Exp
    = IfExp

  IfExp
    = if EqExp then EqExp else IfExp  -- if
    | EqExp

  EqExp
    = RelExp "=" RelExp  -- eq
    | RelExp

  RelExp
    = AddExp ("<=" | "<" | ">=" | ">") AddExp  -- rel
    | AddExp

  AddExp
    = AddExp ("+" | "-") MulExp  -- add
    | MulExp

  MulExp
    = MulExp ("*" | "/" | "%") PropExp  -- mul
    | PropExp

  PropExp
    = dir+ name  -- prop
    | UnExp

  UnExp
    = "-" CallExp  -- neg
    | CallExp

  CallExp
    = name "(" ListOf<Exp, ","> ")"  -- call
    | PriExp

  PriExp
    = "(" Exp ")"  -- paren
    | Value

  Value
    = number
    | string

  // lexical rules

  dir  (a direction)
    = "←"  -- left
    | "→"  -- right
    | "↑"  -- up
    | "↓"  -- down
    | "•"  -- here

  number  (a number literal)
    = digit* "." digit+  -- fract
    | digit+             -- whole

  string  (a string literal)
    = "\"" (~"\"" ~"\n" any)* "\""

  name  (a name)
    = ~keyword letter alnum*

  edges = "edges" ~alnum
  if = "if" ~alnum
  then = "then" ~alnum
  else = "else" ~alnum
  keyword = edges | if | then | else

}

`);
const NOT_AVAILABLE = "n/a";
class Cell {
  constructor(spreadsheet, value) {
    this.spreadsheet = spreadsheet;
    this.neighbors = new Map();
    this.propertyValues = new Map();
    if (value !== void 0) {
      this.set("value", value);
    }
  }
  connect(name, that) {
    this.neighbors.set(name, that);
    return this;
  }
  set(propertyName, value) {
    this.propertyValues.set(propertyName, value);
    return this;
  }
  get(path, propertyName) {
    let cell = this;
    for (const name of path) {
      cell = cell.neighbors.get(name);
      if (!cell) {
        return this.spreadsheet.getEdgeValue(name, propertyName);
      }
    }
    const value = cell.propertyValues.get(propertyName);
    if (value !== void 0) {
      return value;
    } else {
      throw NOT_AVAILABLE;
    }
  }
  compute(property) {
    if (this.propertyValues.has(property.name)) {
      return false;
    }
    try {
      this.propertyValues.set(property.name, property.formula(this));
      return true;
    } catch (e) {
      if (e !== NOT_AVAILABLE) {
        throw e;
      } else {
        return false;
      }
    }
  }
  toJSON() {
    const obj = {};
    for (const [name, value] of this.propertyValues.entries()) {
      obj[name] = value;
    }
    return obj;
  }
}
const _Spreadsheet = class {
  static parse(properties) {
    const m = spreadsheetGrammar.match(properties);
    if (m.failed()) {
      console.log(m.message);
      throw new Error("failed to parse spreadsheet formulas -- see console for details");
    }
    return _Spreadsheet.semantics(m).parse();
  }
  constructor(cellValues, properties) {
    this.properties = _Spreadsheet.parse(properties);
    console.log(properties);
    this.rows = cellValues.map((row) => row.map((value) => new Cell(this, value)));
    for (let row = 0; row < this.rows.length; row++) {
      for (let col = 0; col < this.rows[row].length; col++) {
        const here = this.getCell(row, col);
        const up = this.getCell(row - 1, col);
        const down = this.getCell(row + 1, col);
        const left = this.getCell(row, col - 1);
        const right = this.getCell(row, col + 1);
        here.connect("\u2022", here);
        if (up) {
          here.connect("\u2191", up);
        }
        if (down) {
          here.connect("\u2193", down);
        }
        if (left) {
          here.connect("\u2190", left);
        }
        if (right) {
          here.connect("\u2192", right);
        }
      }
    }
  }
  getCell(rowIdx, colIdx) {
    if (rowIdx < 0 || rowIdx >= this.rows.length) {
      return null;
    }
    const row = this.rows[rowIdx];
    if (colIdx < 0 || colIdx >= row.length) {
      return null;
    }
    return row[colIdx];
  }
  compute(options) {
    const {maxIterations = 1e3, showResult = true} = options ?? {};
    let n = 0;
    while (n++ < maxIterations) {
      let didSomething = false;
      for (const row of this.rows) {
        for (const cell of row) {
          for (const property of Object.values(this.properties)) {
            didSomething = cell.compute(property) || didSomething;
          }
        }
      }
      if (!didSomething) {
        break;
      }
    }
    if (showResult) {
      console.log(this.getCellValues());
    }
    console.log("done in", n, "iterations");
  }
  getEdgeValue(name, propertyName) {
    const property = this.properties[propertyName];
    if (!property || !property.edgeValues || property.edgeValues[name] === void 0) {
      throw NOT_AVAILABLE;
    }
    return property.edgeValues[name];
  }
  callBuiltinFn(name, ...args) {
    switch (name) {
      case "min":
        return Math.min(...args);
      case "max":
        return Math.max(...args);
      default:
        throw new Error("unsupported function: " + name);
    }
  }
  getCellValues() {
    return this.rows.map((row) => row.map((cell) => cell.toJSON()));
  }
};
let Spreadsheet = _Spreadsheet;
Spreadsheet.semantics = spreadsheetGrammar.createSemantics().addOperation("parse", {
  Properties(ps) {
    const properties = {};
    for (const p of ps.children) {
      const property = p.parse();
      properties[property.name] = property;
    }
    return properties;
  },
  Property(name, edges, formula) {
    return {
      name: name.parse(),
      edgeValues: edges.parse(),
      formula: formula.parse()
    };
  },
  Edges_edges(_edges, edges) {
    const edgeValues = {};
    for (const edgeNode of edges.children) {
      const edge = edgeNode.parse();
      edgeValues[edge.name] = edge.value;
    }
    return edgeValues;
  },
  Edges_none() {
    return {};
  },
  Edge(name, value) {
    return {
      name: name.parse(),
      value: value.parse()
    };
  },
  Formula(exp) {
    const fnSource = `cell => ${exp.parse()}`;
    return eval(fnSource);
  },
  IfExp_if(_if, cond, _then, trueBranch, _else, falseBranch) {
    return `(${cond.parse()} ? ${trueBranch.parse()} : ${falseBranch.parse()})`;
  },
  EqExp_eq(a, _eq, b) {
    return `(${a.parse()} === ${b.parse()})`;
  },
  RelExp_rel(a, op, b) {
    return `(${a.parse()} ${op.sourceString} ${b.parse()})`;
  },
  AddExp_add(a, op, b) {
    return `(${a.parse()} ${op.sourceString} ${b.parse()})`;
  },
  MulExp_mul(a, op, b) {
    return `(${a.parse()} ${op.sourceString} ${b.parse()})`;
  },
  PropExp_prop(names, propertyName) {
    return `cell.get([${names.parse().map((name) => JSON.stringify(name)).join(", ")}], ${JSON.stringify(propertyName.parse())})`;
  },
  UnExp_neg(_minusSign, exp) {
    return `(-${exp.parse()})`;
  },
  CallExp_call(funcName, _openParen, args, _closeParen) {
    return `cell.spreadsheet.callBuiltinFn(${JSON.stringify(funcName.parse())}, ${args.children.map((arg) => arg.parse()).join(", ")})`;
  },
  PriExp_paren(_openParen, exp, _closeParen) {
    return `(${exp.parse()})`;
  },
  name(_firstLetter, _rest) {
    return this.sourceString;
  },
  dir(_name) {
    return this.sourceString;
  },
  number(_) {
    return parseFloat(this.sourceString);
  },
  string(_openQuote, _meat, _closeQuote) {
    return this.sourceString;
  },
  EmptyListOf() {
    return [];
  },
  NonemptyListOf(x, _commas, xs) {
    return [x.parse(), ...xs.parse()];
  },
  _iter(...children) {
    return children.map((child) => child.parse());
  },
  _terminal() {
    return this.sourceString;
  }
});
console.log("--- squares ---");
const squares = new Spreadsheet([
  [1, void 0],
  [2, void 0],
  [3, void 0],
  [4, void 0],
  [5, void 0]
], String.raw`
    value
      ←value * ←value
  `);
squares.compute();
console.log("--- habit tracker ---");
const habitTracker = new Spreadsheet([["x", "x", "", "x", "x", "x"]], String.raw`
    n
      edges
        ← 0
        → 0
      if •value = "x"
      then ←n + 1
      else 0

    subscript
      if •n > →n
      then "" + •n
      else ""
  `);
habitTracker.compute();
console.log("--- wave ---");
const wave = new Spreadsheet([
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16]
], String.raw`
    acc
      edges
        ↑ 0
        ← 0
      •value + ↑acc + ←acc

    subscript
      •acc
  `);
wave.compute();
