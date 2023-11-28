import TransformationMatrix from '../../lib/TransformationMatrix';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import { GameObject } from '../GameObject';
import { EventContext, Gesture } from '../Gesture';
import { FingerState, TouchId } from '../NativeEvents';
import Selected from '../Selected';
import Handle from '../ink/Handle';

export function transformSelection(ctx: EventContext): Gesture | void {
  if (Selected.size > 0) {
    let firstFinger: FingerState | null = null;
    let secondFinger: FingerState | null = null;
    const handlePositions = new Map<Handle, Position>();

    function makeTransform(
      firstFinger: FingerState,
      secondFinger: FingerState
    ) {
      const a = Vec.avg(firstFinger.position, secondFinger.position);
      const b = secondFinger.position;
      return TransformationMatrix.fromLineTranslateRotate(a, b);
    }

    return new Gesture('Transform Selection', {
      claim(ctx) {
        // Claim 2 fingers
        return ctx.event.type === 'finger' && !(firstFinger && secondFinger);
      },

      began(ctx) {
        if (!firstFinger) {
          firstFinger = ctx.state as FingerState;
        } else {
          secondFinger = ctx.state as FingerState;

          const transform = makeTransform(firstFinger, secondFinger).inverse();

          Selected.forEach(obj => {
            if (obj instanceof Handle) {
              handlePositions.set(obj, transform.transformPoint(obj.position));
            }
          });
        }
      },

      moved(ctx) {
        let transform: TransformationMatrix;
        if (firstFinger && secondFinger) {
          transform = makeTransform(firstFinger, secondFinger);
        } else {
          return;
        }

        Selected.forEach(obj => {
          if (obj instanceof Handle) {
            const oldPos = handlePositions.get(obj);
            if (oldPos) {
              obj.position = transform.transformPoint(oldPos);
            }
          }
        });
      },
    });
  }
}
