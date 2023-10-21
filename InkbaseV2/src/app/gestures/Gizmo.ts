import { EventContext, Gesture } from './Gesture';
import { aGizmo } from '../meta/Gizmo';
import Vec from '../../lib/vec';

export function touchGizmo(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    // TODO: We only want to perform this gesture on a tap near the center of the gizmo.
    // But for other gestures, we want to perform them when any part of the gizmo is touched.
    // The current GameObject.find() method doesn't seemingly allow for this sort of distinction,
    // where different find() calls need a different distanceToPoint() implementation.
    const gizmo = ctx.root.find({
      what: aGizmo,
      that: g => g.centerDistanceToPoint(ctx.event.position) < 50,
    });

    if (gizmo) {
      return new Gesture('Touch Gizmo', {
        ended(ctx) {
          gizmo.cycleConstraints();
        },
      });
    }
  }
}
