import { Position } from '../lib/types';
import * as stateDb from './state-db';

export abstract class GameObject {
  readonly children = new Set<GameObject>();

  constructor(
    public parent: GameObject | null,
    public position: Position = { x: 0, y: 0 }
  ) {
    stateDb.add(this);
  }

  remove() {
    this.parent?.removeChild(this);
  }

  protected removeChild(child: GameObject) {
    this.children.delete(child);
  }

  abstract render(): void;
}

export class Root extends GameObject {
  constructor() {
    super(null);
  }

  render() {
    for (const child of this.children) {
      child.render();
    }
  }
}
