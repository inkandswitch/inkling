import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';

import { signedDistanceToBox } from '../../lib/SignedDistance';
import Vec from '../../lib/vec';

export default class Token extends GameObject {
  primary = false;

  position: Position = { x: 100, y: 100 };
  width = 90;
  height = 40;

  distanceToPoint(pos: Position): number | null {
    return signedDistanceToBox(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      pos.x,
      pos.y
    );
  }

  midPoint(){
    return Vec.add(
      this.position,
      Vec.mulS(Vec(this.width, this.height), 0.5)
    )
  }

  render(): void {
    // NO-OP
  }
}

export const aToken = (gameObj: GameObject) =>
  gameObj instanceof Token ? gameObj : null;

export const aPrimaryToken = (gameObj: GameObject) => {
  return gameObj instanceof Token && gameObj.primary ? gameObj : null;
}
  