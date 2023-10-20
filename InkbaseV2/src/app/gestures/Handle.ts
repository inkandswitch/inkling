import { EventContext, Gesture } from './Gesture';
import Handle, { aCanonicalHandle } from '../ink/Handle';
import * as constraints from '../constraints';
import StrokeGroup from '../ink/StrokeGroup';

export function touchHandle(ctx: EventContext): Gesture | void {
  const handle = ctx.page.find({
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
    began(ctx) {
      constraints.finger(handle);
    },
    moved(ctx) {
      const newHandle = ctx.page.moveHandle(
        handle,
        ctx.event.position,
        ctx.metaToggle.active // whether gizmo handles can break off
      );
      if (newHandle !== handle) {
        constraints.finger(handle).remove();
        handle = newHandle;
      }
      constraints.finger(handle);

      if (
        ctx.pseudoCount == 2 &&
        handle.parent instanceof StrokeGroup &&
        handle.canonicalInstance.absorbedHandles.size === 0
      ) {
        handle.parent.generatePointData();
      }
    },
    ended(ctx) {
      handle.getAbsorbedByNearestHandle();
      constraints.finger(handle).remove();
      if (!ctx.state.drag && ctx.metaToggle.active) {
        handle.togglePin();
      }
    },
  });
}
