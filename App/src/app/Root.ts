import { Position } from "../lib/types"
import {
  Constraint,
  deserializeConstraints,
  deserializeVariables,
  serializeConstraints,
  SerializedConstraint,
  SerializedVariable,
  serializeVariables,
  Variable
} from "./Constraints"
import { deserialize, SerializedGameObject } from "./Deserialize"
import { GameObject } from "./GameObject"
import Wire from "./meta/Wire"

export type SerializedRoot = {
  type: "Root"
  variables: SerializedVariable[]
  children: SerializedGameObject[]
  constraints: SerializedConstraint[]
  nextId: number
}

let nextId = 0
export function generateId() {
  return nextId++
}

export class Root extends GameObject {
  static current: Root

  serialize(): SerializedRoot {
    return {
      type: "Root",
      variables: serializeVariables(),
      children: Array.from(this.children).map((c) => c.serialize()),
      constraints: serializeConstraints(),
      nextId
    }
  }

  static roundtrip() {
    let stale = Root.current.serialize()
    const staleJSON = JSON.stringify(stale)
    stale = JSON.parse(staleJSON)
    Root.deserialize(stale)
    let fresh = Root.current.serialize()
    const freshJSON = JSON.stringify(fresh)
    if (staleJSON === freshJSON) return true
    debugger
  }

  static deserialize(v: SerializedRoot): Root {
    Root.current?.remove()

    if (Constraint.all.size !== 0) {
      throw new Error("clean up didn't work as expected (constraints!)")
    }
    if (Variable.all.size !== 0) {
      throw new Error("clean up didn't work as expected (variables!)")
    }

    nextId = 0
    const { variables, children, constraints } = v
    const root = (Root.current = new Root())
    deserializeVariables(variables)
    const wires = []
    for (const c of children) {
      const go = deserialize(c)
      root.adopt(go)
      if (go instanceof Wire && c.type === "Wire") {
        wires.push({ go, c })
      }
    }
    deserializeConstraints(constraints)
    for (const { go, c } of wires) {
      go.deserializeConstraint(c)
    }
    nextId = v.nextId
    return root
  }

  distanceToPoint(point: Position) {
    return null
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t)
    }
  }

  override remove() {
    this.children.forEach((child) => child.remove())
  }
}

;(window as any).Root = Root
