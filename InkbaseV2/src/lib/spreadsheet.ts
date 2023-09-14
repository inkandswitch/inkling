const NOT_AVAILABLE = 'n/a';

type Formula<V, PVs extends { _: V }, T> = (cell: Cell<V, PVs>) => T;

type FormulasForProperties<V, PVs extends { _: V }> = Omit<
  {
    [Property in keyof PVs]: Formula<V, PVs, PVs[Property]>;
  },
  '_'
>;

class Cell<V, PVs extends { _: V }> {
  readonly adjacentCells = new Map<string, Cell<V, PVs>>();

  constructor(value: V) {
    this.set('_', value);
  }

  propertyValues: Partial<PVs> = {};

  connect(direction: string, that: Cell<V, PVs>) {
    this.adjacentCells.set(direction, that);
  }

  clearProperties() {
    this.propertyValues = {};
  }

  set<P extends keyof PVs>(property: P, value: PVs[P]): this {
    this.propertyValues[property] = value;
    return this;
  }

  get<P extends keyof PVs>(property: P): PVs[P] {
    const value = this.propertyValues[property];
    if (value === undefined) {
      throw NOT_AVAILABLE;
    } else {
      return value;
    }
  }

  nget<P extends keyof PVs>(
    direction: string,
    property: P,
    defaultValue: PVs[P]
  ): PVs[P] {
    const cell = this.adjacentCells.get(direction);
    return cell ? cell.get(property) : defaultValue;
  }

  apply(formulasForProperties: FormulasForProperties<V, PVs>): boolean {
    let didSomething = false;
    for (const [property, formula] of Object.entries(formulasForProperties)) {
      didSomething =
        // (Typecast to any required b/c Object.entries()'s type is too loose, sigh.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.computeProperty(property as keyof PVs, formula as any) ||
        didSomething;
    }
    return didSomething;
  }

  private computeProperty(
    property: keyof PVs,
    formula: Formula<V, PVs, PVs[typeof property]>
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

class Spreadsheet<V, PVs extends { _: V }> {
  constructor(
    public readonly cells: Cell<V, PVs>[],
    private readonly formulas: FormulasForProperties<V, PVs>
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

type Properties = { _: string; n: number; v: string };

const cells = ['x', 'x', '', 'x', 'x', 'x'].map(
  x => new Cell<string, Properties>(x)
);

let prev: Cell<string, Properties> | null = null;
for (const cell of cells) {
  if (prev) {
    prev.connect('next', cell);
    cell.connect('prev', prev);
  }
  prev = cell;
}

const spreadsheet = new Spreadsheet<string, Properties>(cells, {
  n: cell => (cell.get('_') === 'x' ? cell.nget('prev', 'n', 0) + 1 : 0),
  v: cell =>
    cell.get('n') > cell.nget('next', 'n', 0) ? '' + cell.get('n') : '',
});
spreadsheet.compute();
console.log(spreadsheet.getCellValues());
