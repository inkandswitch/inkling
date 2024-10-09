import { forDebugging } from '../lib/helpers';
import { Position } from '../lib/types';
import Page from './Page';
import SVG from './Svg';

const DEFAULT_TOO_FAR = 20;

export interface FindOptions<T extends GameObject> {
  what(gameObj: GameObject): T | null;
  that?(gameObj: T): boolean;
  recursive?: boolean;
  near?: Position;
  tooFar?: number;
}

interface ForEachOptions<T extends GameObject> extends FindOptions<T> {
  do(gameObj: T): void;
}

export abstract class GameObject {
  maxHp = 0;
  hp = this.maxHp;

  parent: GameObject | null = null;
  readonly children = new Set<GameObject>();

  constructor(parent?: GameObject) {
    if (parent) {
      parent.adopt(this);
    }
  }

  get page(): Page {
    let p = this.parent;
    while (p) {
      if (p instanceof Page) {
        return p;
      }
      p = p.parent;
    }

    // If we get to this point, this object does not belong to a page.
    // But the root object knows what the current page is, so we can
    // return that.
    return this.root.page;
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
    // TODO: remove my children here?
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

  // TODO: write comment for this method
  abstract distanceToPoint(point: Position): number | null;

  find<T extends GameObject>(options: FindOptions<T>): T | null {
    const {
      what,
      that,
      recursive,
      near: pos,
      tooFar = DEFAULT_TOO_FAR,
    } = options;
    let nearestDist = tooFar;
    let ans: T | null = null;
    this.forEach({
      what,
      that,
      recursive,
      do(gameObj) {
        if (pos) {
          const dist = gameObj.distanceToPoint(pos);
          if (dist !== null && dist <= nearestDist) {
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
      what,
      that,
      recursive = true,
      near: pos,
      tooFar = DEFAULT_TOO_FAR,
      do: doFn,
    } = options;

    for (const gameObj of this.children) {
      if (recursive) {
        gameObj.forEach(options);
      }

      const narrowedGameObj = what(gameObj);
      if (!narrowedGameObj || (that && !that(narrowedGameObj))) {
        continue;
      }

      if (pos) {
        const dist = narrowedGameObj.distanceToPoint(pos);
        if (dist === null || dist >= tooFar) {
          continue;
        }
      }

      doFn.call(this, narrowedGameObj);
    }
  }

  bringToFront() {
    for (const obj of Object.values(this)) {
      if (obj instanceof SVGElement) {
        SVG.bringToFront(obj);
      }
    }
  }
}

export const aGameObject = (gameObj: GameObject) => gameObj;

export const root = new (class extends GameObject {
  currentPage: Page | null = null;

  get page() {
    return this.currentPage!;
  }

  distanceToPoint(point: Position) {
    return null;
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
})();

forDebugging('root', root);
