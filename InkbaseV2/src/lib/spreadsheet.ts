import * as ohm from 'ohm-js';

const g = ohm.grammar(String.raw`

Spreadsheet {
  Properties
    = Property*

  Property
    = name Edges? Formula

  Edges
    = edges Edge*

  Edge
    = dir Value

  Formula
    = formula Exp

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
    = "-" CallExp  -- call
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

  ident  (an identifier)
    = ~keyword letter alnum*

  number  (a number literal)
    = digit* "." digit+  -- fract
    | digit+             -- whole

  string  (a string literal)
    = "\"" (~"\"" ~"\n" any)* "\""

  name  (a name)
    = ~keyword letter alnum*

  edges = "edges" ~alnum
  formula = "formula" ~alnum
  if = "if" ~alnum
  then = "then" ~alnum
  else = "else" ~alnum
  keyword = edges | formula | if | then | else

}

`);

function parse(input: string) {
  const m = g.match(input);
  if (m.succeeded()) {
    console.log('parsed ok:');
    console.log(input);
  } else {
    console.log(m.message);
  }
}

const habitTrackerFormulas = String.raw`
  n
    edges
      ← 0
      → 0
    formula
      if •v = "x"
      then ←n + 1
      else 0

  d
    formula
      if •n > →n
      then "" + •n
      else ""
`;
parse(habitTrackerFormulas);

const NOT_AVAILABLE = 'n/a';

type Value = number | string;

interface Property {
  name: string;
  formula(cell: Cell): Value;
  edgeValues?: Record<string, Value>;
}

class Cell {
  readonly neighbors = new Map<string, Cell>();
  readonly propertyValues = new Map<string, Value>();

  constructor(
    private readonly spreadsheet: Spreadsheet,
    value: Value
  ) {
    this.set('v', value);
  }

  connect(name: string, that: Cell): this {
    this.neighbors.set(name, that);
    return this;
  }

  set(propertyName: string, value: Value): this {
    this.propertyValues.set(propertyName, value);
    return this;
  }

  get(path: string[], propertyName: string): Value {
    let cell: Cell | undefined = this;
    for (const name of path) {
      cell = cell.neighbors.get(name);
      if (!cell) {
        return this.spreadsheet.getEdgeValue(name, propertyName);
      }
    }
    const value = cell.propertyValues.get(propertyName);
    if (value !== undefined) {
      return value;
    } else {
      throw NOT_AVAILABLE;
    }
  }

  compute(property: Property) {
    if (this.propertyValues.has(property.name)) {
      // already computed it!
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

  toJSON(): Record<string, Value> {
    const obj = {} as Record<string, Value>;
    for (const [name, value] of this.propertyValues.entries()) {
      obj[name] = value;
    }
    return obj;
  }
}

class Spreadsheet {
  static parse(_properties: string): Record<string, Property> {
    throw new Error('TODO: Spreadsheet.parse()');
  }

  readonly properties: Record<string, Property>;
  readonly rows: Cell[][];

  constructor(
    cellValues: Value[][],
    properties: Record<string, Property> | string
  ) {
    this.properties =
      typeof properties === 'string'
        ? Spreadsheet.parse(properties)
        : properties;

    this.rows = cellValues.map(row => row.map(value => new Cell(this, value)));
    for (let row = 0; row < this.rows.length; row++) {
      for (let col = 0; col < this.rows[row].length; col++) {
        const here = this.getCell(row, col)!;
        const up = this.getCell(row - 1, col);
        const down = this.getCell(row + 1, col);
        const left = this.getCell(row, col - 1);
        const right = this.getCell(row, col + 1);
        here.connect('•', here);
        if (up) {
          here.connect('↑', up);
        }
        if (down) {
          here.connect('↓', down);
        }
        if (left) {
          here.connect('←', left);
        }
        if (right) {
          here.connect('→', right);
        }
      }
    }
  }

  private getCell(rowIdx: number, colIdx: number) {
    if (rowIdx < 0 || rowIdx >= this.rows.length) {
      return null;
    }
    const row = this.rows[rowIdx];
    if (colIdx < 0 || colIdx >= row.length) {
      return null;
    }
    return row[colIdx];
  }

  compute(maxIterations = 1000) {
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
    console.log('done in', n, 'iterations');
  }

  getEdgeValue(name: string, propertyName: string): Value {
    const property = this.properties[propertyName];
    if (
      !property ||
      !property.edgeValues ||
      property.edgeValues[name] === undefined
    ) {
      throw NOT_AVAILABLE;
    }
    return property.edgeValues[name];
  }

  getCellValues(): Record<string, Value>[][] {
    return this.rows.map(row => row.map(cell => cell.toJSON()));
  }
}

console.log('--- habit tracker ---');
const habitTracker = new Spreadsheet(
  [['x', 'x', '', 'x', 'x', 'x']],
  // String.raw`
  //   n
  //     edges
  //       ← 0
  //       → 0
  //     formula
  //       if •v = "x"
  //       then ←n + 1
  //       else 0

  //   d
  //     formula
  //       if •n > →n
  //       then "" + •n
  //       else ""
  // `,
  {
    n: {
      name: 'n',
      edgeValues: {
        '←': 0,
        '→': 0,
      },
      formula(cell) {
        return cell.get(['•'], 'v') === 'x'
          ? (cell.get(['←'], 'n') as number) + 1
          : 0;
      },
    },
    d: {
      name: 'd',
      formula(cell) {
        return cell.get(['•'], 'n') > cell.get(['→'], 'n')
          ? '' + cell.get(['•'], 'n')
          : '';
      },
    },
  }
);
habitTracker.compute();
console.log(habitTracker.getCellValues());

/*

TODO: try this other example

1   2  3  4
5   6  7  8
9  10 11 12
13 14 15 16

v = up.v(0) + left.v(0)

*/
