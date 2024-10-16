import { GameObject } from "../GameObject"
import SVG from "../Svg"
import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { distanceToPath } from "../../lib/helpers"
import Svg from "../Svg"
import Gizmo from "./Gizmo"
import Token from "./Token"
import PropertyPicker from "./PropertyPicker"
import NumberToken from "./NumberToken"
import { Variable } from "../Constraints"
import { Pluggable } from "./Pluggable"

export type SerializedWire = {
  type: "Wire"
  fromTokenOrGizmoId: number
  toTokenOrGizmoId?: number
  toPosition?: Position
}

export default class Wire<D extends Variable | { distance: Variable; angle: Variable }> extends GameObject {
  toObj?: Pluggable
  toPosition?: Position

  constructor(readonly fromObj: Pluggable<D>) {
    super()
  }

  protected readonly elm = SVG.add("polyline", SVG.wiresElm, {
    points: "",
    class: "wire"
  })

  static deserialize(v: SerializedWire): Wire<any> {
    const w = new Wire(this.getObjById(v.fromTokenOrGizmoId) as Pluggable<any>)
    if (v.toTokenOrGizmoId != null) {
      w.toObj = this.getObjById(v.toTokenOrGizmoId)
    }
    w.toPosition = v.toPosition
    return w
  }

  static getObjById(id: number) {
    try {
      return Token.withId(id) as NumberToken | PropertyPicker
    } catch (e) {
      return Gizmo.withId(id)
    }
  }

  serialize(): SerializedWire {
    return {
      type: "Wire",
      fromTokenOrGizmoId: this.fromObj.id,
      toTokenOrGizmoId: this.toObj?.id,
      toPosition: this.toPosition
    }
  }

  distanceToPoint(point: Position) {
    return distanceToPath(point, [
      this.fromObj.getOutputPlugPosition(),
      this.toPosition ?? this.toObj!.getInputPlugPosition()
    ])
  }

  togglePaused() {
    // TODO
  }

  get paused() {
    // TODO
    return false
  }

  render(): void {
    SVG.update(this.elm, {
      points: SVG.points([
        this.fromObj.getOutputPlugPosition(),
        this.toObj?.getInputPlugPosition() ?? this.toPosition!
      ]),
      "is-paused": this.paused
    })
  }

  isCollapsable() {
    const [p1, p2] = this.points
    return p1 && p2 && Vec.dist(p1, p2) < 10
  }

  attachEnd(element: WirePort) {
    this.b = new WeakRef(element)

    const a = this.a?.deref()
    const b = this.b?.deref()

    if (a && b) {
      this.connection = a.value.wireTo(b.value)
    }

    if (this.connection === null) {
      // Remove the wire if it's not a valid connection
      Svg.showStatus("You can't wire those things together silly billy")
      this.remove()
    }
  }

  remove(): void {
    this.elm.remove()
    this.connection?.remove()
    super.remove()
  }
}

export const aWire = (g: GameObject) => (g instanceof Wire ? g : null)
