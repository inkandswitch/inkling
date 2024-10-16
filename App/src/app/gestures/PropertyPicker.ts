import { EventContext, Gesture } from "../Gesture"
import { aPropertyPicker } from "../meta/PropertyPicker"
import { createWire } from "./effects/CreateWire"

export function propertyPickerCreateWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const propertyPicker = ctx.root.find({
      what: aPropertyPicker,
      near: ctx.event.position,
      recursive: false
    })

    if (propertyPicker) {
      createWire(propertyPicker.wirePort, ctx)
    }
  }
}
