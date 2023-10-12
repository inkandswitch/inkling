import { EventContext, Gesture } from './Gesture';
import { aPropertyPickerEditor } from '../meta/PropertyPickerEditor';

export function pencilTapPropertyPicker(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const propertyPicker = ctx.page.find({
      what: aPropertyPickerEditor,
      near: ctx.event.position,
      recursive: false,
    });

    if (propertyPicker) {
      return new Gesture('Pencil Tap Property Picker', {
        began: () => propertyPicker.onTapInside(ctx.event.position),
      });
    }
  }
}
