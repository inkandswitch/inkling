import { EventContext, Gesture } from './Gesture';
import { aCanonicalHandle } from '../ink/Handle';
import * as constraints from '../constraints';

export function touchHandle(ctx: EventContext): Gesture | void {
  const handle = ctx.root.page.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: 40,
  });

  if (handle) {
    return new Gesture('Touch Handle', {
      began: _ctx => constraints.pin(handle),
      moved: ctx =>
        // TODO: replace this with the correct gestures (eg: 2 finger)
        ctx.root.page.moveHandle(handle, ctx.event.position),
      ended: _ctx => {
        handle.absorbNearbyHandles();
        constraints.pin(handle).remove();
      },
    });
  }
}
