import { EventContext, Gesture } from './Gesture';
import Stroke from '../ink/Stroke';
import StrokeGroup from '../ink/StrokeGroup';
import { aMetaToggle } from '../gui/MetaToggle';

export function drawInk(ctx: EventContext): Gesture | void {
  if (!ctx.metaToggle.active) {
    // If the touch begins on the Meta Toggle, don't draw ink
    if (
      ctx.root.find({
        what: aMetaToggle,
        near: ctx.event.position,
        recursive: false,
        tooFar: 35,
      })
    ) {
      return;
    }

    const stroke = ctx.page.addStroke(new Stroke());

    return new Gesture('Draw Ink', {
      moved(ctx) {
        stroke.points.push(ctx.event.position);
      },
      ended(ctx) {
        if (!ctx.state.drag && ctx.state.dragDist < 10) {
          stroke.remove();
        }
      },
    });
  }
}
