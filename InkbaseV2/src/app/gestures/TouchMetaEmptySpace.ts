import { EventContext, Gesture } from '../Gesture';
import Formula from '../meta/Formula';
import { createGizmo } from './CreateGizmo';

export function touchMetaEmptySpace(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    return new Gesture('Touching Empty Space', {
      dragged(ctx) {
        return createGizmo(ctx);
      },
      ended(ctx) {
        Formula.createFromContext(ctx);
      },
    });
  }
}
