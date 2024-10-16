import { aGizmo } from "../../meta/Gizmo"
import NumberToken from "../../meta/NumberToken"
import { EventContext, Gesture } from "../../Gesture"
import PropertyPicker from "../../meta/PropertyPicker"
import Vec from "../../../lib/vec"
import Wire from "../../meta/Wire"
import PropertyPickerEditor from "../../meta/PropertyPickerEditor"
import { GameObject } from "../../GameObject"
import { Pluggable } from "../../meta/Pluggable"
import { Variable } from "../../Constraints"

export function createWire<D extends Variable | { distance: Variable; angle: Variable }>(
  fromObj: Pluggable,
  ctx: EventContext
): Gesture | void {
  const wire = new Wire(wirePort)
  ctx.root.adopt(wire)

  return new Gesture("Create Wire", {
    moved(ctx) {
      wire.toPosition = ctx.event.position
    },

    ended(ctx) {
      const near = ctx.event.position
      const token = ctx.root.find({ what: aTokenWithVariable, near })
      const gizmo = ctx.root.find({ what: aGizmo, near })

      if (token) {
        wire.attachEnd(token.wirePort)
      } else if (gizmo) {
        wire.attachEnd(gizmo.wirePort)
      } else if (wire.a?.deref()?.value instanceof MetaStruct) {
        const p = ctx.root.adopt(PropertyPicker.create())
        p.position = ctx.event.position
        wire.attachEnd(p.inputPort)
        ctx.root.adopt(new PropertyPickerEditor(p))
      } else {
        const n = ctx.root.adopt(NumberToken.create())
        wire.attachEnd(n.wirePort)
        // Force a render, which computes the token width
        n.render(0, 0)
        // Position the token so that it's centered on the pencil
        n.position = Vec.sub(ctx.event.position, Vec(n.width / 2, n.height / 2))
        // Re-add the wire, so it renders after the token (avoids a flicker)
        ctx.root.adopt(wire)
      }
    }
  })
}

export const aTokenWithVariable = (gameObj: GameObject) =>
  gameObj instanceof NumberToken || gameObj instanceof PropertyPicker ? gameObj : null
