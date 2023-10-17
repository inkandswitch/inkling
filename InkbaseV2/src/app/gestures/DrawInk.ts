import { EventContext, Gesture } from './Gesture';
import Stroke from '../ink/Stroke';
import StrokeGroup from '../ink/StrokeGroup';

export function drawInk(ctx: EventContext): Gesture | void {
  if (!ctx.metaToggle.active) {
    const stroke = ctx.page.addStroke(new Stroke());

    return new Gesture('Draw Ink', {
      moved(ctx) {
        stroke.points.push(ctx.event.position);
      },
      ended(ctx) {
        if (ctx.pseudo) {
          ctx.page.adopt(new StrokeGroup(new Set([stroke])));
        }
      },
    });
  }
}
