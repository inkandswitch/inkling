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
    const stale = Root.current.serialize()
    const json = JSON.stringify(stale)
    Root.deserialize(JSON.parse(json))
    const fresh = Root.current.serialize()
    return json === JSON.stringify(fresh)
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
    for (const c of children) {
      root.adopt(deserialize(c))
    }
    deserializeConstraints(constraints)
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
