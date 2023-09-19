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

  console.log('reclaimed', numReclaimed, 'weak refs');
}

export function find<T extends GameObject>(
  pred: (gameObj: GameObject) => gameObj is T
): T | null;
export function find(pred: (gameObj: GameObject) => boolean): GameObject | null;
export function find(
  pred: (gameObj: GameObject) => boolean
): GameObject | null {
  for (const wr of allGameObjects) {
    const gameObj = wr.deref();
    if (gameObj && pred(gameObj)) {
      return gameObj;
    }
  }
  return null;
}

export function findAll<T extends GameObject>(
  pred: (gameObj: GameObject) => gameObj is T
): T[];
export function findAll(pred: (gameObj: GameObject) => boolean): GameObject[];
export function findAll(pred: (gameObj: GameObject) => boolean): GameObject[] {
  const gameObjs = [] as GameObject[];
  withMatchesDo(pred, gameObj => gameObjs.push(gameObj));
  return gameObjs;
}

export function withMatchesDo<T extends GameObject>(
  pred: (gameObj: GameObject) => gameObj is T,
  fn: (gameObj: T) => void
): void;
export function withMatchesDo(
  pred: (gameObj: GameObject) => boolean,
  fn: (gameObj: GameObject) => void
): void;
export function withMatchesDo(
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
