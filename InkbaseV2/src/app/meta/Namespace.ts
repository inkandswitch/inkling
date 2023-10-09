import { Position } from '../../lib/types';
import Label from './Label';

// TODO: consider renaming Label -- that's a UI concept and doesn't feel like it belongs in the namespace.

export default class Namespace {
  private readonly labelById = new Map<number, Label>();
  private readonly labelByName = new Map<string, Label>();

  getLabelNamed(name: string) {
    if (this.labelByName.has(name)) {
      return this.labelByName.get(name)!;
    } else {
      const label = new Label(name);
      this.labelByName.set(name, label);
      this.labelById.set(label.id, label);
      return label;
    }
  }

  getLabelWithId(id: number) {
    if (this.labelById.has(id)) {
      return this.labelById.get(id)!;
    } else {
      throw new Error('there is no label with id ' + id);
    }
  }

  createLabel(strokeData: Position[][], width: number) {
    const label = new Label(strokeData, width);
    this.labelById.set(label.id, label);
    return label;
  }
}
