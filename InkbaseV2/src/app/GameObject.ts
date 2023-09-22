import { Position } from '../lib/types';
import * as stateDb from './state-db';

export abstract class GameObject {
  parent: GameObject | null = null;
  readonly children = new Set<GameObject>();

  constructor() {
    this.parent?.children.add(this);
    stateDb.add(this);
  }

  adopt<T extends GameObject>(child: T): T {
    child.parent?.children.delete(child);
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

  abstract render(dt: number, t: number): void;

  distanceToPoint(_point: Position): number | null {
    return null;
  }
}
