/*

1   2  3  4
5   6  7  8
9  10 11 12
13 14 15 16

v = up.v(0) + left.v(0)

*/

const NOT_AVAILABLE = 'n/a';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropertyTypes = { _: any };

type Formula<PTs extends PropertyTypes, T> = (cell: Cell<PTs>) => T;

type FormulasForProperties<PTs extends PropertyTypes> = Omit<
  { [Property in keyof PTs]: Formula<PTs, PTs[Property]> },
  '_'
>;

class Cell<PTs extends PropertyTypes> {
  readonly adjacentCells = new Map<string, Cell<PTs>>();
  propertyValues: Partial<PTs> = {};

  constructor(value: PTs['_']) {
    this.set('_', value);
  }

  connect(direction: string, that: Cell<PTs>) {
    this.adjacentCells.set(direction, that);
  }

  set<P extends keyof PTs>(property: P, value: PTs[P]): this {
    this.propertyValues[property] = value;
    return this;
  }

  get<P extends keyof PTs>(property: P): PTs[P] {
    const value = this.propertyValues[property];
    if (value === undefined) {
      throw NOT_AVAILABLE;
    } else {
      return value;
    }
  }

  nget<P extends keyof PTs>(
    direction: string,
    property: P,
    defaultValue: PTs[P]
  ): PTs[P] {
    const cell = this.adjacentCells.get(direction);
    return cell ? cell.get(property) : defaultValue;
  }

  apply(formulasForProperties: FormulasForProperties<PTs>): boolean {
    let didSomething = false;
    for (const [property, formula] of Object.entries(formulasForProperties)) {
      didSomething =
        // (Typecast to any required b/c Object.entries()'s type is too loose, sigh.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.computeProperty(property as keyof PTs, formula as any) ||
        didSomething;
    }
    return didSomething;
  }

  private computeProperty(
    property: keyof PTs,
    formula: Formula<PTs, PTs[typeof property]>
  ) {
    if (property in this.propertyValues) {
      // already computed it!
      return false;
    }

    try {
      this.propertyValues[property] = formula(this);
      return true;
    } catch (e) {
      if (e !== NOT_AVAILABLE) {
        throw e;
      } else {
        return false;
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class Spreadsheet<PTs extends PropertyTypes> {
  constructor(
    public readonly cells: Cell<PTs>[],
    private readonly formulas: FormulasForProperties<PTs>
  ) {}

  compute(maxIterations = 1000) {
    let n = 0;
    while (n++ < maxIterations) {
      let didSomething = false;
      for (const cell of this.cells) {
        didSomething = cell.apply(this.formulas) || didSomething;
      }
      if (!didSomething) {
        break;
      }
    }
    console.log('done in', n, 'iterations');
  }

  getCellValues(): object[] {
    return this.cells.map(cell => cell.propertyValues);
  }
}

// Example: habit tracker

type HTProperties = { _: string; n: number; v: string };

const htCells = ['x', 'x', '', 'x', 'x', 'x'].map(
  x => new Cell<HTProperties>(x)
);

let prev: Cell<HTProperties> | null = null;
for (const cell of htCells) {
  if (prev) {
    prev.connect('next', cell);
    cell.connect('prev', prev);
  }
  prev = cell;
}

const spreadsheet = new Spreadsheet<HTProperties>(htCells, {
  n: cell => (cell.get('_') === 'x' ? cell.nget('prev', 'n', 0) + 1 : 0),
  v: cell =>
    cell.get('n') > cell.nget('next', 'n', 0) ? '' + cell.get('n') : '',
});
spreadsheet.compute();
console.log(spreadsheet.getCellValues());
