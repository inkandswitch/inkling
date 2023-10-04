import { Position } from '../../lib/types';
import Label from './Label';

export default class Namespace {
  readonly labels = new Set<Label>();

  createNewLabel(name: string): Label;
  createNewLabel(strokeData: Position[][], width: number): Label;
  createNewLabel(arg1: string | Position[][], arg2?: number): Label {
    const l =
      typeof arg1 === 'string' ? new Label(arg1) : new Label(arg1, arg2!);
    this.labels.add(l);
    return l;
  }
}
