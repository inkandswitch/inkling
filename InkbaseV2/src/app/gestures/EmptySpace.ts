import { EventContext, Gesture } from '../Gesture';
import Stroke from '../ink/Stroke';
import { createFormula } from './effects/CreateFormula';
import { createGizmo } from './effects/CreateGizmo';

export function emptySpaceDrawInk(ctx: EventContext): Gesture | void {
  if (!ctx.metaToggle.active) {
    const stroke = ctx.page.addStroke(new Stroke());

    return new Gesture('Draw Ink', {
      moved(ctx) {
        stroke.points.push(ctx.event.position);
      },
    });
  }
}

export function emptySpaceCreateGizmoOrFormula(
  ctx: EventContext
): Gesture | void {
  if (ctx.metaToggle.active) {
    return new Gesture('Create Gizmo or Formula', {
      dragged(ctx) {
        return createGizmo(ctx);
      },
      ended(ctx) {
        createFormula(ctx);
      },
    });
  }
}
