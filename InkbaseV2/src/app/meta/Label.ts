import { generateId } from '../../lib/helpers';
import { Position } from '../../lib/types';
import { Variable } from '../constraints';

export default class Label {
  readonly id: number = generateId();
  readonly variable = new Variable(0);
  readonly display: string | { strokeData: Position[][]; width: number };

  constructor(display: string);
  constructor(strokeData: Position[][], width: number);
  constructor(arg1: string | Position[][], arg2?: number) {
    if (typeof arg1 === 'string') {
      this.display = arg1;
    } else {
      this.display = { strokeData: arg1, width: arg2! };
    }
  }
}