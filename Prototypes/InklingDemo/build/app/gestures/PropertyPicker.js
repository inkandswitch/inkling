import {Gesture} from "./Gesture.js";
import {aPropertyPickerEditor} from "../meta/PropertyPickerEditor.js";
export function tapPropertyPicker(ctx) {
  if (ctx.metaToggle.active) {
    const propertyPicker = ctx.page.find({
      what: aPropertyPickerEditor,
      near: ctx.event.position,
      recursive: false
    });
    if (propertyPicker) {
      return new Gesture("Tap Property Picker", {
        began(ctx2) {
          propertyPicker.onTapInside(ctx2.event.position);
        }
      });
    }
  }
}
