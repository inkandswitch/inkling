import { generateId } from '../../lib/helpers';
import { Position } from '../../lib/types';
import { Variable } from '../constraints';

export default class Label {
  readonly id: number = generateId();
  readonly variable = new Variable(0);

  constructor(
    public readonly strokeData: Position[][],
    public readonly width: number
  ) {}
}
