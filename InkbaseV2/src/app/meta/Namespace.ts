import { Position } from '../../lib/types';
import Label from './Label';

export default class Namespace {
  readonly labels = new Set<Label>();

  createNewLabel(strokeData: Position[][], width: number): Label {
    const l = new Label(strokeData, width);
    this.labels.add(l);
    return l;
  }
}
