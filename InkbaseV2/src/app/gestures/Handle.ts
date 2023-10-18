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
  const hadPin = handle.hasPin;

  return new Gesture('Touch Handle', {
    began(ctx) {
      constraints.pin(handle);
    },
    moved(ctx) {
      const newHandle = ctx.root.page.moveHandle(
        handle,
        ctx.event.position,
        ctx.metaToggle.active // whether gizmo handles can break off
      );
      if (newHandle !== handle) {
        if (!hadPin) {
          constraints.pin(handle).remove();
        }
        handle = newHandle;
      }
      constraints.pin(handle);
    },
    ended(ctx) {
      handle.getAbsorbedByNearestHandle();
      if (!hadPin) {
        constraints.pin(handle).remove();
      }
      if (!ctx.state.drag) {
        handle.togglePin();
      }
    },
  });
}
