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
import { aCanonicalHandle } from "./ink/Handle"
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
  static preset = 2

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

    Root.current.forEach({
      what: aCanonicalHandle,
      do: (go) => {
        go.togglePin()
        go.togglePin()
      }
    })

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

// Spiral
presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":0,"value":222.26322900179935},{"id":1,"value":700.8890272102917},{"id":3,"value":465.31337004146354},{"id":4,"value":493.4726978115068},{"id":7,"value":319.5229292242607},{"id":8,"value":5.57672715058016},{"id":9,"value":319.5229292242607},{"id":94,"value":319.5229292242607},{"id":97,"value":319.5229292242607},{"id":107,"value":319.5229292242607},{"id":139,"value":474.9916076660156},{"id":140,"value":319.07989501953125}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"Handle","id":2,"position":{"x":222.26322900179935,"y":700.8890272102917},"xVariableId":0,"yVariableId":1},{"type":"Handle","id":5,"position":{"x":465.31337004146354,"y":493.4726978115068},"xVariableId":3,"yVariableId":4},{"type":"Gizmo","id":11,"distanceVariableId":7,"angleInRadiansVariableId":8,"angleInDegreesVariableId":9,"aHandleId":2,"bHandleId":5},{"type":"Wire","constraintId":96,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":95,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":95,"propertyName":"distance","variableId":94,"position":{"x":437.8830871582031,"y":789.1812133789062}},{"type":"PropertyPicker","id":98,"propertyName":"angleInDegrees","variableId":97,"position":{"x":437.8830871582031,"y":749.1812133789062}},{"type":"Wire","constraintId":99,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":98,"type":"token","plugId":"input","variableId":"value"}},{"type":"NumberToken","id":108,"position":{"x":593.9871826171875,"y":743.8717651367188},"variableId":107},{"type":"Wire","constraintId":109,"a":{"objId":98,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":108,"type":"token","plugId":"center","variableId":"value"}},{"type":"Wire","constraintId":121,"a":{"objId":95,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":108,"type":"token","plugId":"center","variableId":"value"}},{"type":"Lead","handle":{"type":"Handle","id":141,"position":{"x":474.9916076660156,"y":319.07989501953125},"xVariableId":139,"yVariableId":140}}],"constraints":[{"type":"polarVector","id":6,"aHandleId":2,"bHandleId":5,"distanceVariableId":7,"angleVariableId":8},{"type":"linearRelationship","id":10,"yVariableId":9,"m":57.29577951308232,"xVariableId":8,"b":0},{"type":"linearRelationship","id":96,"yVariableId":7,"m":1,"xVariableId":94,"b":0},{"type":"linearRelationship","id":99,"yVariableId":9,"m":1,"xVariableId":97,"b":0},{"type":"linearRelationship","id":109,"yVariableId":97,"m":1,"xVariableId":107,"b":0},{"type":"linearRelationship","id":121,"yVariableId":94,"m":1,"xVariableId":107,"b":0}],"nextId":142}'
  )
])

