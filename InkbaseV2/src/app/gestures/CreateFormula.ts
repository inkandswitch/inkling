import { EventContext, Gesture } from './Gesture';
import Formula from '../meta/Formula';

export function createFormula(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    return new Gesture('Create Formula', {
      ended(ctx) {
        if (!ctx.state.drag) {
          Formula.createFromContext(ctx);
        }
      },
    });
  }
}
