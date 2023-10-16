import Gizmo from '../meta/Gizmo';
import { EventContext, Gesture } from './Gesture';
import Handle, { aCanonicalHandle } from '../ink/Handle';
import { touchHandleHelper } from './Handle';

export function createGizmo(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const a = ctx.page.find({
      what: aCanonicalHandle,
      near: ctx.event.position,
    });

    if (a) {
      const b = ctx.page.adopt(Handle.create({ ...ctx.event.position }, false));
      ctx.page.adopt(new Gizmo(a, b));
      return touchHandleHelper(b);
    }
  }
}
