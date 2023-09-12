const NOT_AVAILABLE = 'n/a';

type Formula<V, PVs, T> = (cell: Cell<V, PVs>) => T;

interface FormulasForProperty<V, PVs, T> {
  first?: Formula<V, PVs, T>;
  middle?: Formula<V, PVs, T> | Formula<V, PVs, T>[];
  last?: Formula<V, PVs, T>;
}

type FormulasForProperties<V, PVs> = {
  [Property in keyof PVs]: FormulasForProperty<V, PVs, PVs[Property]>;
};

class Cell<V, PVs> {
  _prev: Cell<V, PVs> | null = null;
  _next: Cell<V, PVs> | null = null;
  propertyValues: Partial<PVs> = {};

  constructor(private _value: V | null) {}

  get value() {
    if (this._value === null) {
      throw NOT_AVAILABLE;
    }
    return this._value;
  }

  get<P extends keyof PVs>(property: P): PVs[P] {
    const v = this.propertyValues[property];
    if (v === undefined) {
      throw NOT_AVAILABLE;
    }
    return v;
  }

  get prev() {
    if (!this._prev) {
      throw NOT_AVAILABLE;
    }
    return this._prev;
  }

  get next() {
    if (!this._next) {
      throw NOT_AVAILABLE;
    }
    return this._next;
  }

  clearProperties() {
    this.propertyValues = {};
  }

  apply(formulasForProperties: FormulasForProperties<V, PVs>): boolean {
    let didSomething = false;
    for (const [property, formulas] of Object.entries(formulasForProperties)) {
      didSomething =
        // (Typecast to any required b/c Object.entries()'s type is too loose, sigh.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.computeProperty(property as keyof PVs, formulas as any) ||
        didSomething;
    }
    return didSomething;
  }

  computeProperty(
    property: keyof PVs,
    formulas: FormulasForProperty<V, PVs, PVs[typeof property]>
  ) {
    if (!this._prev && formulas.first) {
      return this.computePropertyWithFormula(property, formulas.first);
    } else if (!this._next && formulas.last) {
      return this.computePropertyWithFormula(property, formulas.last);
    } else if (formulas.middle) {
      const middles =
        formulas.middle instanceof Array ? formulas.middle : [formulas.middle];
      return middles.some(middle =>
        this.computePropertyWithFormula(property, middle)
      );
    } else {
      return false;
    }
  }

  computePropertyWithFormula(
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
      }
      return false;
    }
  }
}

class Spreadsheet<V, PVs> {
  readonly cells: Cell<V, PVs>[];

  constructor(
    values: V[],
    private readonly formulas: FormulasForProperties<V, PVs>
  ) {
    this.cells = [];
    for (const value of values) {
      const cell = new Cell<V, PVs>(value);
      if (this.cells.length > 0) {
        const prev = this.cells[this.cells.length - 1];
        cell._prev = prev;
        prev._next = cell;
      }
      this.cells.push(cell);
    }
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
    // console.log('done in', n, 'iterations');
  }

  getCellValues(): object[] {
    return this.cells.map(cell => {
      const obj: Record<string, V | PVs[keyof PVs] | null> = { _: cell.value };
      for (const property of Object.keys(this.formulas)) {
        obj[property] = cell.propertyValues[property as keyof PVs] ?? null;
      }
      return obj;
    });
  }
}

const spreadsheet = new Spreadsheet<string, { n: number; v: string }>(
  ['x', 'x', '', 'x', 'x', 'x'],
  {
    n: {
      first: () => 1,
      middle: cell =>
        cell.value !== 'x' ? 0 : (cell.prev.get('n') as number) + 1,
    },
    v: {
      middle: cell =>
        cell.get('n') > cell.next.get('n') ? '' + cell.get('n') : '',
      last: cell => '' + cell.get('n'),
    },
  }
);
spreadsheet.compute();
console.log(spreadsheet.getCellValues());
