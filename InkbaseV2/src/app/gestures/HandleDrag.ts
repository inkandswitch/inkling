import { EventContext, Gesture } from './Gesture';
import { aCanonicalHandle } from '../ink/Handle';
import * as constraints from '../constraints';

export function handleDrag(ctx: EventContext): Gesture | void {
  const handle = ctx.root.page.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
  });

  if (handle) {
    return new Gesture('Touching Handle', {
      moved: ctx => {
        // TODO: replace this with the correct gestures (eg: 2 finger)
        ctx.root.page.moveHandle(handle, ctx.event.position);
        constraints.now.pin(handle);
      },
      ended: ctx => handle.absorbNearbyHandles(),
    });
  }
}
