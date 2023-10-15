import * as constraints from '../constraints';
import { Constraint, Variable } from '../constraints';
import { Position } from '../../lib/types';
import { generateId } from '../../lib/helpers';

// This file implements the semantics of meta ink independently of the visual language
// There are two main types: Meta Value & Meta Connection

// Meta Value
// A meta value can be a Number, Struct(Component?) or Collection
export interface MetaValue {
  // Convenience method that returns a connection
  wireTo(other: MetaValue): MetaConnection | null;
}

// Meta Connection
// An abstract "wire" between two values
export interface MetaConnection {
  // Cleanup this connection
  remove(): void;
}

// NUMBERS
export class MetaNumber implements MetaValue {
  constructor(public variable: Variable) {}

  wireTo(other: MetaValue): MetaNumberConnection | null {
    if (other instanceof MetaNumber || other instanceof MetaNumber) {
      return new MetaNumberConnection(this, other);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}

export class MetaNumberConnection implements MetaConnection {
  constraint: Constraint;

  constructor(a: MetaNumber | MetaLabel, b: MetaNumber | MetaLabel) {
    this.constraint = constraints.equals(a.variable, b.variable);
  }

  remove() {
    this.constraint.remove();
  }
}

export class MetaLabel implements MetaValue {
  readonly id: number = generateId();

  constructor(
    public readonly display: string | Position[][],
    public variable: Variable
  ) {}

  wireTo(other: MetaValue): MetaConnection | null {
    if (other instanceof MetaNumber || other instanceof MetaNumber) {
      return new MetaNumberConnection(this, other);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}

// STRUCTS (Collection of labels (Names))
export class MetaStruct implements MetaValue {
  labelsById = new Map<number, MetaLabel>();
  labelsByString = new Map<string, MetaLabel>();

  constructor(input: Array<MetaLabel>) {
    for (const label of input) {
      this.labelsById.set(label.id, label);
    }
  }

  createLabel(strokeData: string | Position[][]) {
    const label = new MetaLabel(strokeData, constraints.variable(0));
    label.variable.represents = { object: label, property: 'label-value' };
    this.labelsById.set(label.id, label);
    if (typeof strokeData === 'string') {
      this.labelsByString.set(label.display as string, label);
    }
    return label;
  }

  getLabelByString(textLabel: string): MetaLabel | undefined {
    return this.labelsByString.get(textLabel);
  }

  getLabelById(id: number): MetaLabel | undefined {
    return this.labelsById.get(id);
  }

  isEmpty() {
    return this.labelsById.size === 0;
  }

  list(): Array<MetaLabel> {
    return Array.from(this.labelsById.values());
  }

  wireTo(other: MetaValue): MetaStructConnection | null {
    if (other instanceof MetaStruct) {
      return new MetaStructConnection(this, other);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}

export class MetaStructConnection implements MetaConnection {
  b: MetaStruct;

  constructor(a: MetaStruct, b: MetaStruct) {
    // Make sure 'b' is the empty one, so we always unify towards the empty struct
    if (a.isEmpty()) {
      [a, b] = [b, a];
    }

    // Just point to the same Map in memory is fine here?
    b.labelsById = a.labelsById;
    this.b = b;
  }

  remove() {
    this.b.labelsById = new Map();
    return;
  }
}

// COLLECTION (TBD)
export class MetaCollection implements MetaValue {
  wireTo(_other: MetaValue) {
    return null;
  }
}
