import { TAU, lerp, normalizeAngle } from "../../lib/math"
import SVG from "../Svg"
import Handle from "../ink/Handle"
import Vec from "../../lib/vec"
import { Position } from "../../lib/types"
import * as constraints from "../Constraints"
import { Variable } from "../Constraints"
import Line from "../../lib/line"
import { GameObject } from "../GameObject"
import { generateId, Root } from "../Root"
import { Pluggable } from "./Pluggable"

const arc = SVG.arcPath(Vec.zero, 10, TAU / 4, Math.PI / 3)

export type SerializedGizmo = {
  type: "Gizmo"
  id: number
  distanceVariableId: number
  angleInRadiansVariableId: number
  angleInDegreesVariableId: number
  aHandleId: number
  bHandleId: number
}

export default class Gizmo extends GameObject implements Pluggable {
  static withId(id: number) {
    const gizmo = Root.current.find({ what: aGizmo, that: (t) => t.id === id })
    if (gizmo == null) {
      throw new Error("coudln't find gizmo w/ id " + id)
    }
    return gizmo
  }

  static create(a: Handle, b: Handle) {
    const { distance, angle: angleInRadians } = constraints.polarVector(a, b)
    const angleInDegrees = constraints.linearRelationship(
      constraints.variable((angleInRadians.value * 180) / Math.PI),
      180 / Math.PI,
      angleInRadians,
      0
    ).y
    return Gizmo._create(generateId(), a, b, distance, angleInRadians, angleInDegrees)
  }

  static _create(
    id: number,
    a: Handle,
    b: Handle,
    distance: Variable,
    angleInRadians: Variable,
    angleInDegrees: Variable
  ) {
    return new Gizmo(id, a, b, distance, angleInRadians, angleInDegrees)
  }

  center: Position

  private elm = SVG.add("g", SVG.gizmoElm, { class: "gizmo" })
  private thick = SVG.add("polyline", this.elm, { class: "thick" })
  private arrow = SVG.add("polyline", this.elm, { class: "arrow" })
  private arcs = SVG.add("g", this.elm, { class: "arcs" })
  private arc1 = SVG.add("path", this.arcs, { d: arc, class: "arc1" })
  private arc2 = SVG.add("path", this.arcs, { d: arc, class: "arc2" })

  private readonly _a: WeakRef<Handle>
  private readonly _b: WeakRef<Handle>

  // ------

  private savedDistance = 0
  private savedAngleInRadians = 0

  saveState() {
    this.savedDistance = this.distance.value
    this.savedAngleInRadians = this.angleInRadians.value
  }

  restoreState() {
    this.distance.value = this.savedDistance
    this.angleInRadians.value = this.savedAngleInRadians
  }

  // ------

  get a(): Handle | undefined {
    return this._a.deref()
  }

  get b(): Handle | undefined {
    return this._b.deref()
  }

  get handles() {
    const a = this.a
    const b = this.b
    return a && b ? { a, b } : null
  }

  readonly plugs: { value: { distance: Variable; angleInDegrees: Variable } }

  private constructor(
    readonly id: number,
    a: Handle,
    b: Handle,
    readonly distance: Variable,
    readonly angleInRadians: Variable,
    readonly angleInDegrees: Variable
  ) {
    super()
    this.center = Vec.avg(a, b)
    this._a = new WeakRef(a)
    this._b = new WeakRef(b)
    this.distance.represents = {
      object: this,
      property: "distance"
    }
    this.angleInRadians.represents = {
      object: this,
      property: "angle-radians"
    }
    this.angleInDegrees.represents = {
      object: this,
      property: "angle-degrees"
    }
    this.plugs = {
      value: {
        distance,
        angleInDegrees
      }
    }
  }

  getPlugPosition(id: string): Position {
    return this.center
  }

  static deserialize(v: SerializedGizmo): Gizmo {
    return this._create(
      v.id,
      Handle.withId(v.aHandleId),
      Handle.withId(v.bHandleId),
      Variable.withId(v.distanceVariableId),
      Variable.withId(v.angleInRadiansVariableId),
      Variable.withId(v.angleInDegreesVariableId)
    )
  }

