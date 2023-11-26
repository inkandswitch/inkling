import { EventContext, Gesture } from '../Gesture';
import { aCanonicalHandle } from '../ink/Handle';
import { createGizmo } from './effects/CreateGizmo';

export function drawGizmoFromHandle(ctx: EventContext): Gesture | void {
  if (
    ctx.metaToggle.active &&
    ctx.page.find({ what: aCanonicalHandle, near: ctx.event.position })
  ) {
    return createGizmo(ctx);
  }
}
