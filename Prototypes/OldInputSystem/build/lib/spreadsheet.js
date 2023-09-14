const NOT_AVAILABLE = "n/a";
class Cell {
  constructor(_value) {
    this._value = _value;
    this._prev = null;
    this._next = null;
    this.propertyValues = {};
  }
  get value() {
    if (this._value === null) {
      throw NOT_AVAILABLE;
    }
    return this._value;
  }
  get(property) {
    const v = this.propertyValues[property];
    if (v === void 0) {
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
  apply(formulasForProperties) {
    let didSomething = false;
    for (const [property, formulas] of Object.entries(formulasForProperties)) {
      didSomething = this.computeProperty(property, formulas) || didSomething;
    }
    return didSomething;
  }
  computeProperty(property, formulas) {
    if (!this._prev && formulas.first) {
      return this.computePropertyWithFormula(property, formulas.first);
    } else if (!this._next && formulas.last) {
      return this.computePropertyWithFormula(property, formulas.last);
    } else if (formulas.middle) {
      const middles = formulas.middle instanceof Array ? formulas.middle : [formulas.middle];
      return middles.some((middle) => this.computePropertyWithFormula(property, middle));
    } else {
      return false;
    }
  }
  computePropertyWithFormula(property, formula) {
    if (property in this.propertyValues) {
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
class Spreadsheet {
  constructor(values, formulas) {
    this.formulas = formulas;
    this.cells = [];
    for (const value of values) {
      const cell = new Cell(value);
      if (this.cells.length > 0) {
        const prev = this.cells[this.cells.length - 1];
        cell._prev = prev;
        prev._next = cell;
      }
      this.cells.push(cell);
    }
  }
  compute(maxIterations = 1e3) {
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
  }
  getCellValues() {
    return this.cells.map((cell) => {
      const obj = {_: cell.value};
      for (const property of Object.keys(this.formulas)) {
        obj[property] = cell.propertyValues[property] ?? null;
      }
      return obj;
    });
  }
}
const spreadsheet = new Spreadsheet(["x", "x", "", "x", "x", "x"], {
  n: {
    first: () => 1,
    middle: (cell) => cell.value !== "x" ? 0 : cell.prev.get("n") + 1
  },
  v: {
    middle: (cell) => cell.get("n") > cell.next.get("n") ? "" + cell.get("n") : "",
    last: (cell) => "" + cell.get("n")
  }
});
spreadsheet.compute();
console.log(spreadsheet.getCellValues());
