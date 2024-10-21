import { clip } from "../lib/math"
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
import MetaToggle from "./gui/MetaToggle"
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
  static preset = 0

  serialize(): SerializedRoot {
    return {
      type: "Root",
      variables: serializeVariables(),
      children: Array.from(this.children).map((c) => c.serialize()),
      constraints: serializeConstraints(),
      nextId
    }
  }

  static reset() {
    const [metaMode, preset] = presets[Root.preset]
    Root.deserialize(preset)
    MetaToggle.toggle(metaMode)
  }

  static nextPreset() {
    this.preset = clip(this.preset + 1, 0, presets.length - 1)
    this.reset()
  }

  static prevPreset() {
    this.preset = clip(this.preset - 1, 0, presets.length - 1)
    this.reset()
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

const presets: [boolean, SerializedRoot][] = []

presets.push([
  false,
  {
    type: "Root",
    variables: [],
    children: [{ type: "MetaToggle", position: { x: 30, y: 30 } }],
    constraints: [],
    nextId: 0
  }
])

presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":0,"value":222.26322900179935},{"id":1,"value":700.8890272102917},{"id":3,"value":465.31337004146354},{"id":4,"value":493.4726978115068},{"id":7,"value":319.5229292242607},{"id":8,"value":5.57672715058016},{"id":9,"value":319.5229292242607},{"id":94,"value":319.5229292242607},{"id":97,"value":319.5229292242607},{"id":107,"value":319.5229292242607},{"id":139,"value":474.9916076660156},{"id":140,"value":319.07989501953125}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"Handle","id":2,"position":{"x":222.26322900179935,"y":700.8890272102917},"xVariableId":0,"yVariableId":1},{"type":"Handle","id":5,"position":{"x":465.31337004146354,"y":493.4726978115068},"xVariableId":3,"yVariableId":4},{"type":"Gizmo","id":11,"distanceVariableId":7,"angleInRadiansVariableId":8,"angleInDegreesVariableId":9,"aHandleId":2,"bHandleId":5},{"type":"Wire","constraintId":96,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":95,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":95,"propertyName":"distance","variableId":94,"position":{"x":437.8830871582031,"y":789.1812133789062}},{"type":"PropertyPicker","id":98,"propertyName":"angleInDegrees","variableId":97,"position":{"x":437.8830871582031,"y":749.1812133789062}},{"type":"Wire","constraintId":99,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":98,"type":"token","plugId":"input","variableId":"value"}},{"type":"NumberToken","id":108,"position":{"x":593.9871826171875,"y":743.8717651367188},"variableId":107},{"type":"Wire","constraintId":109,"a":{"objId":98,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":108,"type":"token","plugId":"center","variableId":"value"}},{"type":"Wire","constraintId":121,"a":{"objId":95,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":108,"type":"token","plugId":"center","variableId":"value"}},{"type":"Lead","handle":{"type":"Handle","id":141,"position":{"x":474.9916076660156,"y":319.07989501953125},"xVariableId":139,"yVariableId":140}}],"constraints":[{"type":"polarVector","id":6,"aHandleId":2,"bHandleId":5,"distanceVariableId":7,"angleVariableId":8},{"type":"linearRelationship","id":10,"yVariableId":9,"m":57.29577951308232,"xVariableId":8,"b":0},{"type":"linearRelationship","id":96,"yVariableId":7,"m":1,"xVariableId":94,"b":0},{"type":"linearRelationship","id":99,"yVariableId":9,"m":1,"xVariableId":97,"b":0},{"type":"linearRelationship","id":109,"yVariableId":97,"m":1,"xVariableId":107,"b":0},{"type":"linearRelationship","id":121,"yVariableId":94,"m":1,"xVariableId":107,"b":0}],"nextId":142}'
  )
])
