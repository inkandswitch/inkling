import { EventContext, Gesture } from './Gesture';
import { aGizmo } from '../meta/Gizmo';
import VarMover from '../VarMover';

export function touchGizmo(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    // TODO: We only want to perform this gesture on a tap near the center of the gizmo.
    // But for other gestures, we want to perform them when any part of the gizmo is touched.
    // The current GameObject.find() method doesn't seemingly allow for this sort of distinction,
    // where different find() calls need a different distanceToPoint() implementation.
    const gizmo = ctx.root.find({
      what: aGizmo,
      near: ctx.event.position,
      tooFar: 50,
    });

    if (gizmo) {
      return new Gesture('Touch Gizmo', {
        ended(ctx) {
          if (ctx.pseudoCount > 0) {
            // TODO: remove this -- it's just something Alex added as a demo of VarMover.
            VarMover.move(
              gizmo.angleInDegrees,
              gizmo.angleInDegrees.value + 180,
              0.2
            );
          } else {
            gizmo.cycleConstraints();
          }
        },
      });
    }
  }
}
