import { EventContext, Gesture } from './Gesture';
import { rand } from '../../lib/math';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import Handle from '../ink/Handle';
import Wire from '../meta/Wire';
import Token from '../meta/Token';
import StrokeGroup from '../ink/StrokeGroup';
import Stroke from '../ink/Stroke';
import Component from '../meta/Component';
import Gizmo from '../meta/Gizmo';
import PropertyPickerEditor from '../meta/PropertyPickerEditor';

export function erase(ctx: EventContext): Gesture | void {
  if (ctx.pseudoCount === 2) {
    return new Gesture('Erase', {
      moved(ctx) {
        spawn(ctx.event.position);

        const g = ctx.root.page.find({
          what: g =>
            g instanceof Component ||
            g instanceof Gizmo ||
            g instanceof Handle ||
            g instanceof PropertyPickerEditor ||
            g instanceof Stroke ||
            g instanceof StrokeGroup ||
            (g instanceof Token && g.isPrimary()) ||
            g instanceof Wire
              ? g
              : null,
          near: ctx.event.position,
          tooFar: 10,
        });

        if (g) {
          g.remove();
        }
      },
    });
  }
}

function spawn(p: Position) {
  const elm = SVG.add('g', SVG.guiElm, {
    class: 'eraser',
    transform: `${SVG.positionToTransform(p)} rotate(${rand(0, 360)}) `,
  });
  SVG.add('line', elm, { y2: 6 });
  elm.onanimationend = () => elm.remove();
}
