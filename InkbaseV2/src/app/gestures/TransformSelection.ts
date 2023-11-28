import TransformationMatrix from '../../lib/TransformationMatrix';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import { EventContext, Gesture } from '../Gesture';
import { FingerState } from '../NativeEvents';
import Selected from '../Selected';
import Handle from '../ink/Handle';
import * as constraints from '../constraints';

export function transformSelection(ctx: EventContext): Gesture | void {
  if (!(Selected.size > 0 && ctx.pseudo)) {
    return;
  }

  let firstFinger: FingerState | null = null;
  let secondFinger: FingerState | null = null;
  const handlePositions = new Map<Handle, Position>();

  const makeMoveTransform = (p: Position) =>
    TransformationMatrix.identity().translate(p.x, p.y);
  const makePinchTransform = (a: Position, b: Position) =>
    TransformationMatrix.fromLine(Vec.avg(a, b), b);

  function resetTransform() {
    let transform: TransformationMatrix;
    if (firstFinger && secondFinger) {
      transform = makePinchTransform(
        firstFinger.position,
        secondFinger.position
      );
    } else if (firstFinger) {
      transform = makeMoveTransform(firstFinger.position);
    } else {
      return;
    }
    transform = transform.inverse();
    handlePositions.clear();
    Selected.forEach(obj => {
      if (obj instanceof Handle) {
        handlePositions.set(obj, transform.transformPoint(obj.position));
      }
    });
  }

  return new Gesture('Transform Selection', {
    claim: 'fingers',

    began(ctx) {
      if (!firstFinger) {
        firstFinger = ctx.state as FingerState;
        resetTransform();
      } else if (!secondFinger) {
        secondFinger = ctx.state as FingerState;
        resetTransform();
      }
    },

    ended(ctx) {
      if (ctx.event.id === firstFinger?.id) {
        firstFinger = secondFinger;
        secondFinger = null;
        resetTransform();
      } else if (ctx.event.id === secondFinger?.id) {
        secondFinger = null;
        resetTransform();
      }
      Selected.forEach(obj => {
        if (obj instanceof Handle) {
          constraints.finger(obj).remove();
        }
      });
    },

    moved(ctx) {
      let transform: TransformationMatrix;
      if (firstFinger && secondFinger) {
        transform = makePinchTransform(
          firstFinger.position,
          secondFinger.position
        );
      } else if (firstFinger) {
        transform = makeMoveTransform(firstFinger.position);
      } else {
        return;
      }

      Selected.forEach(obj => {
        if (obj instanceof Handle) {
          const oldPos = handlePositions.get(obj);
          if (oldPos) {
            obj.position = transform.transformPoint(oldPos);
            constraints.finger(obj);
          }
        }
      });
    },
  });
}
