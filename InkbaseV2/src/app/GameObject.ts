import { Position } from '../lib/types';
import * as stateDb from './state-db';

export abstract class GameObject {
  parent: GameObject | null = null;
  readonly children = new Set<GameObject>();

  constructor(public position: Position = { x: 0, y: 0 }) {
    this.parent?.children.add(this);
    stateDb.add(this);
  }

  adopt<T extends GameObject>(child: T): T {
    child.remove();
    this.children.add(child);
    child.parent = this;
    return child;
  }

  remove() {
    this.parent?.children.delete(this);
    this.parent = null;
  }

  /** This method is preferred over child.remove() b/c of the sanity check. */
  removeChild(child: GameObject) {
    if (!this.children.has(child)) {
      throw new Error('GameObject.removeChild() called w/ non-child argument!');
    }
    child.remove();
  }

  abstract render(): void;
}
