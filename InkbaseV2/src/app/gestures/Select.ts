import { EventContext, Gesture } from '../Gesture';
import { rand } from '../../lib/math';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import Selected, { aSelectable } from '../Selected';

let lastTapTime = -Infinity;

// The min is to avoid accidental deselection if the pen tip bounces
const minDoubleTapInterval = 50;
const maxDoubleTapInterval = 300;

export function select(ctx: EventContext): Gesture | void {
  if (ctx.pseudoCount === 1) {
    // We have to store this to make tap-to-toggle work
    const previousSelection = new Set(Selected);

    return new Gesture('Select', {
      moved(ctx) {
        spawn(ctx.event.position);

        const selectables = ctx.root.findAll({
          what: aSelectable,
          near: ctx.event.position,
          tooFar: 10,
        });

        for (const obj of selectables) {
          Selected.add(obj);
        }
      },

      endedTap(ctx) {
        const selectables = ctx.root.findAll({
          what: aSelectable,
          near: ctx.event.position,
          tooFar: 10,
        });

        // Tap on a GameObject to toggle whether it's selected.
        // We only need to bother removing here, because the moved() will have already added it.
        for (const obj of selectables) {
          if (previousSelection.has(obj)) {
            Selected.delete(obj);
          }
        }

        // If we double-tapped on empty space, clear selection
        if (selectables.length === 0) {
          const time = performance.now();
          const delta = time - lastTapTime;
          if (minDoubleTapInterval < delta && delta < maxDoubleTapInterval) {
            Selected.clear();
          }
          lastTapTime = time;
        }
      },
    });
  }
}

function spawn(p: Position) {
  const elm = SVG.add('g', SVG.guiElm, {
    class: 'selector',
    transform: SVG.positionToTransform(p),
  });
  SVG.add('circle', elm, { r: 5 });
  elm.onanimationend = () => elm.remove();
}
