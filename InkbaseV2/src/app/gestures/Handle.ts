import { EventContext, Gesture } from './Gesture';
import Handle, { aCanonicalHandle } from '../ink/Handle';
import * as constraints from '../constraints';

export function touchHandle(ctx: EventContext): Gesture | void {
  const handle = ctx.root.page.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: 40,
  });

  if (handle) {
    return touchHandleHelper(handle);
  }
}

export function touchHandleHelper(handle: Handle): Gesture {
  return new Gesture('Touch Handle', {
    began(_ctx) {
      constraints.pin(handle);
    },
    moved(ctx) {
      const newHandle = ctx.root.page.moveHandle(handle, ctx.event.position);
      if (newHandle !== handle) {
        constraints.pin(handle).remove();
        handle = newHandle;
      }
      constraints.pin(handle); // if there's already a pin, this updates its position
    },
    ended(_ctx) {
      handle.getAbsorbedByNearestHandle();
      constraints.pin(handle).remove();
    },
  });
}
