import { Position } from "../lib/types"
import {
  deserializeConstraints,
  deserializeVariables,
  serializeConstraints,
  SerializedConstraint,
  SerializedVariable,
  serializeVariables
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
  serialize(): SerializedRoot {
    return {
      type: "Root",
      variables: serializeVariables(),
      children: Array.from(this.children).map((c) => c.serialize()),
      constraints: serializeConstraints(),
      nextId
    }
  }

  static deserialize(v: SerializedRoot): Root {
    const { variables, children, constraints } = v
    const root = new Root()
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
}
