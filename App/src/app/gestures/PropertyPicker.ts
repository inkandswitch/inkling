import { EventContext, Gesture } from "../Gesture"
import MetaToggle from "../gui/MetaToggle"
import { aPropertyPicker } from "../meta/PropertyPicker"
import { createWire } from "./effects/CreateWire"

export function propertyPickerCreateWire(ctx: EventContext): Gesture | void {
  if (MetaToggle.active) {
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
