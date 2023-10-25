import * as constraints from "../constraints.js";
import {generateId} from "../../lib/helpers.js";
export class MetaNumber {
  constructor(variable) {
    this.variable = variable;
  }
  wireTo(that) {
    if (that instanceof MetaNumber || that instanceof MetaNumber) {
      return new MetaNumberConnection(this, that);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}
export class MetaNumberConnection {
  constructor(a, b) {
    this.constraint = constraints.equals(b.variable, a.variable);
  }
  get paused() {
    return this.constraint.paused;
  }
  togglePaused(newValue = !this.constraint.paused) {
    return this.constraint.paused = newValue;
  }
  remove() {
    this.constraint.remove();
  }
}
export class MetaLabel {
  constructor(display, variable) {
    this.display = display;
    this.variable = variable;
    this.id = generateId();
  }
  wireTo(that) {
    if (that instanceof MetaNumber || that instanceof MetaNumber) {
      return new MetaNumberConnection(this, that);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}
export class MetaStruct {
  constructor(input) {
    this.labelsById = new Map();
    this.labelsByString = new Map();
    for (const label of input) {
      this.labelsById.set(label.id, label);
      if (typeof label.display === "string") {
        this.labelsByString.set(label.display, label);
      }
    }
  }
  createLabel(strokeData) {
    const label = new MetaLabel(strokeData, constraints.variable(0));
    label.variable.represents = {object: label, property: "label-value"};
    this.labelsById.set(label.id, label);
    if (typeof strokeData === "string") {
      this.labelsByString.set(label.display, label);
    }
    return label;
  }
  getLabelByString(textLabel) {
    return this.labelsByString.get(textLabel);
  }
  getLabelById(id) {
    return this.labelsById.get(id);
  }
  isEmpty() {
    return this.labelsById.size === 0;
  }
  list() {
    return Array.from(this.labelsById.values());
  }
  wireTo(that) {
    if (that instanceof MetaStruct) {
      return new MetaStructConnection(this, that);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}
export class MetaStructConnection {
  constructor(a, b) {
    this.constraints = [];
    if (a.isEmpty()) {
      [a, b] = [b, a];
    }
    if (!b.isEmpty()) {
      for (const [id, a_label] of a.labelsByString.entries()) {
        const b_label = b.labelsByString.get(id);
        if (b_label) {
          this.constraints.push(constraints.equals(b_label.variable, a_label.variable));
        }
      }
    } else {
      b.labelsById = a.labelsById;
    }
    this.b = b;
  }
  get paused() {
    return false;
  }
  togglePaused(newValue) {
    return false;
  }
  remove() {
    this.b.labelsById = new Map();
    for (const constraint of this.constraints) {
      constraint.remove();
    }
    return;
  }
}
export class MetaCollection {
  wireTo(that) {
    return null;
  }
}
