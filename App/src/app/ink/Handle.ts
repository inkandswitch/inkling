import { GameObject } from "../GameObject"
import SVG from "../Svg"
import * as constraints from "../Constraints"
import { Constraint, Pin, Variable } from "../Constraints"
import { Position } from "../../lib/types"
import Vec from "../../lib/vec"
import { TAU } from "../../lib/math"
import { generateId, Root } from "../Root"

export type SerializedHandle = {
  type: "Handle"
  id: number
  position: Position
  xVariableId: number
  yVariableId: number
}

export default class Handle extends GameObject {
  static goesAnywhereId = -1

  static withId(id: number) {
    const handle = Root.current.find({ what: aHandle, that: (h) => h.id === id })
    if (handle == null) {
      throw new Error("coudln't find handle w/ id " + id)
    }
    return handle
  }

  static create(position: Position): Handle {
    return new Handle(
      position,
      constraints.variable(0, {
        object: this,
        property: "x"
      }),
      constraints.variable(0, {
        object: this,
        property: "y"
      })
    )
  }

  private readonly backElm = SVG.add("g", SVG.handleElm, { class: "handle" })
  private readonly frontElm = SVG.add("g", SVG.constraintElm, { class: "handle" })

  protected constructor(
    position: Position,
    public readonly xVariable: Variable,
    public readonly yVariable: Variable,
    public readonly id: number = generateId()
  ) {
    super()
    this.position = position

    SVG.add("circle", this.backElm, { r: 15 })
    const arcs1 = SVG.add("g", this.frontElm, { class: "arcs1" })
    const arcs2 = SVG.add("g", this.frontElm, { class: "arcs2" })
    const arc = (angle = 0) => SVG.arcPath(Vec.zero, 14, angle, Math.PI / 10)
    SVG.add("path", arcs1, { d: arc((0 * TAU) / 4) })
    SVG.add("path", arcs1, { d: arc((1 * TAU) / 4) })
    SVG.add("path", arcs1, { d: arc((2 * TAU) / 4) })
    SVG.add("path", arcs1, { d: arc((3 * TAU) / 4) })
    SVG.add("path", arcs2, { d: arc((0 * TAU) / 4) })
    SVG.add("path", arcs2, { d: arc((1 * TAU) / 4) })
    SVG.add("path", arcs2, { d: arc((2 * TAU) / 4) })
    SVG.add("path", arcs2, { d: arc((3 * TAU) / 4) })
    Root.current.adopt(this)
  }

  serialize(): SerializedHandle {
    return {
      type: "Handle",
      id: this.id,
      position: { x: this.x, y: this.y },
      xVariableId: this.xVariable.id,
      yVariableId: this.yVariable.id
    }
  }

  static deserialize(v: SerializedHandle) {
    Handle.goesAnywhereId = -1
    return new Handle(v.position, Variable.withId(v.xVariableId), Variable.withId(v.yVariableId), v.id)
  }

  toggleGoesAnywhere() {
    if (Handle.goesAnywhereId !== this.id) {
      Handle.goesAnywhereId = this.id
    } else {
      Handle.goesAnywhereId = -1
    }
  }

  get x() {
    return this.xVariable.value
  }

  get y() {
    return this.yVariable.value
  }

  get position(): Position {
    return this
  }

  set position(pos: Position) {
    ;({ x: this.xVariable.value, y: this.yVariable.value } = pos)
  }

  remove() {
    this.backElm.remove()
    this.frontElm.remove()
    this.canonicalInstance.breakOff(this)
    this.xVariable.remove()
    this.yVariable.remove()
    super.remove()
  }

  absorb(that: Handle) {
    constraints.absorb(this, that)
  }

  getAbsorbedByNearestHandle() {
    const nearestHandle = this.root.find({
      what: aCanonicalHandle,
      near: this.position,
      that: (handle) => handle !== this
    })
    if (nearestHandle) {
      nearestHandle.absorb(this)
    }
  }

  private _canonicalHandle: Handle = this
  readonly absorbedHandles = new Set<Handle>()

  get isCanonical() {
    return this._canonicalHandle === this
  }

  get canonicalInstance() {
    return this._canonicalHandle
  }

  private set canonicalInstance(handle: Handle) {
    this._canonicalHandle = handle
  }

  /** This method should only be called by the constraint system. */
  _absorb(that: Handle) {
    if (that === this) {
      return
    }

    that.canonicalInstance.absorbedHandles.delete(that)
    for (const handle of that.absorbedHandles) {
      this._absorb(handle)
    }
    that.canonicalInstance = this
    this.absorbedHandles.add(that)
  }

  /** This method should only be called by the constraint system. */
  _forgetAbsorbedHandles() {
    this.canonicalInstance = this
    this.absorbedHandles.clear()
  }

  breakOff(handle: Handle) {
    if (this.absorbedHandles.has(handle)) {
      constraints.absorb(this, handle).remove()
    } else if (handle === this) {
      if (this.absorbedHandles.size > 0) {
        const absorbedHandles = [...this.absorbedHandles]
        const newCanonicalHandle = absorbedHandles.shift()!
        constraints.absorb(this, newCanonicalHandle).remove()
        for (const absorbedHandle of absorbedHandles) {
          constraints.absorb(newCanonicalHandle, absorbedHandle)
        }
      }
    } else {
      throw new Error("tried to break off a handle that was not absorbed")
    }
    return handle
  }

  get hasPin() {
    for (const constraint of Constraint.all) {
      if (constraint instanceof Pin && constraint.handle.canonicalInstance === this.canonicalInstance) {
        return true
      }
    }
    return false
  }

  togglePin(doPin = !this.hasPin): void {
    if (!this.isCanonical) {
      return this.canonicalInstance.togglePin(doPin)
    }

    for (const h of [this, ...this.absorbedHandles]) {
      if (doPin) {
        constraints.pin(h)
      } else {
        constraints.pin(h).remove()
      }
    }
  }

  render(dt: number, t: number) {
    const attrs = {
      transform: SVG.positionToTransform(this),
      "is-canonical": this.isCanonical,
      "has-pin": this.hasPin,
      "goes-anywhere": this.id === Handle.goesAnywhereId
    }
    SVG.update(this.backElm, attrs)
    SVG.update(this.frontElm, attrs)

    for (const child of this.children) {
      child.render(dt, t)
    }
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point)
  }

  equals(that: Handle) {
    return this.xVariable.equals(that.xVariable) && this.yVariable.equals(that.yVariable)
  }
}

export const aHandle = (gameObj: GameObject) => (gameObj instanceof Handle ? gameObj : null)

export const aCanonicalHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle && gameObj.isCanonical ? gameObj : null
