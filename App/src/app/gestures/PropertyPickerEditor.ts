import { EventContext, Gesture } from "../Gesture"
import { aPropertyPickerEditor } from "../meta/PropertyPickerEditor"

export function propertyPickerEditorChoose(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const propertyPickerEditor = ctx.root.find({
      what: aPropertyPickerEditor,
      near: ctx.event.position,
      recursive: false
    })

    if (propertyPickerEditor) {
      return new Gesture("Tap Property Picker Editor", {
        began(ctx) {
          propertyPickerEditor.onTapInside(ctx.event.position)
        }
      })
    }
  }
}
