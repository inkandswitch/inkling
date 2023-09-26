import { Position } from '../lib/types';
import Page from './Page';

const allGameObjects = [] as WeakRef<GameObject>[];

let cleanUpIdx = 0;

export function reclaimWeakRefs(timeBudgetMillis?: number) {
  const t0 = performance.now();
  let numReclaimed = 0;

  while (
    allGameObjects.length > 0 &&
    (timeBudgetMillis === undefined ||
      performance.now() - t0 < timeBudgetMillis)
  ) {
    if (cleanUpIdx >= allGameObjects.length) {
      // start at the beginning the next time this function is called
      cleanUpIdx = 0;
      return;
    }

    const gameObj = allGameObjects[cleanUpIdx].deref();
    if (!gameObj) {
      allGameObjects.splice(cleanUpIdx, 1);
      numReclaimed++;
    } else {
      cleanUpIdx++;
    }
  }

  if (numReclaimed > 0) {
    console.log('reclaimed', numReclaimed, 'weak refs');
  }
}

export abstract class GameObject {
  parent: GameObject | null = null;
  readonly children = new Set<GameObject>();

  constructor() {
    this.parent?.children.add(this);
    allGameObjects.push(new WeakRef(this));
  }

  get page(): Page {
    let p = this.parent;
    while (p) {
      if (p instanceof Page) {
        return p;
      }
      p = p.parent;
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

  find<T extends GameObject>(
    typePred: (gameObj: GameObject) => gameObj is T,
    pred?: (gameObj: T) => boolean
  ): T | null;
  find(pred: (gameObj: GameObject) => boolean): GameObject | null;
  find(
    pred1: (gameObj: GameObject) => boolean,
    pred2?: (gameObj: GameObject) => boolean
  ): GameObject | null {
    for (const wr of allGameObjects) {
      const gameObj = wr.deref();
      if (gameObj && pred1(gameObj) && (!pred2 || pred2(gameObj))) {
        return gameObj;
      }
    }
    return null;
  }

  findAll<T extends GameObject>(
    typePred: (gameObj: GameObject) => gameObj is T,
    pred?: (gameObj: T) => boolean
  ): T[];
  findAll(pred: (gameObj: GameObject) => boolean): GameObject[];
  findAll(
    pred1: (gameObj: GameObject) => boolean,
    pred2?: (gameObj: GameObject) => boolean
  ): GameObject[] {
    const gameObjs = [] as GameObject[];
    this.forEach(pred1, gameObj => {
      if (!pred2 || pred2(gameObj)) {
        gameObjs.push(gameObj);
      }
    });
    return gameObjs;
  }

  forEach<T extends GameObject>(
    typePred: (gameObj: GameObject) => gameObj is T,
    fn: (gameObj: T) => void
  ): void;
  forEach(
    pred: (gameObj: GameObject) => boolean,
    fn: (gameObj: GameObject) => void
  ): void;
  forEach(
    pred: (gameObj: GameObject) => boolean,
    fn: (gameObj: GameObject) => void
  ): void {
    for (const wr of allGameObjects) {
      const gameObj = wr.deref();
      if (gameObj && pred(gameObj)) {
        fn(gameObj);
      }
    }
  }

  findNearPosition<T extends GameObject>(
    typePred: (gameObj: GameObject) => gameObj is T,
    pos: Position,
    maxDist = 20
  ): T | null {
    let minDist = Infinity;
    let nearestGameObj: GameObject | null = null;
    this.forEach(typePred, gameObj => {
      const dist = gameObj.distanceToPoint(pos);
      if (dist !== null && dist < minDist && dist < maxDist) {
        minDist = dist;
        nearestGameObj = gameObj;
      }
    });
    return nearestGameObj;
  }

  findAllNearPosition<T extends GameObject>(
    typePred: (gameObj: GameObject) => gameObj is T,
    pos: Position,
    maxDist = 20
  ): T[] {
    const gameObjs = [] as T[];
    this.forEachNearPosition(typePred, pos, maxDist, gameObj =>
      gameObjs.push(gameObj)
    );
    return gameObjs;
  }

  forEachNearPosition<T extends GameObject>(
    typePred: (gameObj: GameObject) => gameObj is T,
    pos: Position,
    maxDist: number,
    fn: (gameObj: T) => void
  ): void {
    this.forEach(typePred, gameObj => {
      const dist = gameObj.distanceToPoint(pos);
      if (dist !== null && dist <= maxDist) {
        fn(gameObj);
      }
    });
  }
}
