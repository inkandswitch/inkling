import { EventContext, Gesture } from '../Gesture';
import { rand } from '../../lib/math';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import { GameObject, aGameObject } from '../GameObject';
import Stroke, { aStroke } from '../ink/Stroke';
import StrokeGroup from '../ink/StrokeGroup';
import MetaToggle from '../gui/MetaToggle';

export function erase(ctx: EventContext): Gesture | void {
  if (ctx.pseudoCount === 2) {
    return new Gesture('Erase', {
      moved(ctx) {
        spawn(ctx.event.position);

        const gos = ctx.root.findAll({
          what: ctx.metaToggle.active ? aMetaErasable : aConcreteErasable,
          near: ctx.event.position,
          tooFar: 10,
        });

        for (const go of gos) {
          if (--go.hp <= 0) {
            go.remove();
          }
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

const concreteErasables = [StrokeGroup, Stroke, MetaToggle];
export const aConcreteErasable = (gameObj: GameObject) =>
  concreteErasables.some(cls => gameObj instanceof cls) ? gameObj : null;

const metaNonErasables = [StrokeGroup, Stroke];
export const aMetaErasable = (gameObj: GameObject) =>
  metaNonErasables.some(cls => gameObj instanceof cls) ? null : gameObj;
