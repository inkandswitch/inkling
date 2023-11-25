import Gizmo from '../meta/Gizmo';
import { EventContext, Gesture } from './Gesture';
import Handle, { aCanonicalHandle } from '../ink/Handle';
import { touchHandleHelper } from './Handle';

export function createGizmoFromHandle(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const handle = ctx.page.find({
      what: aCanonicalHandle,
      near: ctx.event.position,
    });
    if (handle) {
      return createGizmo(ctx);
    }
  }
}

export function createGizmo(ctx: EventContext): Gesture {
  const a = ctx.page.adopt(Handle.create({ ...ctx.event.position }, true));
  const b = ctx.page.adopt(Handle.create({ ...ctx.event.position }, false));
  ctx.page.adopt(new Gizmo(a, b));
  return touchHandleHelper(b);
}
