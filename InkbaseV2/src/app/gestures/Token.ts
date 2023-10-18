import { EventContext, Gesture } from './Gesture';
import { aPrimaryToken, aToken } from '../meta/Token';
import { isNumberToken } from '../meta/token-helpers';
import Vec from '../../lib/vec';

export function touchToken(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const token = ctx.page.find({
      what: aToken,
      near: ctx.event.position,
    });

    if (token) {
      const offset = Vec.sub(token.position, ctx.event.position);

      return new Gesture('Touch Token', {
        dragged(ctx) {
          token.position = Vec.add(ctx.event.position, offset);
        },
        ended(ctx) {
          if (!ctx.state.drag) {
            const primaryToken = ctx.page.find({
              what: aPrimaryToken,
              near: ctx.event.position,
            });
            if (isNumberToken(primaryToken)) {
              primaryToken.onTap();
            }
          }
        },
      });
    }
  }
}

export function scrubNumberToken(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active && ctx.pseudo) {
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
        moved(ctx) {
          if (fingers !== ctx.pseudoCount) {
            fingers = ctx.pseudoCount;
            initialValue = v.value;
            initialY = ctx.event.position.y;
          }
          const delta = initialY - ctx.event.position.y;
          const m = 1 / Math.pow(10, fingers - 1);
          const value = Math.round((initialValue + delta * m) / m) * m;
          token.getVariable().lock(value);
        },
        ended(ctx) {
          if (!wasLocked) {
            token.getVariable().unlock();
          }
        },
      });
    }
  }
}
