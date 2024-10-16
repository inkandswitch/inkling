import * as constraints from "../Constraints"
import { Constraint, Variable } from "../Constraints"
import { Position } from "../../lib/types"
import { generateId } from "../Root"

// TODO: get rid of this, and merge functionality into Wire, NumberToken, etc.
// (GOs that represent connectable things get the semantics for making connections to/from them)

// This file implements the semantics of meta ink independently of the visual language
// There are two main types: Meta Value & Meta Connection

// Meta Value
// A meta value can be a Number or Struct
export interface MetaValue {
  /** Connects `this` MetaValue to `that` MetaValue. */
  wireTo(that: MetaValue): MetaConnection | null
}

/** An abstract "wire" between two values. */
export interface MetaConnection {
  /** Clean up this connection. */
  remove(): void

  get paused(): boolean

  togglePaused(newValue?: boolean): boolean
}

// NUMBERS
export class MetaNumber implements MetaValue {
  constructor(public variable: Variable) {}

  wireTo(that: MetaValue): MetaNumberConnection | null {
    if (that instanceof MetaNumber || that instanceof MetaNumber) {
      return new MetaNumberConnection(this, that)
    } else {
      console.error("You can't wire those things together silly billy!")
      return null
    }
  }
}

export class MetaNumberConnection implements MetaConnection {
  constraint: Constraint

  constructor(a: MetaNumber | MetaLabel, b: MetaNumber | MetaLabel) {
    // The order of arguments to `equals` matters b/c the 1st one's
    // associated value will flow into the second.
    // The order in the call below used to be `a.variable, b.variable`
    // but that caused jumps in the property picker's values.
    this.constraint = constraints.equals(b.variable, a.variable)
  }

  get paused() {
    return this.constraint.paused
  }

  togglePaused(newValue = !this.constraint.paused) {
    return (this.constraint.paused = newValue)
  }

  remove() {
    this.constraint.remove()
  }
}

export class MetaLabel implements MetaValue {
  readonly id: number = generateId()

  constructor(public readonly display: string | Position[][], public variable: Variable) {}

  wireTo(that: MetaValue): MetaConnection | null {
    if (that instanceof MetaNumber || that instanceof MetaNumber) {
      return new MetaNumberConnection(this, that)
    } else {
      console.error("You can't wire those things together silly billy!")
      return null
    }
  }
}

/**
 * A collection of labels / names.
 */
export class MetaStruct implements MetaValue {
  labelsById = new Map<number, MetaLabel>()
  labelsByString = new Map<string, MetaLabel>()

  constructor(input: Array<MetaLabel>) {
    for (const label of input) {
      this.labelsById.set(label.id, label)
      if (typeof label.display === "string") {
        this.labelsByString.set(label.display as string, label)
      }
    }
  }

  createLabel(strokeData: string | Position[][]) {
    const label = new MetaLabel(strokeData, constraints.variable(0))
    label.variable.represents = { object: label, property: "label-value" }
    this.labelsById.set(label.id, label)
    if (typeof strokeData === "string") {
      this.labelsByString.set(label.display as string, label)
    }
    return label
  }

  getLabelByString(textLabel: string): MetaLabel | undefined {
    return this.labelsByString.get(textLabel)
  }

  getLabelById(id: number): MetaLabel | undefined {
    return this.labelsById.get(id)
  }

  isEmpty() {
    return this.labelsById.size === 0
  }

  list(): Array<MetaLabel> {
    return Array.from(this.labelsById.values())
  }

  wireTo(that: MetaValue): MetaStructConnection | null {
    if (that instanceof MetaStruct) {
      return new MetaStructConnection(this, that)
    } else {
      console.error("You can't wire those things together silly billy!")
      return null
    }
  }
}

// TODO: this class is implemented in an ad-hoc way and needs more thinking
export class MetaStructConnection implements MetaConnection {
  b: MetaStruct
  private readonly constraints: Constraint[] = []

  constructor(a: MetaStruct, b: MetaStruct) {
    // Make sure 'b' is the empty one, so we always unify towards the empty struct
    if (a.isEmpty()) {
      ;[a, b] = [b, a]
    }

    // Handle case when wiring two gizmos together
    if (!b.isEmpty()) {
      for (const [id, a_label] of a.labelsByString.entries()) {
        const b_label = b.labelsByString.get(id)
        if (b_label) {
          this.constraints.push(constraints.equals(b_label.variable, a_label.variable))
        }
      }
    } else {
      // Just point to the same Map in memory is fine here?
      b.labelsById = a.labelsById
    }
    this.b = b
  }

  // TODO: figure out how to do pausing for this kind of connection

  get paused() {
    return false
  }

  togglePaused(newValue: boolean): boolean {
    return false
  }

  remove() {
    this.b.labelsById = new Map()
    for (const constraint of this.constraints) {
      constraint.remove()
    }
    return
  }
}
