import { EventContext, Gesture } from './Gesture';
import Stroke from '../ink/Stroke';

export function drawInk(ctx: EventContext): Gesture | void {
  if (!ctx.metaToggle.active) {
    const stroke = ctx.page.addStroke(new Stroke());

    return new Gesture('Draw Ink', {
      moved(ctx) {
        stroke.points.push(ctx.event.position);
      },
    });
  }
}
