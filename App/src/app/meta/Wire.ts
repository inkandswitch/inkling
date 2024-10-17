import { distanceToPath } from "../../lib/helpers"
import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import * as constraints from "../Constraints"
import { Constraint, Variable } from "../Constraints"
import { GameObject } from "../GameObject"
import SVG from "../Svg"
import Gizmo from "./Gizmo"
import NumberToken from "./NumberToken"
import { Connection, PlugId, VariableId } from "./Pluggable"
import PropertyPicker from "./PropertyPicker"
import Token from "./Token"

type SerializedConnection = {
  objId: number
  plugId: PlugId
  variableId: VariableId
}

export type SerializedWire = {
  type: "Wire"
  a: SerializedConnection
  b?: SerializedConnection
  constraintId?: number
  toPosition?: Position
}

export default class Wire extends GameObject {
  constraint?: Constraint
  private b?: Connection
  toPosition?: Position

  private readonly elm = SVG.add("polyline", SVG.wiresElm, { points: "", class: "wire" })

  constructor(readonly a: Connection) {
    super()
  }

  private static getObjById(id: number) {
    try {
      return Token.withId(id) as NumberToken | PropertyPicker
    } catch (e) {
      return Gizmo.withId(id)
    }
  }

  static deserializeConnection({ objId, plugId, variableId }: SerializedConnection): Connection {
    return { obj: this.getObjById(objId), plugId, variableId } as Connection
  }

  static deserialize(v: SerializedWire): Wire {
    const w = new Wire(this.deserializeConnection(v.a))
    if (v.b != null) {
      w.b = this.deserializeConnection(v.b)
      if (v.constraintId == null) throw new Error("We have a 'b' but no constraint")
      w.constraint = constraints.Constraint.withId(v.constraintId)
    } else {
      w.toPosition = v.toPosition
    }
    return w
  }

  serialize(): SerializedWire {
    return {
      type: "Wire",
      constraintId: this.constraint?.id,
      a: { objId: this.a.obj.id, plugId: this.a.plugId, variableId: this.a.variableId },
      b: this.b && { objId: this.b.obj.id, plugId: this.b.plugId, variableId: this.b.variableId },
      toPosition: this.toPosition
    }
  }

  distanceToPoint(point: Position) {
    return distanceToPath(point, this.getPoints())
  }

  togglePaused() {
    // TODO
  }

  get paused() {
    // TODO
    return false
  }

  private getPoints() {
    const a = this.a.obj.getPlugPosition(this.a.plugId)
    const b = this.toPosition ?? this.b!.obj.getPlugPosition(this.b!.plugId)
    return [a, b]
  }

  render(): void {
    SVG.update(this.elm, {
      points: SVG.points(this.getPoints()),
      "is-paused": this.paused
    })
  }

  isCollapsable() {
    const [p1, p2] = this.getPoints()
    return p1 && p2 && Vec.dist(p1, p2) < 10
  }

  attachEnd(b: Connection) {
    this.b = b
    this.toPosition = undefined
  }

  remove(): void {
    this.elm.remove()
    this.constraint?.remove()
    super.remove()
  }
}

export const aWire = (g: GameObject) => (g instanceof Wire ? g : null)