  serialize(): SerializedGizmo {
    return {
      type: "Gizmo",
      id: this.id,
      distanceVariableId: this.distance.id,
      angleInRadiansVariableId: this.angleInRadians.id,
      angleInDegreesVariableId: this.angleInDegrees.id,
      aHandleId: this.a!.id,
      bHandleId: this.b!.id
    }
  }

  cycleConstraints() {
    const aLock = this.angleInRadians.isLocked
    const dLock = this.distance.isLocked

    // There's probably some smarter way to do this with a bitmask or something
    // but this is just a temporary hack so don't bother
    if (!aLock && !dLock) {
      this.toggleDistance()
    } else if (dLock && !aLock) {
      this.toggleAngle()
    } else if (dLock && aLock) {
      this.toggleDistance()
    } else if (!dLock && aLock) {
      this.toggleAngle()
    }
  }

  toggleDistance() {
    this.distance.toggleLock()
  }

  toggleAngle() {
    // doesn't matter which angle we lock, one is absorbed by the other
    // so they this results in locking/unlocking both
    this.angleInRadians.toggleLock()
  }

  render() {
    const handles = this.handles
    if (!handles) {
      return
    }

    const a = handles.a.position
    const b = handles.b.position
    this.center = Vec.avg(a, b)

    const solverLength = this.distance.value
    const realLength = Vec.dist(a, b)
    const distanceTension = Math.abs(solverLength - realLength) / 100

    const solverAngle = normalizeAngle(this.angleInRadians.value)
    const realAngle = normalizeAngle(Vec.angle(Vec.sub(b, a)))
    const angleTension = Math.abs(solverAngle - realAngle)

    const aLock = this.angleInRadians.isLocked
    const dLock = this.distance.isLocked
    const fade = lerp(realLength, 80, 100, 0, 1)

    SVG.update(this.thick, {
      style:
        distanceTension + angleTension < 0.1
          ? ""
          : `
          stroke-dashoffset:${-realLength / 2}px;
          stroke: color(display-p3 1 .3 .2);
          stroke-dasharray: 20 20;
          opacity: 0.3;
        `
    })

    SVG.update(this.elm, { "is-constrained": aLock || dLock })
    SVG.update(this.thick, { points: SVG.points(a, b) })

    if (realLength > 0) {
      const ab = Vec.sub(b, a)
      const arrow = Vec.renormalize(ab, 4)
      const tail = Vec.sub(this.center, Vec.renormalize(ab, 30))
      const tip = Vec.add(this.center, Vec.renormalize(ab, 30))
      const port = Vec.sub(tip, Vec.rotate(arrow, TAU / 12))
      const starboard = Vec.sub(tip, Vec.rotate(arrow, -TAU / 12))

      SVG.update(this.arrow, {
        points: SVG.points(tail, tip, port, starboard, tip),
        style: `opacity: ${fade}`
      })

      SVG.update(this.arcs, {
        style: `
        opacity: ${fade};
        transform:
          translate(${this.center.x}px, ${this.center.y}px)
          rotate(${realAngle}rad)
        `
      })

      const xOffset = aLock ? 0 : dLock ? 9.4 : 12
      const yOffset = dLock ? -3.5 : 0
      const arcTransform = `transform: translate(${xOffset}px, ${yOffset}px)`
      SVG.update(this.arc1, { style: arcTransform })
      SVG.update(this.arc2, { style: arcTransform })
    }
  }

  distanceToPoint(point: Position) {
    if (!this.handles) {
      return Infinity
    }
    const line = Line(this.handles.a.position, this.handles.b.position)
    const l = Line.distToPoint(line, point)
    const a = Vec.dist(this.center, point)
    return Math.min(l, a)
  }

  centerDistanceToPoint(p: Position) {
    return Vec.dist(this.center, p)
  }

  remove() {
    this.distance.remove()
    this.angleInRadians.remove()
    this.angleInDegrees.remove()
    this.elm.remove()
    this.a?.remove()
    this.b?.remove()
    super.remove()
  }
}

export const aGizmo = (gameObj: GameObject) => (gameObj instanceof Gizmo ? gameObj : null)
