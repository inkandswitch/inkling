import { EventContext, Gesture } from './Gesture';
import { aPrimaryToken } from '../meta/Token';
import { isNumberToken } from '../meta/token-helpers';

export function scrubToken(ctx: EventContext): Gesture | void {
  if (ctx.pseudo) {
    const token = ctx.page.find({
      what: aPrimaryToken,
      near: ctx.event.position,
    });

    if (token && isNumberToken(token)) {
      const v = token.getVariable();
      const wasLocked = v.isLocked;
      let initialY = ctx.event.position.y;
      let initialValue = v.value;
      let fingers = 0;

      return new Gesture('Scrub Number Token', {
        moved: ctx => {
          if (fingers != ctx.pseudoCount) {
            fingers = ctx.pseudoCount;
            initialValue = v.value;
            initialY = ctx.event.position.y;
          }
          const delta = initialY - ctx.event.position.y;
          const m = 1 / Math.pow(10, fingers - 1);
          const value = Math.round((initialValue + delta * m) / m) * m;
          token.getVariable().lock(value);
        },
        ended: () => {
          if (!wasLocked) {
            token.getVariable().unlock();
          }
        },
      });
    }
  }
}
