import { GameObject } from '../GameObject';
import { Position } from '../../lib/types';

import { signedDistanceToBox } from '../../lib/SignedDistance';
import Vec from '../../lib/vec';
import NumberToken from './NumberToken';
import LabelToken from './LabelToken';

export default abstract class Token extends GameObject {
  position: Position = { x: 100, y: 100 };
  width = 90;
  height = 40;

  abstract isPrimary(): boolean;

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

  midPoint() {
    return Vec.add(this.position, Vec.mulS(Vec(this.width, this.height), 0.5));
  }

  render(): void {
    // NO-OP
  }
}

export type TokenWithVariable = NumberToken | LabelToken;

export const isTokenWithVariable = (token: Token): token is TokenWithVariable =>
  token instanceof NumberToken || token instanceof LabelToken;

export const aToken = (gameObj: GameObject) =>
  gameObj instanceof Token ? gameObj : null;

export const aPrimaryToken = (gameObj: GameObject) =>
  gameObj instanceof Token && gameObj.isPrimary() ? gameObj : null;
