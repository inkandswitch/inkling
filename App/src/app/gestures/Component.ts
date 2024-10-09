import { EventContext, Gesture } from '../Gesture';
import { aComponent } from '../meta/Component';
import { createWire } from './effects/CreateWire';

export function componentCreateWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const component = ctx.page.find({
      what: aComponent,
      near: ctx.event.position,
      recursive: false,
    });

    if (component) {
      return createWire(component.getWirePortNear(ctx.event.position), ctx);
    }
  }
}
