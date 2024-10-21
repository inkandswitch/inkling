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
import Handle, { aCanonicalHandle, aHandle } from "./ink/Handle"
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

presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":0,"value":222.26322900179935},{"id":1,"value":700.8890272102917},{"id":3,"value":465.31337004146354},{"id":4,"value":493.4726978115068},{"id":7,"value":319.5229292242607},{"id":8,"value":5.57672715058016},{"id":9,"value":319.5229292242607},{"id":94,"value":319.5229292242607},{"id":97,"value":319.5229292242607},{"id":107,"value":319.5229292242607},{"id":139,"value":474.9916076660156},{"id":140,"value":319.07989501953125}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"Handle","id":2,"position":{"x":222.26322900179935,"y":700.8890272102917},"xVariableId":0,"yVariableId":1},{"type":"Handle","id":5,"position":{"x":465.31337004146354,"y":493.4726978115068},"xVariableId":3,"yVariableId":4},{"type":"Gizmo","id":11,"distanceVariableId":7,"angleInRadiansVariableId":8,"angleInDegreesVariableId":9,"aHandleId":2,"bHandleId":5},{"type":"Wire","constraintId":96,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":95,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":95,"propertyName":"distance","variableId":94,"position":{"x":437.8830871582031,"y":789.1812133789062}},{"type":"PropertyPicker","id":98,"propertyName":"angleInDegrees","variableId":97,"position":{"x":437.8830871582031,"y":749.1812133789062}},{"type":"Wire","constraintId":99,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":98,"type":"token","plugId":"input","variableId":"value"}},{"type":"NumberToken","id":108,"position":{"x":593.9871826171875,"y":743.8717651367188},"variableId":107},{"type":"Wire","constraintId":109,"a":{"objId":98,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":108,"type":"token","plugId":"center","variableId":"value"}},{"type":"Wire","constraintId":121,"a":{"objId":95,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":108,"type":"token","plugId":"center","variableId":"value"}},{"type":"Lead","handle":{"type":"Handle","id":141,"position":{"x":474.9916076660156,"y":319.07989501953125},"xVariableId":139,"yVariableId":140}}],"constraints":[{"type":"polarVector","id":6,"aHandleId":2,"bHandleId":5,"distanceVariableId":7,"angleVariableId":8},{"type":"linearRelationship","id":10,"yVariableId":9,"m":57.29577951308232,"xVariableId":8,"b":0},{"type":"linearRelationship","id":96,"yVariableId":7,"m":1,"xVariableId":94,"b":0},{"type":"linearRelationship","id":99,"yVariableId":9,"m":1,"xVariableId":97,"b":0},{"type":"linearRelationship","id":109,"yVariableId":97,"m":1,"xVariableId":107,"b":0},{"type":"linearRelationship","id":121,"yVariableId":94,"m":1,"xVariableId":107,"b":0}],"nextId":142}'
  )
])

presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":0,"value":400.2311207141256},{"id":1,"value":492.20194923809487},{"id":3,"value":334.49248051240414},{"id":4,"value":553.5042297796984},{"id":7,"value":89.88625264840479},{"id":8,"value":-10.175269594546826},{"id":9,"value":-583.0000031753256},{"id":106,"value":-583.0000031753256},{"id":121,"value":-583.0000031753256},{"id":915,"value":334.49248051240414},{"id":916,"value":553.5042297796984},{"id":919,"value":383.3246272420377},{"id":920,"value":219.08926836238354},{"id":923,"value":337.9614624134909},{"id":924,"value":-1.425798489762084},{"id":925,"value":-81.69223589949412},{"id":1119,"value":320.4713436024342},{"id":1120,"value":649.5244856512754},{"id":1122,"value":334.49248051240414},{"id":1123,"value":553.5042297796984},{"id":1126,"value":97.03853703730996},{"id":1127,"value":-1.425798489762084},{"id":1128,"value":-81.69223589949412},{"id":1426,"value":-81.69223589949412},{"id":1460,"value":-81.69223589949412},{"id":3470,"value":435},{"id":3472,"value":1},{"id":3474,"value":337.9614624134909},{"id":3476,"value":97.03853703730996},{"id":3480,"value":435},{"id":3557,"value":337.9614624134909},{"id":3736,"value":97.03853703730996}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"Handle","id":2,"position":{"x":400.2311207141256,"y":492.20194923809487},"xVariableId":0,"yVariableId":1},{"type":"Handle","id":5,"position":{"x":334.49248051240414,"y":553.5042297796984},"xVariableId":3,"yVariableId":4},{"type":"Gizmo","id":11,"distanceVariableId":7,"angleInRadiansVariableId":8,"angleInDegreesVariableId":9,"aHandleId":2,"bHandleId":5},{"type":"PropertyPicker","id":107,"propertyName":"angleInDegrees","variableId":106,"position":{"x":500,"y":506}},{"type":"Wire","constraintId":108,"a":{"objId":11,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":107,"type":"token","plugId":"input","variableId":"value"}},{"type":"NumberToken","id":122,"position":{"x":715.7548828125,"y":488},"variableId":121},{"type":"Wire","constraintId":123,"a":{"objId":107,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":122,"type":"token","plugId":"center","variableId":"value"}},{"type":"Handle","id":917,"position":{"x":334.49248051240414,"y":553.5042297796984},"xVariableId":915,"yVariableId":916},{"type":"Handle","id":921,"position":{"x":383.3246272420377,"y":219.08926836238354},"xVariableId":919,"yVariableId":920},{"type":"Gizmo","id":927,"distanceVariableId":923,"angleInRadiansVariableId":924,"angleInDegreesVariableId":925,"aHandleId":917,"bHandleId":921},{"type":"Handle","id":1121,"position":{"x":320.4713436024342,"y":649.5244856512754},"xVariableId":1119,"yVariableId":1120},{"type":"Handle","id":1124,"position":{"x":334.49248051240414,"y":553.5042297796984},"xVariableId":1122,"yVariableId":1123},{"type":"Gizmo","id":1130,"distanceVariableId":1126,"angleInRadiansVariableId":1127,"angleInDegreesVariableId":1128,"aHandleId":1121,"bHandleId":1124},{"type":"PropertyPicker","id":1427,"propertyName":"angleInDegrees","variableId":1426,"position":{"x":175,"y":417}},{"type":"Wire","constraintId":1428,"a":{"objId":927,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":1427,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":1461,"propertyName":"angleInDegrees","variableId":1460,"position":{"x":158,"y":519}},{"type":"Wire","constraintId":1462,"a":{"objId":1130,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":1461,"type":"token","plugId":"input","variableId":"value"}},{"type":"Wire","constraintId":1556,"a":{"objId":1427,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":1461,"type":"token","plugId":"output","variableId":"value"}},{"type":"LinearToken","id":3469,"position":{"x":448,"y":708},"y":{"type":"NumberToken","id":3471,"position":{"x":686.818359375,"y":708},"variableId":3470},"m":{"type":"NumberToken","id":3473,"position":{"x":448,"y":708},"variableId":3472},"x":{"type":"NumberToken","id":3475,"position":{"x":511.490234375,"y":708},"variableId":3474},"b":{"type":"NumberToken","id":3477,"position":{"x":603.87890625,"y":708},"variableId":3476}},{"type":"Wire","constraintId":3559,"a":{"objId":927,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":3558,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":3558,"propertyName":"distance","variableId":3557,"position":{"x":607,"y":358}},{"type":"Wire","constraintId":3738,"a":{"objId":1130,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":3737,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":3737,"propertyName":"distance","variableId":3736,"position":{"x":619,"y":609}},{"type":"Wire","constraintId":3878,"a":{"objId":3558,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":3475,"type":"token","plugId":"center","variableId":"value"}},{"type":"Wire","constraintId":3923,"a":{"objId":3737,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":3477,"type":"token","plugId":"center","variableId":"value"}}],"constraints":[{"type":"polarVector","id":6,"aHandleId":2,"bHandleId":5,"distanceVariableId":7,"angleVariableId":8},{"type":"linearRelationship","id":10,"yVariableId":9,"m":57.29577951308232,"xVariableId":8,"b":0},{"type":"linearRelationship","id":108,"yVariableId":9,"m":1,"xVariableId":106,"b":0},{"type":"linearRelationship","id":123,"yVariableId":106,"m":1,"xVariableId":121,"b":0},{"type":"absorb","id":918,"parentHandleId":5,"childHandleId":917},{"type":"polarVector","id":922,"aHandleId":917,"bHandleId":921,"distanceVariableId":923,"angleVariableId":924},{"type":"linearRelationship","id":926,"yVariableId":925,"m":57.29577951308232,"xVariableId":924,"b":0},{"type":"polarVector","id":1125,"aHandleId":1121,"bHandleId":1124,"distanceVariableId":1126,"angleVariableId":1127},{"type":"linearRelationship","id":1129,"yVariableId":1128,"m":57.29577951308232,"xVariableId":1127,"b":0},{"type":"absorb","id":1251,"parentHandleId":5,"childHandleId":1124},{"type":"linearRelationship","id":1428,"yVariableId":925,"m":1,"xVariableId":1426,"b":0},{"type":"linearRelationship","id":1462,"yVariableId":1128,"m":1,"xVariableId":1460,"b":0},{"type":"linearRelationship","id":1556,"yVariableId":1426,"m":1,"xVariableId":1460,"b":0},{"type":"constant","id":3478,"variableId":3472,"value":1},{"type":"linearFormula","id":3481,"mVariableId":3472,"xVariableId":3474,"bVariableId":3476,"resultVariableId":3480},{"type":"linearRelationship","id":3482,"yVariableId":3480,"m":1,"xVariableId":3470,"b":0},{"type":"linearRelationship","id":3559,"yVariableId":923,"m":1,"xVariableId":3557,"b":0},{"type":"linearRelationship","id":3738,"yVariableId":1126,"m":1,"xVariableId":3736,"b":0},{"type":"linearRelationship","id":3878,"yVariableId":3557,"m":1,"xVariableId":3474,"b":0},{"type":"linearRelationship","id":3923,"yVariableId":3736,"m":1,"xVariableId":3476,"b":0},{"type":"constant","id":4069,"variableId":3480,"value":435},{"type":"constant","id":4070,"variableId":3470,"value":435},{"type":"pin","id":5041,"handleId":1121,"position":{"x":320.4713436024342,"y":649.5244856512754}},{"type":"pin","id":20931,"handleId":2,"position":{"x":400.2311207141256,"y":492.20194923809487}}],"nextId":22877}'
  )
])

