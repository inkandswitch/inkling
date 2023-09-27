import { Position } from '../lib/types';
import Page from './Page';

const DEFAULT_TOO_FAR = 20;

interface FindOptions<T extends GameObject> {
  pred(gameObj: GameObject): T | null;
  recursive?: boolean;
  nearPosition?: Position;
  tooFar?: number;
}

interface ForEachOptions<T extends GameObject> extends FindOptions<T> {
  do(gameObj: T): void;
}

export abstract class GameObject {
  parent: GameObject | null = null;
  readonly children = new Set<GameObject>();

  constructor() {}

  get page(): Page {
    const p = this.parent;
    while (p) {
      if (p instanceof Page) {
        return p;
      }
    }
    throw new Error('this game object does not belong to a page!');
  }

  get root(): GameObject {
    let p: GameObject = this;
    while (p.parent) {
      p = p.parent;
    }
    return p;
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

  find<T extends GameObject>(options: FindOptions<T>): T | null {
    const { pred, recursive, nearPosition, tooFar = DEFAULT_TOO_FAR } = options;
    let nearestDist = tooFar;
    let ans: T | null = null;
    this.forEach({
      pred,
      recursive,
      do(gameObj) {
        if (nearPosition) {
          const dist = gameObj.distanceToPoint(nearPosition);
          if (dist !== null && dist < nearestDist) {
            ans = gameObj;
            nearestDist = dist;
          }
        } else {
          if (ans === null) {
            ans = gameObj;
          }
        }
      },
    });
    return ans;
  }

  findAll<T extends GameObject>(options: FindOptions<T>) {
    const ans = [] as T[];
    this.forEach({
      ...options,
      do(gameObj) {
        ans.push(gameObj);
      },
    });
    return ans;
  }

  forEach<T extends GameObject>(options: ForEachOptions<T>) {
    const {
      pred,
      recursive = true,
      nearPosition,
      tooFar = DEFAULT_TOO_FAR,
      do: doFn,
    } = options;

    for (const gameObj of this.children) {
      if (recursive) {
        gameObj.forEach(options);
      }

      const narrowedGameObj = pred(gameObj);
      if (!narrowedGameObj) {
        continue;
      }

      if (nearPosition) {
        const dist = narrowedGameObj.distanceToPoint(nearPosition);
        if (dist === null || dist >= tooFar) {
          continue;
        }
      }

      doFn.call(this, narrowedGameObj);
    }
  }
}
