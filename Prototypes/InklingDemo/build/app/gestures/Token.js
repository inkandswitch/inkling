import {Gesture} from "./Gesture.js";
import {aPrimaryToken, aToken} from "../meta/Token.js";
import {isNumberToken} from "../meta/token-helpers.js";
import Vec from "../../lib/vec.js";
export function touchToken(ctx) {
  if (!ctx.metaToggle.active) {
    return;
  }
  const token = ctx.page.find({
    what: aToken,
    near: ctx.event.position
  });
  if (!token) {
    return;
  }
  const offset = Vec.sub(token.position, ctx.event.position);
  return new Gesture("Touch Token", {
    dragged(ctx2) {
      token.position = Vec.add(ctx2.event.position, offset);
    },
    ended(ctx2) {
      if (!ctx2.state.drag) {
        const primaryToken = ctx2.page.find({
          what: aPrimaryToken,
          near: ctx2.event.position
        });
        if (isNumberToken(primaryToken)) {
          primaryToken.onTap();
        }
      }
    }
  });
}
export function scrubNumberToken(ctx) {
  if (!(ctx.metaToggle.active && ctx.pseudo)) {
    return;
  }
  const token = ctx.page.find({
    what: aPrimaryToken,
    near: ctx.event.position
  });
  if (!isNumberToken(token)) {
    return;
  }
  const v = token.getVariable();
  const wasLocked = v.isLocked;
  let initialY = ctx.event.position.y;
  let initialValue = v.value;
  let fingers = 0;
  return new Gesture("Scrub Number Token", {
    moved(ctx2) {
      if (fingers !== ctx2.pseudoCount) {
        fingers = ctx2.pseudoCount;
        initialValue = v.value;
        initialY = ctx2.event.position.y;
      }
      const delta = initialY - ctx2.event.position.y;
      const m = 1 / Math.pow(10, fingers - 1);
      const value = Math.round((initialValue + delta * m) / m) * m;
      token.getVariable().lock(value, true);
    },
    ended(ctx2) {
      if (!wasLocked) {
        token.getVariable().unlock();
      }
    }
  });
}
