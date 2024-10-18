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
  type: "gizmo" | "token"
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

  constructor(private a: Connection) {
    super()
  }

  private static getObjById(type: "gizmo" | "token", id: number) {
    return type === "gizmo" ? Gizmo.withId(id) : (Token.withId(id) as NumberToken | PropertyPicker)
  }

  static deserializeConnection({ objId, type, plugId, variableId }: SerializedConnection): Connection {
    return { obj: this.getObjById(type, objId), plugId, variableId } as Connection
  }

  static deserialize(v: SerializedWire): Wire {
    const w = new Wire(null as unknown as Connection)
    return w
  }

  deserializeConstraint(v: SerializedWire) {
    this.a = Wire.deserializeConnection(v.a)
    this.b = v.b && Wire.deserializeConnection(v.b)
    this.toPosition = v.toPosition
    if (v.constraintId) this.constraint = constraints.Constraint.withId(v.constraintId)
  }

  serializeConnection(c: Connection): SerializedConnection {
    const type = c.obj instanceof Gizmo ? "gizmo" : "token"
    return { objId: c.obj.id, type, plugId: c.plugId, variableId: c.variableId }
  }

  serialize(): SerializedWire {
    return {
      type: "Wire",
      constraintId: this.constraint?.id,
      a: this.serializeConnection(this.a),
      b: this.b && this.serializeConnection(this.b),
      toPosition: this.toPosition
    }
  }

  distanceToPoint(point: Position) {
    return distanceToPath(point, this.getPoints())
  }

  private getPoints() {
    const a = this.a.obj.getPlugPosition(this.a.plugId)
    const b = this.toPosition ?? this.b!.obj.getPlugPosition(this.b!.plugId)
    return [a, b]
  }

  render(): void {
    SVG.update(this.elm, { points: SVG.points(this.getPoints()) })
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
