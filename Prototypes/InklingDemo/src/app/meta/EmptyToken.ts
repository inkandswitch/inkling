import Token from './Token';
import { GameObject } from '../GameObject';

export default class EmptyToken extends Token {
  width = 24;
  height = 30;
  value = '';

  constructor() {
    super();
  }

  isPrimary(): boolean {
    return true;
  }

  render(dt: number, t: number): void {
    // NOOP
  }
}

export const anEmptyToken = (gameObj: GameObject) =>
  gameObj instanceof EmptyToken ? gameObj : null;
