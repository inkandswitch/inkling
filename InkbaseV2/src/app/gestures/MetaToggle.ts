import { EventContext, Gesture } from './Gesture';
import { aMetaToggle } from '../gui/MetaToggle';

export function touchMetaToggle(ctx: EventContext): Gesture | void {
  const metaToggle = ctx.root.find({
    what: aMetaToggle,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50,
  });

  if (metaToggle) {
    return new Gesture('Touch Meta Toggle', {
      moved: ctx => {
        if (ctx.state.dragDist > 100) {
          metaToggle.dragTo(ctx.event.position);
        }
      },
      ended: ctx => {
        metaToggle.snapToCorner();
        if (ctx.state.dragDist < 100) {
          metaToggle.toggle();
        }
      },
    });
  }
}
