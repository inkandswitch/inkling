import { aStroke } from '../ink/Stroke';
import { aStrokeGroup } from '../ink/StrokeGroup';
import { EventContext, Gesture } from '../Gesture';

export function toggleHandles(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const strokeGroup = ctx.page.find({
      what: aStrokeGroup,
      near: ctx.event.position,
      tooFar: 20,
    });

    if (strokeGroup) {
      return new Gesture('Remove Handles', {
        ended(ctx) {
          if (
            !ctx.state.drag &&
            strokeGroup.a.canonicalInstance.absorbedHandles.size === 0 &&
            strokeGroup.b.canonicalInstance.absorbedHandles.size === 0
          ) {
            strokeGroup.breakApart();
          }
        },
      });
    }

    const stroke = ctx.page.find({
      what: aStroke,
      near: ctx.event.position,
      tooFar: 50,
    });

    if (stroke) {
      return new Gesture('Add Handles', {
        ended(ctx) {
          if (!ctx.state.drag) {
            stroke.becomeGroup();
          }
        },
      });
    }
  }
}
