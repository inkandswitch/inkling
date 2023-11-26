import { EventContext, Gesture } from '../Gesture';
import { aMetaToggle, padding } from '../gui/MetaToggle';

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

export function pencilMetaToggle(ctx: EventContext): Gesture | void {
  if (
    ctx.root.find({
      what: aMetaToggle,
      near: ctx.event.position,
      recursive: false,
      tooFar: padding + 5,
    })
  ) {
    // This gesture exists just to block other gestures from running when a pencil touch begins on the Meta Toggle
    return new Gesture('Pencil Meta Toggle', {});
  }
}