presets.push([
  true,
  JSON.parse(
    '{"type":"Root","variables":[{"id":23026,"value":495.5251821264474},{"id":23027,"value":715.922369332558},{"id":23029,"value":399.0339517763286},{"id":23030,"value":370.22307460858895},{"id":23033,"value":358.91302214078144},{"id":23034,"value":-1.8429878475079284},{"id":23035,"value":-105.59542535610446},{"id":23182,"value":399.0339517763286},{"id":23183,"value":370.22307460858895},{"id":23186,"value":384.0384386342179},{"id":23187,"value":316.4986485428939},{"id":23190,"value":55.7779180356615},{"id":23191,"value":-1.8429878475079284},{"id":23192,"value":-105.59542535610446},{"id":23528,"value":414.6908950469903},{"id":23530,"value":1},{"id":23532,"value":55.7779180356615},{"id":23534,"value":358.91302214078144},{"id":23538,"value":414.6908950469903},{"id":23589,"value":399.0339517763286},{"id":23590,"value":370.22307460858895},{"id":23593,"value":512.9580078125},{"id":23594,"value":496.74853515625},{"id":23597,"value":170.25681399148306},{"id":23598,"value":0.837757955177526},{"id":23599,"value":47.999995085182235},{"id":24211,"value":-105.59542535610446},{"id":24247,"value":-105.59542535610446},{"id":24417,"value":358.91302214078144},{"id":24724,"value":55.7779180356615},{"id":24855,"value":47.999995085182235},{"id":25245,"value":47.999995085182235}],"children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"Handle","id":23028,"position":{"x":495.5251821264474,"y":715.922369332558},"xVariableId":23026,"yVariableId":23027},{"type":"Handle","id":23031,"position":{"x":399.0339517763286,"y":370.22307460858895},"xVariableId":23029,"yVariableId":23030},{"type":"Gizmo","id":23037,"distanceVariableId":23033,"angleInRadiansVariableId":23034,"angleInDegreesVariableId":23035,"aHandleId":23028,"bHandleId":23031},{"type":"Handle","id":23184,"position":{"x":399.0339517763286,"y":370.22307460858895},"xVariableId":23182,"yVariableId":23183},{"type":"Handle","id":23188,"position":{"x":384.0384386342179,"y":316.4986485428939},"xVariableId":23186,"yVariableId":23187},{"type":"Gizmo","id":23194,"distanceVariableId":23190,"angleInRadiansVariableId":23191,"angleInDegreesVariableId":23192,"aHandleId":23184,"bHandleId":23188},{"type":"LinearToken","id":23527,"position":{"x":78.58203125,"y":733.9239501953125},"y":{"type":"NumberToken","id":23529,"position":{"x":317.400390625,"y":733.9239501953125},"variableId":23528},"m":{"type":"NumberToken","id":23531,"position":{"x":78.58203125,"y":733.9239501953125},"variableId":23530},"x":{"type":"NumberToken","id":23533,"position":{"x":142.072265625,"y":733.9239501953125},"variableId":23532},"b":{"type":"NumberToken","id":23535,"position":{"x":220.01171875,"y":733.9239501953125},"variableId":23534}},{"type":"Handle","id":23591,"position":{"x":399.0339517763286,"y":370.22307460858895},"xVariableId":23589,"yVariableId":23590},{"type":"Handle","id":23595,"position":{"x":512.9580078125,"y":496.74853515625},"xVariableId":23593,"yVariableId":23594},{"type":"Gizmo","id":23601,"distanceVariableId":23597,"angleInRadiansVariableId":23598,"angleInDegreesVariableId":23599,"aHandleId":23591,"bHandleId":23595},{"type":"PropertyPicker","id":24212,"propertyName":"angleInDegrees","variableId":24211,"position":{"x":306.11376953125,"y":482.09521484375}},{"type":"Wire","constraintId":24213,"a":{"objId":23037,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":24212,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":24248,"propertyName":"angleInDegrees","variableId":24247,"position":{"x":307.130859375,"y":362.7791748046875}},{"type":"Wire","constraintId":24249,"a":{"objId":23194,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":24248,"type":"token","plugId":"input","variableId":"value"}},{"type":"Wire","constraintId":24287,"a":{"objId":24248,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":24212,"type":"token","plugId":"output","variableId":"value"}},{"type":"Wire","constraintId":24419,"a":{"objId":23037,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":24418,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":24418,"propertyName":"distance","variableId":24417,"position":{"x":229.2724609375,"y":600.5672607421875}},{"type":"Wire","constraintId":24726,"a":{"objId":23194,"type":"gizmo","plugId":"center","variableId":"distance"},"b":{"objId":24725,"type":"token","plugId":"input","variableId":"value"}},{"type":"PropertyPicker","id":24725,"propertyName":"distance","variableId":24724,"position":{"x":202.20263671875,"y":299.353271484375}},{"type":"PropertyPicker","id":24856,"propertyName":"angleInDegrees","variableId":24855,"position":{"x":849.14501953125,"y":548.04345703125}},{"type":"Wire","constraintId":24857,"a":{"objId":23601,"type":"gizmo","plugId":"center","variableId":"angleInDegrees"},"b":{"objId":24856,"type":"token","plugId":"input","variableId":"value"}},{"type":"Wire","constraintId":25023,"a":{"objId":24418,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":23535,"type":"token","plugId":"center","variableId":"value"}},{"type":"Wire","constraintId":25064,"a":{"objId":24725,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":23533,"type":"token","plugId":"center","variableId":"value"}},{"type":"NumberToken","id":25246,"position":{"x":880.689453125,"y":635.4169921875},"variableId":25245},{"type":"Wire","constraintId":25247,"a":{"objId":24856,"type":"token","plugId":"output","variableId":"value"},"b":{"objId":25246,"type":"token","plugId":"center","variableId":"value"}}],"constraints":[{"type":"polarVector","id":23032,"aHandleId":23028,"bHandleId":23031,"distanceVariableId":23033,"angleVariableId":23034},{"type":"linearRelationship","id":23036,"yVariableId":23035,"m":57.29577951308232,"xVariableId":23034,"b":0},{"type":"absorb","id":23185,"parentHandleId":23031,"childHandleId":23184},{"type":"polarVector","id":23189,"aHandleId":23184,"bHandleId":23188,"distanceVariableId":23190,"angleVariableId":23191},{"type":"linearRelationship","id":23193,"yVariableId":23192,"m":57.29577951308232,"xVariableId":23191,"b":0},{"type":"constant","id":23536,"variableId":23530,"value":1},{"type":"linearFormula","id":23539,"mVariableId":23530,"xVariableId":23532,"bVariableId":23534,"resultVariableId":23538},{"type":"linearRelationship","id":23540,"yVariableId":23538,"m":1,"xVariableId":23528,"b":0},{"type":"absorb","id":23592,"parentHandleId":23031,"childHandleId":23591},{"type":"polarVector","id":23596,"aHandleId":23591,"bHandleId":23595,"distanceVariableId":23597,"angleVariableId":23598},{"type":"linearRelationship","id":23600,"yVariableId":23599,"m":57.29577951308232,"xVariableId":23598,"b":0},{"type":"pin","id":24155,"handleId":23595,"position":{"x":512.9580078125,"y":496.74853515625}},{"type":"pin","id":24182,"handleId":23028,"position":{"x":495.5251821264474,"y":715.922369332558}},{"type":"linearRelationship","id":24213,"yVariableId":23035,"m":1,"xVariableId":24211,"b":0},{"type":"linearRelationship","id":24249,"yVariableId":23192,"m":1,"xVariableId":24247,"b":0},{"type":"linearRelationship","id":24287,"yVariableId":24247,"m":1,"xVariableId":24211,"b":0},{"type":"linearRelationship","id":24419,"yVariableId":23033,"m":1,"xVariableId":24417,"b":0},{"type":"linearRelationship","id":24726,"yVariableId":23190,"m":1,"xVariableId":24724,"b":0},{"type":"linearRelationship","id":24857,"yVariableId":23599,"m":1,"xVariableId":24855,"b":0},{"type":"linearRelationship","id":25023,"yVariableId":24417,"m":1,"xVariableId":23534,"b":0},{"type":"linearRelationship","id":25064,"yVariableId":24724,"m":1,"xVariableId":23532,"b":0},{"type":"constant","id":25200,"variableId":23538,"value":414.6908950469903},{"type":"constant","id":25201,"variableId":23528,"value":414.6908950469903},{"type":"linearRelationship","id":25247,"yVariableId":24855,"m":1,"xVariableId":25245,"b":0}],"nextId":67893}'
  )
])
