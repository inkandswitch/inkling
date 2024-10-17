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
        const gizmo = ctx.root.find({ what: aGizmo, that, near }) as Gizmo | null
        if (gizmo) {
          // Attach the distance wire
          attachWire(wire, { obj: gizmo, plugId: "center", variableId: "distance" })

          // Make a second wire for the angle
          const angleFrom: Connection = { obj: from.obj, plugId: "center", variableId: "angleInDegrees" }
          const angleTo: Connection = { obj: gizmo, plugId: "center", variableId: "angleInDegrees" }
          attachWire(ctx.root.adopt(new Wire(angleFrom)), angleTo)
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
  distPicker.position = ctx.event.position
  attachWire(wire, { obj: distPicker, plugId: "input", variableId: "value" })

  // Make a second wire
  const angleFrom: Connection = { obj: fromObj, plugId: "center", variableId: "angleInDegrees" }
  const angleValue = fromObj.plugVars.angleInDegrees.value
  const anglePicker = ctx.root.adopt(PropertyPicker.create("angleInDegrees", angleValue))
  anglePicker.position = ctx.event.position
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
  wire.attachEnd(to)

  // A wire between two single variables
  const from = wire.a
  const a = from.obj.plugVars[from.variableId] as Variable
  const b = to.obj.plugVars[to.variableId] as Variable

  wire.constraint = constraints.equals(a, b)

  // if (!wire.constraint) {
  //   SVG.showStatus("You can't wire those things together silly billy")
  //   wire.remove()
  // }
}
