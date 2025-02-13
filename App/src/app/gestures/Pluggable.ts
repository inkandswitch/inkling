import { EventContext, Gesture } from "../Gesture"
import NumberToken, { aNumberToken } from "../meta/NumberToken"
import MetaToggle from "../gui/MetaToggle"
import PropertyPicker, { aPropertyPicker } from "../meta/PropertyPicker"
import { Connection } from "../meta/Pluggable"
import Gizmo, { aGizmo } from "../meta/Gizmo"
import Wire from "../meta/Wire"
import { Variable } from "../Constraints"
import Vec from "../../lib/vec"
import { GameObject } from "../GameObject"
import SVG from "../Svg"
import * as constraints from "../Constraints"
import { Root } from "../Root"

export function pluggableCreateWire(ctx: EventContext): Gesture | void {
  if (MetaToggle.active) {
    const near = ctx.event.position

    const numberToken = ctx.root.find({ what: aNumberToken, near })
    if (numberToken) return maybeCreateWire({ obj: numberToken, plugId: "center", variableId: "value" })

    const propertyPicker = ctx.root.find({ what: aPropertyPicker, near })
    if (propertyPicker) return maybeCreateWire({ obj: propertyPicker, plugId: "output", variableId: "value" })

    // We can't use `near` because Gizmo's distance is calculated to the line, not just the center
    const gizmo = ctx.root.find({ what: aGizmo, that: (g) => g.centerDistanceToPoint(ctx.event.position) < 30 })
    if (gizmo) return maybeCreateWire({ obj: gizmo, plugId: "center", variableId: "distance" })
  }
}

const maybeCreateWire = (from: Connection): Gesture =>
  new Gesture("Maybe Create Wire", { dragged: (ctx) => createWire(from, ctx) })

function createWire(from: Connection, ctx: EventContext): Gesture {
  const wire = new Wire(from)
  ctx.root.adopt(wire)

  return new Gesture("Create Wire", {
    moved(ctx) {
      wire.toPosition = ctx.event.position
    },

    ended(ctx) {
      const near = ctx.event.position
      const that = (go: GameObject) => go !== from.obj

      // Wire from NumberToken or PropertyPicker
      if (from.obj instanceof NumberToken || from.obj instanceof PropertyPicker) {
        // Wire to NumberToken
        const numberToken = ctx.root.find({ what: aNumberToken, that, near }) as NumberToken | null
        if (numberToken) return attachWire(wire, { obj: numberToken, plugId: "center", variableId: "value" })

        // Wire to PropertyPicker
        const propertyPicker = ctx.root.find({ what: aPropertyPicker, that, near }) as PropertyPicker | null
        if (propertyPicker) return attachWire(wire, { obj: propertyPicker, plugId: "output", variableId: "value" })

        // Wire to Empty Space
        return createNumberToken(ctx, wire)
      }

      // Wire from Gizmo
      if (from.obj instanceof Gizmo) {
        // Wire to Gizmo
        const fromGizmo = from.obj
        const toGizmo = ctx.root.find({ what: aGizmo, that, near, tooFar: 30 }) as Gizmo | null
        if (toGizmo) {
          // Prevent the Gizmo we're wiring from from moving
          const preLengthLock = fromGizmo.distance.isLocked
          const preAngleLock = fromGizmo.angleInDegrees.isLocked
          if (!preLengthLock) fromGizmo.distance.lock()
          if (!preAngleLock) fromGizmo.angleInDegrees.lock()

          // Make a second wire for the angle
          const angleFrom: Connection = { obj: fromGizmo, plugId: "center", variableId: "angleInDegrees" }
          const angleTo: Connection = { obj: toGizmo, plugId: "center", variableId: "angleInDegrees" }
          attachWire(ctx.root.adopt(new Wire(angleFrom)), angleTo)

          // Attach the distance wire
          attachWire(wire, { obj: toGizmo, plugId: "center", variableId: "distance" })

          constraints.solve(Root.current)

          if (!preLengthLock) fromGizmo.distance.unlock()
          if (!preAngleLock) fromGizmo.angleInDegrees.unlock()

          return
        }

        // Wire to Empty Space
        return createPropertyPicker(ctx, wire, from.obj)
      }

      throw new Error("Dunno how we even")
    }
  })
}

function createPropertyPicker(ctx: EventContext, wire: Wire, fromObj: Gizmo) {
  const distValue = fromObj.plugVars.distance.value
  const distPicker = ctx.root.adopt(PropertyPicker.create("distance", distValue))
  distPicker.position = Vec.add(ctx.event.position, Vec(0, 10))
  attachWire(wire, { obj: distPicker, plugId: "input", variableId: "value" })

  // Make a second wire
  const angleFrom: Connection = { obj: fromObj, plugId: "center", variableId: "angleInDegrees" }
  const angleValue = fromObj.plugVars.angleInDegrees.value
  const anglePicker = ctx.root.adopt(PropertyPicker.create("angleInDegrees", angleValue))
  anglePicker.position = Vec.add(ctx.event.position, Vec(0, -30))
  const angleTo: Connection = { obj: anglePicker, plugId: "input", variableId: "value" }
  attachWire(ctx.root.adopt(new Wire(angleFrom)), angleTo)
}

function createNumberToken(ctx: EventContext, wire: Wire) {
  const n = ctx.root.adopt(NumberToken.create())
  attachWire(wire, { obj: n, plugId: "center", variableId: "value" })
  // Force a render, which computes the token width
  n.render(0, 0)
  // Position the token so that it's centered on the pencil
  n.position = Vec.sub(ctx.event.position, Vec.half(Vec(n.width, n.height)))
  // Re-add the wire, so it renders after the token (avoids a flicker)
  ctx.root.adopt(wire)
}

function attachWire(wire: Wire, to: Connection) {
  // A wire between two single variables
  const from = wire.a
  const a = from.obj.plugVars[from.variableId] as Variable
  const b = to.obj.plugVars[to.variableId] as Variable

  wire.attachEnd(to)
  wire.constraint = constraints.equals(b, a)
}
