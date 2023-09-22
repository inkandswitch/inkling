import { Position } from '../lib/types';
import Vec from '../lib/vec';
import { GameObject } from './GameObject';

const allGameObjects = [] as WeakRef<GameObject>[];

export function add(gameObject: GameObject) {
  allGameObjects.push(new WeakRef(gameObject));
}

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

export function find<T extends GameObject>(
  typePred: (gameObj: GameObject) => gameObj is T,
  pred?: (gameObj: T) => boolean
): T | null;
export function find(pred: (gameObj: GameObject) => boolean): GameObject | null;
export function find(
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

export function findAll<T extends GameObject>(
  typePred: (gameObj: GameObject) => gameObj is T,
  pred?: (gameObj: T) => boolean
): T[];
export function findAll(pred: (gameObj: GameObject) => boolean): GameObject[];
export function findAll(
  pred1: (gameObj: GameObject) => boolean,
  pred2?: (gameObj: GameObject) => boolean
): GameObject[] {
  const gameObjs = [] as GameObject[];
  forEach(pred1, gameObj => {
    if (!pred2 || pred2(gameObj)) {
      gameObjs.push(gameObj);
    }
  });
  return gameObjs;
}

export function forEach<T extends GameObject>(
  typePred: (gameObj: GameObject) => gameObj is T,
  fn: (gameObj: T) => void
): void;
export function forEach(
  pred: (gameObj: GameObject) => boolean,
  fn: (gameObj: GameObject) => void
): void;
export function forEach(
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

export function findNearPosition<T extends GameObject & { position: Position }>(
  pred: (gameObj: GameObject) => gameObj is T,
  pos: Position,
  maxDist = 20
): T | null {
  let minDist = Infinity;
  let nearestGameObj: GameObject | null = null;
  forEach(pred, gameObj => {
    const dist = Vec.dist(gameObj.position, pos);
    if (dist < minDist && dist < maxDist) {
      minDist = dist;
      nearestGameObj = gameObj;
    }
  });
  return nearestGameObj;
}

export function findAllNearPosition<
  T extends GameObject & { position: Position },
>(
  pred: (gameObj: GameObject) => gameObj is T,
  pos: Position,
  maxDist = 20
): T[] {
  const gameObjs = [] as T[];
  forEachNearPosition(pred, pos, maxDist, gameObj => gameObjs.push(gameObj));
  return gameObjs;
}

export function forEachNearPosition<
  T extends GameObject & { position: Position },
>(
  pred: (gameObj: GameObject) => gameObj is T,
  pos: Position,
  maxDist: number,
  fn: (gameObj: T) => void
): void {
  forEach(pred, gameObj => {
    if (Vec.dist(gameObj.position, pos) <= maxDist) {
      fn(gameObj);
    }
  });
}
