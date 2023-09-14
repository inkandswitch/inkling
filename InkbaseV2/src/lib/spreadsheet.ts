const NOT_AVAILABLE = 'n/a';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropertyTypes = { _: any };

interface Formula<PT extends PropertyTypes, C extends string, T> {
  cellValue(cell: Cell<PT, C>): T;
  edgeValues?: Partial<{ [key in C]: T }>;
}

type FormulasForProperties<
  PT extends PropertyTypes,
  C extends string,
> = Partial<{ [Property in keyof PT]: Formula<PT, C, PT[Property]> }>;

class Cell<PT extends PropertyTypes, C extends string, V = PT['_']> {
  readonly neighbors = new Map<C, Cell<PT, C>>();
  readonly propertyValues: Partial<PT> = {};

  constructor(
    private readonly spreadsheet: Spreadsheet<PT, C>,
    value: V
  ) {
    this.set('_', value);
  }

  connect(name: C, that: Cell<PT, C>): this {
    this.neighbors.set(name, that);
    return this;
  }

  set<P extends keyof PT>(property: P, value: PT[P]): this {
    this.propertyValues[property] = value;
    return this;
  }

  get<P extends keyof PT>(property: P): PT[P];
  get<P extends keyof PT>(name: C | C[], property: P): PT[P];
  get<P extends keyof PT>(arg1: P | C | C[], arg2?: P): PT[P] {
    if (arguments.length === 1) {
      const property = arg1 as P;
      const value = this.propertyValues[property];
      if (value === undefined) {
        throw NOT_AVAILABLE;
      } else {
        return value;
      }
    } else {
      const names = arg1 instanceof Array ? (arg1 as C[]) : [arg1 as C];
      const property = arg2 as P;
      let cell: Cell<PT, C> | undefined = this;
      for (const name of names) {
        cell = cell.neighbors.get(name);
        if (!cell) {
          return this.spreadsheet.getEdgeValue(name, property);
        }
      }
      return cell.get(property);
    }
  }

  apply(formulasForProperties: FormulasForProperties<PT, C>): boolean {
    let didSomething = false;
    for (const [property, formula] of Object.entries(formulasForProperties)) {
      didSomething =
        // (Typecast to any required b/c Object.entries()'s type is too loose, sigh.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.computeProperty(property as keyof PT, formula as any) ||
        didSomething;
    }
    return didSomething;
  }

  private computeProperty(
    property: keyof PT,
    formula: Formula<PT, C, PT[typeof property]>
  ) {
    if (property in this.propertyValues) {
      // already computed it!
      return false;
    }

    try {
      this.propertyValues[property] = formula.cellValue(this);
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

class Spreadsheet<PT extends PropertyTypes, C extends string, V = PT['_']> {
  readonly cells: Cell<PT, C>[] = [];

  constructor(private readonly formulas: FormulasForProperties<PT, C>) {}

  addCell(value: V) {
    const cell = new Cell<PT, C>(this, value);
    this.cells.push(cell);
    return cell;
  }

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

  getEdgeValue<P extends keyof PT>(name: C, property: P): PT[P] {
    const value = this.formulas[property]?.edgeValues?.[name];
    if (value === undefined) {
      throw NOT_AVAILABLE;
    } else {
      return value;
    }
  }

  getCellValues(): object[] {
    return this.cells.map(cell => cell.propertyValues);
  }
}

function habitTrackerExample() {
  console.log('--- habit tracker ---');

  const habitTracker = new Spreadsheet<
    { _: string; n: number; v: string },
    'prev' | 'next'
  >({
    n: {
      cellValue: cell =>
        cell.get('_') === 'x' ? cell.get('prev', 'n') + 1 : 0,
      edgeValues: {
        prev: 0,
        next: 0,
      },
    },
    v: {
      cellValue(cell) {
        return cell.get('n') > cell.get('next', 'n') ? '' + cell.get('n') : '';
      },
    },
  });

  // add cells and connect them
  const cells = ['x', 'x', '', 'x', 'x', 'x'].map(x => habitTracker.addCell(x));
  cells.forEach((curr, idx) => {
    if (idx > 0) {
      const prev = cells[idx - 1];
      prev.connect('next', curr);
      curr.connect('prev', prev);
    }
  });

  habitTracker.compute();
  console.log(habitTracker.getCellValues());
}
habitTrackerExample();

/*

TODO: try this other example

1   2  3  4
5   6  7  8
9  10 11 12
13 14 15 16

v = up.v(0) + left.v(0)

*/