// Quick return
presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":0,"value":520.2311207141256},{"id":1,"value":630.2019492380948},{"id":3,"value":447.6308076402072},{"id":4,"value":600.8694942808069},{"id":7,"value":78.30196914670981},{"id":8,"value":-2.75761992837984},{"id":9,"value":-157.99998339733318},{"id":106,"value":-157.99998339733318},{"id":121,"value":-157.99998339733318},{"id":915,"value":447.6308076402072},{"id":916,"value":600.8694942808069},{"id":919,"value":397.2640408487997},{"id":920,"value":400.3328334957223},{"id":923,"value":206.76500073312044},{"id":924,"value":-1.8168664431428827},{"id":925,"value":-104.09877913103273},{"id":1119,"value":512.9713436024342},{"id":1120,"value":861.0244856512754},{"id":1122,"value":447.6308076402072},{"id":1123,"value":600.8694942808069},{"id":1126,"value":268.2349937402465},{"id":1127,"value":-1.8168664431428827},{"id":1128,"value":-104.09877913103273},{"id":1426,"value":-104.09877913103273},{"id":1460,"value":-104.09877913103273},{"id":3470,"value":475},{"id":3472,"value":1},{"id":3474,"value":206.76500073312044},{"id":3476,"value":268.2349937402465},{"id":3480,"value":475},{"id":3557,"value":206.76500073312044},{"id":3736,"value":268.2349937402465},{"id":37435,"value":397.2640408487997},{"id":37436,"value":400.3328334957223},{"id":37439,"value":397.26405915989056},{"id":37440,"value":220.94687050493278},{"id":37443,"value":179.38596299079046},{"id":37444,"value":-1.5707963267948966},{"id":37445,"value":-90},{"id":72798,"value":397.26405915989056},{"id":72799,"value":220.94687050493278},{"id":72802,"value":574.3196112645863},{"id":72803,"value":220.4760550960283},{"id":72806,"value":177.05617374305234},{"id":72807,"value":-0.002659101655544949},{"id":72808,"value":-0.15235530215897558},{"id":77147,"value":397.26405915989056},{"id":77148,"value":220.94687050493278},{"id":77151,"value":237.8294175879649},{"id":77152,"value":220.7021429647794},{"id":77155,"value":159.43483225038977},{"id":77156,"value":-3.1400577189993824},{"id":77157,"value":-179.9120547261408}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"Handle","id":2,"position":{"x":520.2311207141256,"y":630.2019492380948},"xVariableId":0,"yVariableId":1},{"type":"Handle","id":5,"position":{"x":447.6308076402072,"y":600.8694942808069},"xVariableId":3,"yVariableId":4},{"type":"Gizmo","id":11,"distanceVariableId":7,"angleInRadiansVariableId":8,"angleInDegreesVariableId":9,"aHandleId":2,"bHandleId":5},{"type":"PropertyPicker","id":107,"propertyName":"angleInDegrees","variableId":106,"position":{"x":506.5,"y":368.5}},{"type":"Wire","constraintId":108,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":107,"type":"token","plugId":"input","variableId":"value"}},{"type":"NumberToken","id":122,"position":{"x":739.2548828125,"y":369},"variableId":121},{"type":"Wire","constraintId":123,"a":{"objId":107,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":122,"type":"token","plugId":"center","variableId":"value"}},{"type":"Handle","id":917,"position":{"x":447.6308076402072,"y":600.8694942808069},"xVariableId":915,"yVariableId":916},{"type":"Handle","id":921,"position":{"x":397.2640408487997,"y":400.3328334957223},"xVariableId":919,"yVariableId":920},{"type":"Gizmo","id":927,"distanceVariableId":923,"angleInRadiansVariableId":924,"angleInDegreesVariableId":925,"aHandleId":917,"bHandleId":921},{"type":"Handle","id":1121,"position":{"x":512.9713436024342,"y":861.0244856512754},"xVariableId":1119,"yVariableId":1120},{"type":"Handle","id":1124,"position":{"x":447.6308076402072,"y":600.8694942808069},"xVariableId":1122,"yVariableId":1123},{"type":"Gizmo","id":1130,"distanceVariableId":1126,"angleInRadiansVariableId":1127,"angleInDegreesVariableId":1128,"aHandleId":1121,"bHandleId":1124},{"type":"PropertyPicker","id":1427,"propertyName":"angleInDegrees","variableId":1426,"position":{"x":111,"y":479.5}},{"type":"Wire","constraintId":1428,"a":{"objId":927,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":1427,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":1461,"propertyName":"angleInDegrees","variableId":1460,"position":{"x":135,"y":710.5}},{"type":"Wire","constraintId":1462,"a":{"objId":1130,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":1461,"type":"token","plugId":"input","variableId":"value"}},{"type":"Wire","constraintId":1556,"a":{"objId":1427,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":1461,"type":"token","plugId":"output","variableId":"value"}},{"type":"LinearToken","id":3469,"position":{"x":524,"y":1070.5},"y":{"type":"NumberToken","id":3471,"position":{"x":777.267578125,"y":1070.5},"variableId":3470},"m":{"type":"NumberToken","id":3473,"position":{"x":524,"y":1070.5},"variableId":3472},"x":{"type":"NumberToken","id":3475,"position":{"x":587.490234375,"y":1070.5},"variableId":3474},"b":{"type":"NumberToken","id":3477,"position":{"x":679.87890625,"y":1070.5},"variableId":3476}},{"type":"Wire","constraintId":3559,"a":{"objId":927,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":3558,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":3558,"propertyName":"distance","variableId":3557,"position":{"x":597.5,"y":486}},{"type":"Wire","constraintId":3738,"a":{"objId":1130,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":3737,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":3737,"propertyName":"distance","variableId":3736,"position":{"x":688,"y":724}},{"type":"Wire","constraintId":3878,"a":{"objId":3558,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":3475,"type":"token","plugId":"center","variableId":"value"}},{"type":"Wire","constraintId":3923,"a":{"objId":3737,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":3477,"type":"token","plugId":"center","variableId":"value"}},{"type":"Handle","id":37437,"position":{"x":397.2640408487997,"y":400.3328334957223},"xVariableId":37435,"yVariableId":37436},{"type":"Handle","id":37441,"position":{"x":397.26405915989056,"y":220.94687050493278},"xVariableId":37439,"yVariableId":37440},{"type":"Gizmo","id":37447,"distanceVariableId":37443,"angleInRadiansVariableId":37444,"angleInDegreesVariableId":37445,"aHandleId":37437,"bHandleId":37441},{"type":"Handle","id":72800,"position":{"x":397.26405915989056,"y":220.94687050493278},"xVariableId":72798,"yVariableId":72799},{"type":"Handle","id":72804,"position":{"x":574.3196112645863,"y":220.4760550960283},"xVariableId":72802,"yVariableId":72803},{"type":"Gizmo","id":72810,"distanceVariableId":72806,"angleInRadiansVariableId":72807,"angleInDegreesVariableId":72808,"aHandleId":72800,"bHandleId":72804},{"type":"Handle","id":77149,"position":{"x":397.26405915989056,"y":220.94687050493278},"xVariableId":77147,"yVariableId":77148},{"type":"Handle","id":77153,"position":{"x":237.8294175879649,"y":220.7021429647794},"xVariableId":77151,"yVariableId":77152},{"type":"Gizmo","id":77159,"distanceVariableId":77155,"angleInRadiansVariableId":77156,"angleInDegreesVariableId":77157,"aHandleId":77149,"bHandleId":77153}],"constraints":[{"type":"polarVector","id":6,"aHandleId":2,"bHandleId":5,"distanceVariableId":7,"angleVariableId":8},{"type":"linearRelationship","id":10,"yVariableId":9,"m":57.29577951308232,"xVariableId":8,"b":0},{"type":"linearRelationship","id":108,"yVariableId":9,"m":1,"xVariableId":106,"b":0},{"type":"linearRelationship","id":123,"yVariableId":106,"m":1,"xVariableId":121,"b":0},{"type":"absorb","id":918,"parentHandleId":5,"childHandleId":917},{"type":"polarVector","id":922,"aHandleId":917,"bHandleId":921,"distanceVariableId":923,"angleVariableId":924},{"type":"linearRelationship","id":926,"yVariableId":925,"m":57.29577951308232,"xVariableId":924,"b":0},{"type":"polarVector","id":1125,"aHandleId":1121,"bHandleId":1124,"distanceVariableId":1126,"angleVariableId":1127},{"type":"linearRelationship","id":1129,"yVariableId":1128,"m":57.29577951308232,"xVariableId":1127,"b":0},{"type":"absorb","id":1251,"parentHandleId":5,"childHandleId":1124},{"type":"linearRelationship","id":1428,"yVariableId":925,"m":1,"xVariableId":1426,"b":0},{"type":"linearRelationship","id":1462,"yVariableId":1128,"m":1,"xVariableId":1460,"b":0},{"type":"linearRelationship","id":1556,"yVariableId":1426,"m":1,"xVariableId":1460,"b":0},{"type":"constant","id":3478,"variableId":3472,"value":1},{"type":"linearFormula","id":3481,"mVariableId":3472,"xVariableId":3474,"bVariableId":3476,"resultVariableId":3480},{"type":"linearRelationship","id":3482,"yVariableId":3480,"m":1,"xVariableId":3470,"b":0},{"type":"linearRelationship","id":3559,"yVariableId":923,"m":1,"xVariableId":3557,"b":0},{"type":"linearRelationship","id":3738,"yVariableId":1126,"m":1,"xVariableId":3736,"b":0},{"type":"linearRelationship","id":3878,"yVariableId":3557,"m":1,"xVariableId":3474,"b":0},{"type":"linearRelationship","id":3923,"yVariableId":3736,"m":1,"xVariableId":3476,"b":0},{"type":"constant","id":4069,"variableId":3480,"value":475},{"type":"constant","id":4070,"variableId":3470,"value":475},{"type":"absorb","id":37438,"parentHandleId":921,"childHandleId":37437},{"type":"polarVector","id":37442,"aHandleId":37437,"bHandleId":37441,"distanceVariableId":37443,"angleVariableId":37444},{"type":"linearRelationship","id":37446,"yVariableId":37445,"m":57.29577951308232,"xVariableId":37444,"b":0},{"type":"constant","id":55287,"variableId":37445,"value":-90},{"type":"constant","id":55288,"variableId":37444,"value":-1.5707963267948966},{"type":"absorb","id":72801,"parentHandleId":37441,"childHandleId":72800},{"type":"polarVector","id":72805,"aHandleId":72800,"bHandleId":72804,"distanceVariableId":72806,"angleVariableId":72807},{"type":"linearRelationship","id":72809,"yVariableId":72808,"m":57.29577951308232,"xVariableId":72807,"b":0},{"type":"constant","id":73588,"variableId":72806,"value":177.05617374305234},{"type":"constant","id":73648,"variableId":72808,"value":-0.15235530215897558},{"type":"constant","id":73649,"variableId":72807,"value":-0.002659101655544949},{"type":"absorb","id":77150,"parentHandleId":37441,"childHandleId":77149},{"type":"polarVector","id":77154,"aHandleId":77149,"bHandleId":77153,"distanceVariableId":77155,"angleVariableId":77156},{"type":"linearRelationship","id":77158,"yVariableId":77157,"m":57.29577951308232,"xVariableId":77156,"b":0},{"type":"constant","id":77764,"variableId":77155,"value":159.43483225038977},{"type":"constant","id":77832,"variableId":77157,"value":-179.9120547261408},{"type":"constant","id":77833,"variableId":77156,"value":-3.1400577189993824},{"type":"pin","id":82108,"handleId":2,"position":{"x":520.2311207141256,"y":630.2019492380948}},{"type":"pin","id":82116,"handleId":1121,"position":{"x":512.9713436024342,"y":861.0244856512754}}],"nextId":93082}'
  )
])
