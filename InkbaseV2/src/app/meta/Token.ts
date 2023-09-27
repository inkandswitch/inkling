import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';

import { signedDistanceToBox } from './SignedDistance';


export default class Token extends GameObject {
  position: Position = {x: 100, y: 100};
  width: number = 90;
  height: number = 40;

  distanceToPoint(pos: Position): number | null {
    return signedDistanceToBox(
      this.position.x, this.position.y, 
      this.width, this.height, 
      pos.x, pos.y
    );
  }

  render(dt: number, t: number): void {
    // NO-OP
  }
}

export const aToken = (gameObj: GameObject) =>
  gameObj instanceof Token ? gameObj : null;