import { EventContext, Gesture } from './Gesture';
import { aToken } from '../meta/Token';
import { isNumberToken } from '../meta/token-helpers';

export function touchToken(ctx: EventContext): Gesture | void {
  const token = ctx.page.find({
    what: aToken,
    near: ctx.event.position,
    recursive: false,
  });

  if (token) {
    return new Gesture('Touch Token', {
      dragged: () =>
        new Gesture('Drag Token', {
          dragged: ctx => (token.position = ctx.event.position),
        }),

      ended: () => isNumberToken(token) && token.onTap(),
    });
  }
}
