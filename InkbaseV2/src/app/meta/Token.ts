import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';

import { signedDistanceToBox } from '../../lib/SignedDistance';

export default class Token extends GameObject {
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

  render(): void {
    // NO-OP
  }
}

export const aToken = (gameObj: GameObject) =>
  gameObj instanceof Token ? gameObj : null;
