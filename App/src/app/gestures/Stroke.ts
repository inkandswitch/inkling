import { aStroke } from '../ink/Stroke';
import { EventContext, Gesture } from '../Gesture';

export function strokeAddHandles(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const stroke = ctx.page.find({
      what: aStroke,
      near: ctx.event.position,
      tooFar: 50,
    });

    if (stroke) {
      return new Gesture('Add Handles', {
        endedTap(ctx) {
          stroke.becomeGroup();
        },
      });
    }
  }
}
