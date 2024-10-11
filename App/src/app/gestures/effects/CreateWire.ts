import { aGizmo } from "../../meta/Gizmo"
import NumberToken from "../../meta/NumberToken"
import { EventContext, Gesture } from "../../Gesture"
import PropertyPicker from "../../meta/PropertyPicker"
import Vec from "../../../lib/vec"
import Wire from "../../meta/Wire"
import { MetaStruct } from "../../meta/MetaSemantics"
import PropertyPickerEditor from "../../meta/PropertyPickerEditor"
import { WirePort } from "../../meta/WirePort"
import { GameObject } from "../../GameObject"

export function createWire(wirePort: WirePort, ctx: EventContext): Gesture | void {
  const wire = new Wire(wirePort)
  ctx.page.adopt(wire)

  return new Gesture("Create Wire", {
    moved(ctx) {
      wire.points[1] = ctx.event.position
    },

    ended(ctx) {
      const near = ctx.event.position
      const token = ctx.page.find({ what: aTokenWithVariable, near })
      const gizmo = ctx.page.find({ what: aGizmo, near })

      if (token) {
        wire.attachEnd(token.wirePort)
      } else if (gizmo) {
        wire.attachEnd(gizmo.wirePort)
      } else if (wire.a?.deref()?.value instanceof MetaStruct) {
        const p = ctx.page.adopt(new PropertyPicker())
        p.position = ctx.event.position
        wire.attachEnd(p.inputPort)
        ctx.page.adopt(new PropertyPickerEditor(p))
      } else {
        const n = ctx.page.adopt(new NumberToken())
        wire.attachEnd(n.wirePort)
        // Force a render, which computes the token width
        n.render(0, 0)
        // Position the token so that it's centered on the pencil
        n.position = Vec.sub(ctx.event.position, Vec(n.width / 2, n.height / 2))
        // Re-add the wire, so it renders after the token (avoids a flicker)
        ctx.page.adopt(wire)
      }
    }
  })
}

export const aTokenWithVariable = (gameObj: GameObject) =>
  gameObj instanceof NumberToken || gameObj instanceof PropertyPicker ? gameObj : null
