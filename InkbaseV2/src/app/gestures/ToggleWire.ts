import { aWire } from '../meta/Wire';
import { EventContext, Gesture } from './Gesture';

export function toggleWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const wire = ctx.page.find({
      what: aWire,
      near: ctx.event.position,
    });

    if (wire) {
      return new Gesture('Toggle Wire', {
        ended(ctx) {
          if (!ctx.state.drag) {
            wire.togglePaused();
          }
        },
      });
    }
  }
}
