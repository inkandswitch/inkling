const NOT_AVAILABLE = 'n/a';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropertyTypes = { _: any };

type Formula<PT extends PropertyTypes, C extends string, T> = (
  cell: Cell<PT, C>
) => T;

type FormulasForProperties<PT extends PropertyTypes, C extends string> = Omit<
  {
    [Property in keyof PT]: Formula<PT, C, PT[Property]>;
  },
  '-'
>;

class Cell<PT extends PropertyTypes, C extends string, V = PT['_']> {
  readonly neighbors = new Map<C, Cell<PT, C>>();
  readonly propertyValues: Partial<PT> = {};

  constructor(value: V) {
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

  get<P extends keyof PT>(property: P): PT[P] {
    const value = this.propertyValues[property];
    if (value === undefined) {
      throw NOT_AVAILABLE;
    } else {
      return value;
    }
  }

  nget<P extends keyof PT>(name: C, property: P, defaultValue: PT[P]): PT[P] {
    const cell = this.neighbors.get(name);
    return cell ? cell.get(property) : defaultValue;
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

class Spreadsheet<PT extends PropertyTypes, C extends string> {
  static create<PT extends PropertyTypes, C extends string>(
    cells: Cell<PT, C>[],
    formulas: FormulasForProperties<PT, C>
  ) {
    return new Spreadsheet<PT, C>(cells, formulas);
  }

  private constructor(
    public readonly cells: Cell<PT, C>[],
    private readonly formulas: FormulasForProperties<PT, C>
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

function habitTrackerExample() {
  type Ps = { _: string; n: number; v: string };
  type C = 'prev' | 'next';
  const cells = ['x', 'x', '', 'x', 'x', 'x'].map(x => new Cell<Ps, C>(x));

  let prev: Cell<Ps, C> | null = null;
  for (const cell of cells) {
    if (prev) {
      prev.connect('next', cell);
      cell.connect('prev', prev);
    }
    prev = cell;
  }

  const spreadsheet = Spreadsheet.create(cells, {
    _: cell => cell.get('_'), // TODO: why does TC complain when I remove this???
    n: cell => (cell.get('_') === 'x' ? cell.nget('prev', 'n', 0) + 1 : 0),
    v: cell =>
      cell.get('n') > cell.nget('next', 'n', 0) ? '' + cell.get('n') : '',
  });
  spreadsheet.compute();
  console.log(spreadsheet.getCellValues());
}

habitTrackerExample();
