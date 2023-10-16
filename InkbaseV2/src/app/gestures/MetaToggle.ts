import { EventContext, Gesture } from './Gesture';
import { aMetaToggle } from '../gui/MetaToggle';

declare global {
  function cycleTheme(): void;
}

export function touchMetaToggle(ctx: EventContext): Gesture | void {
  const metaToggle = ctx.root.find({
    what: aMetaToggle,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50,
  });

  const dragThreshold = 100;

  if (metaToggle) {
    return new Gesture('Touch Meta Toggle', {
      moved(ctx) {
        if (ctx.state.dragDist > dragThreshold) {
          metaToggle.dragTo(ctx.event.position);
        }
      },
      ended(ctx) {
        metaToggle.snapToCorner();
        if (ctx.pseudo) {
          cycleTheme();
        } else if (ctx.state.dragDist <= dragThreshold) {
          metaToggle.toggle();
        }
      },
    });
  }
}
