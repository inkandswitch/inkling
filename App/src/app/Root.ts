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

presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":0,"value":426.17793734669044},{"id":1,"value":744.2030089329814},{"id":3,"value":588.4755938724996},{"id":4,"value":744.2029883759097},{"id":7,"value":162.29766270375063},{"id":8,"value":-1.2666277626749434e-7},{"id":9,"value":-0.000007257242501537232},{"id":274,"value":704.7346626947303},{"id":275,"value":552.4908338915935},{"id":277,"value":704.7347536746347},{"id":278,"value":162.9531144694601},{"id":281,"value":389.537719422144},{"id":282,"value":-1.5707963267948966},{"id":283,"value":-90},{"id":647,"value":484.7407618365158},{"id":648,"value":162.95958405114806},{"id":650,"value":704.7347536746347},{"id":651,"value":162.9531144694601},{"id":654,"value":219.99392575043058},{"id":655,"value":-0.00002932296639472488},{"id":656,"value":-0.001680082217221679},{"id":1060,"value":704.7347536746347},{"id":1061,"value":162.9531144694601},{"id":1064,"value":921.4803772999768},{"id":1065,"value":162.96654785237902},{"id":1068,"value":216.74570200698946},{"id":1069,"value":0.00006188660926187084},{"id":1070,"value":0.0035458415190804298},{"id":13977,"value":393.6167907714844},{"id":13978,"value":1065.5265197753906},{"id":13980,"value":588.4755938724996},{"id":13981,"value":744.2029883759097},{"id":13984,"value":375.79084773973693},{"id":13985,"value":5.257519623083793},{"id":13986,"value":301.2336851099127},{"id":14440,"value":588.4755938724996},{"id":14441,"value":744.2029883759097},{"id":14444,"value":704.7346626947303},{"id":14445,"value":552.4908338915935},{"id":14448,"value":224.20916620703565},{"id":14449,"value":5.257519623083793},{"id":14450,"value":301.2336851099127},{"id":15497,"value":301.2336851099127},{"id":15583,"value":301.2336851099127},{"id":19045,"value":-0.000007257242501537232},{"id":19152,"value":-0.000007257242501537232},{"id":64619,"value":224.20916620703565},{"id":64746,"value":375.79084773973693},{"id":64878,"value":600},{"id":64880,"value":1},{"id":64882,"value":224.20916620703565},{"id":64884,"value":375.79084773973693},{"id":64888,"value":600}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}}],"constraints":[{"type":"polarVector","id":6,"aHandleId":2,"bHandleId":5,"distanceVariableId":7,"angleVariableId":8},{"type":"linearRelationship","id":10,"yVariableId":9,"m":57.29577951308232,"xVariableId":8,"b":0},{"type":"constant","id":179,"variableId":7,"value":162.29766270375063},{"type":"pin","id":271,"handleId":2,"position":{"x":426.17793734669044,"y":744.2030089329814}},{"type":"polarVector","id":280,"aHandleId":276,"bHandleId":279,"distanceVariableId":281,"angleVariableId":282},{"type":"linearRelationship","id":284,"yVariableId":283,"m":57.29577951308232,"xVariableId":282,"b":0},{"type":"constant","id":636,"variableId":283,"value":-90},{"type":"constant","id":637,"variableId":282,"value":-1.5707963267948966},{"type":"polarVector","id":653,"aHandleId":649,"bHandleId":652,"distanceVariableId":654,"angleVariableId":655},{"type":"linearRelationship","id":657,"yVariableId":656,"m":57.29577951308232,"xVariableId":655,"b":0},{"type":"absorb","id":1048,"parentHandleId":279,"childHandleId":652},{"type":"absorb","id":1063,"parentHandleId":279,"childHandleId":1062},{"type":"polarVector","id":1067,"aHandleId":1062,"bHandleId":1066,"distanceVariableId":1068,"angleVariableId":1069},{"type":"linearRelationship","id":1071,"yVariableId":1070,"m":57.29577951308232,"xVariableId":1069,"b":0},{"type":"constant","id":1999,"variableId":1068,"value":216.74570200698946},{"type":"constant","id":2116,"variableId":654,"value":219.99392575043058},{"type":"constant","id":8243,"variableId":1070,"value":0.0035458415190804298},{"type":"constant","id":8244,"variableId":1069,"value":0.00006188660926187084},{"type":"constant","id":9023,"variableId":656,"value":-0.001680082217221679},{"type":"constant","id":9024,"variableId":655,"value":-0.00002932296639472488},{"type":"polarVector","id":13983,"aHandleId":13979,"bHandleId":13982,"distanceVariableId":13984,"angleVariableId":13985},{"type":"linearRelationship","id":13987,"yVariableId":13986,"m":57.29577951308232,"xVariableId":13985,"b":0},{"type":"absorb","id":14414,"parentHandleId":5,"childHandleId":13982},{"type":"absorb","id":14443,"parentHandleId":5,"childHandleId":14442},{"type":"polarVector","id":14447,"aHandleId":14442,"bHandleId":14446,"distanceVariableId":14448,"angleVariableId":14449},{"type":"linearRelationship","id":14451,"yVariableId":14450,"m":57.29577951308232,"xVariableId":14449,"b":0},{"type":"absorb","id":14854,"parentHandleId":276,"childHandleId":14446},{"type":"pin","id":14893,"handleId":13979,"position":{"x":393.6167907714844,"y":1065.5265197753906}},{"type":"linearRelationship","id":15499,"yVariableId":14450,"m":1,"xVariableId":15497,"b":0},{"type":"linearRelationship","id":15585,"yVariableId":13986,"m":1,"xVariableId":15583,"b":0},{"type":"linearRelationship","id":15672,"yVariableId":15497,"m":1,"xVariableId":15583,"b":0},{"type":"linearRelationship","id":19047,"yVariableId":9,"m":1,"xVariableId":19045,"b":0},{"type":"linearRelationship","id":19154,"yVariableId":19045,"m":1,"xVariableId":19152,"b":0},{"type":"linearRelationship","id":64621,"yVariableId":14448,"m":1,"xVariableId":64619,"b":0},{"type":"linearRelationship","id":64748,"yVariableId":13984,"m":1,"xVariableId":64746,"b":0},{"type":"constant","id":64886,"variableId":64880,"value":1},{"type":"linearFormula","id":64889,"mVariableId":64880,"xVariableId":64882,"bVariableId":64884,"resultVariableId":64888},{"type":"linearRelationship","id":64890,"yVariableId":64888,"m":1,"xVariableId":64878,"b":0},{"type":"linearRelationship","id":65014,"yVariableId":64619,"m":1,"xVariableId":64882,"b":0},{"type":"linearRelationship","id":65079,"yVariableId":64746,"m":1,"xVariableId":64884,"b":0},{"type":"constant","id":65147,"variableId":64888,"value":600},{"type":"constant","id":65148,"variableId":64878,"value":600}],"nextId":156227}'
  )
])
