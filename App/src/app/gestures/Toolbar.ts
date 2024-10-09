import Config from '../Config';
import { EventContext, Gesture } from '../Gesture';
import { aToolbar } from '../gui/Toolbar';

export function toolbarMove(ctx: EventContext): Gesture | void {
  const toolbar = ctx.root.find({
    what: aToolbar,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50,
  });

  const dragThreshold = 100;

  if (toolbar) {
    return new Gesture('Meta Toggle Finger Actions', {
      moved(ctx) {
        if (ctx.state.dragDist > dragThreshold) {
          toolbar.dragTo(ctx.event.position);
        }
      },
      endedDrag(ctx) {
        toolbar.snapToSide();
      },
    });
  }
}

export function toolbarIgnorePencil(ctx: EventContext): Gesture | void {
  if (
    ctx.root.find({
      what: aToolbar,
      near: ctx.event.position,
      recursive: false,
      tooFar: Config.gui.padding + 5,
    })
  ) {
    // This gesture exists just to block other gestures from running when a pencil touch begins on the Meta Toggle
    return new Gesture('Ignore Pencil', {});
  }
}
