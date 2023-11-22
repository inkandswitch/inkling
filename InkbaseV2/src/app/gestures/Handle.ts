import { EventContext, Gesture } from './Gesture';
import Handle, { aCanonicalHandle } from '../ink/Handle';
import * as constraints from '../constraints';
import StrokeGroup from '../ink/StrokeGroup';
import Vec from '../../lib/vec';
import SVG from '../Svg';
import Config from '../Config';
import { Position } from '../../lib/types';

export function touchHandle(ctx: EventContext): Gesture | void {
  let handle = ctx.page.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: 40,
  });

  if (!handle) {
    return;
  }

  if (ctx.pseudoCount >= 4) {
    return new Gesture('go anywhere', {
      began() {
        handle!.canonicalInstance.toggleGoesAnywhere();
      },
    });
  }

  if (
    ctx.pseudoCount >= 3 &&
    handle.canonicalInstance.absorbedHandles.size > 0
  ) {
    const handles = [...handle.canonicalInstance.absorbedHandles];
    handle = handle.breakOff(handles[handles.length - 1]);
  }

  return touchHandleHelper(handle);
}

export function touchHandleHelper(handle: Handle): Gesture {
  let lastPos = Vec.clone(handle);
  let offset: Position;

  return new Gesture('Touch Handle', {
    began(ctx) {
      offset = Vec.sub(handle.position, ctx.event.position);
      if (Config.gesture.lookAt) {
        lastPos = Vec.clone(handle);
      } else {
        constraints.finger(handle);
      }
    },
    moved(ctx) {
      handle.position = Vec.add(ctx.event.position, offset);

      if (Config.gesture.lookAt) {
        lastPos = Vec.clone(handle);
      } else {
        constraints.finger(handle);
      }

      if (
        ctx.pseudoCount === 2 &&
        handle.parent instanceof StrokeGroup &&
        handle.canonicalInstance.absorbedHandles.size === 0
      ) {
        handle.parent.generatePointData();
      }
    },
    ended(ctx) {
      handle.getAbsorbedByNearestHandle();
      if (!Config.gesture.lookAt) {
        constraints.finger(handle).remove();
      }

      // Tune: you must tap a little more precisely to toggle a pin than drag a handle
      // TODO: This creates a small tap deadzone between the stroke (to toggle handles) and the handle (to toggle pin), because the handle claims the gesture but doesn't do anything with it
      const tappedPrecisely = Vec.dist(handle, ctx.event.position) < 20;
      if (!ctx.state.drag && ctx.metaToggle.active && tappedPrecisely) {
        handle.togglePin();
      }
    },
    render() {
      if (Config.gesture.lookAt) {
        const count = Math.pow(Vec.dist(handle.position, lastPos), 1 / 3);
        let c = count;
        while (--c > 0) {
          let v = Vec.sub(handle.position, lastPos);
          v = Vec.add(lastPos, Vec.mulS(v, c / count));
          SVG.now('circle', {
            cx: v.x,
            cy: v.y,
            r: 4,
            class: 'desire',
          });
        }
      }
    },
  });
}
