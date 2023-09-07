import { Position } from './types';
import Vec from './vec';

let nextId = 0;
export function generateId() {
  return nextId++;
}

export function onEveryFrame(update: (dt: number, time: number) => void) {
  // Set this to the number of updates you'd like to run per second.
  // Should be at least as high as the device frame rate to ensure smooth motion.
  // Must not be modified at runtime, because it's used to calculate elapsed time.
  const updatesPerSecond = 60;

  // You CAN change this at runtime for slow-mo / speed-up effects, eg for debugging.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).timeScale = 1;

  // Internal state
  let lastRafTime: number;
  let accumulatedTime = 0; // Time is added to this by RAF, and consumed by running updates
  let elapsedUpdates = 0; // How many updates have we run — used to measure elapsed time
  const secondsPerUpdate = 1 / updatesPerSecond;

  function frame(ms: number) {
    const currentRafTime = ms / 1000;
    const deltaRafTime = currentRafTime - lastRafTime;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accumulatedTime += deltaRafTime * (window as any).timeScale;

    while (accumulatedTime > secondsPerUpdate) {
      accumulatedTime -= secondsPerUpdate;
      elapsedUpdates++;
      update(secondsPerUpdate, elapsedUpdates * secondsPerUpdate);
    }

    lastRafTime = currentRafTime;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(ms => {
    lastRafTime = ms / 1000;
    requestAnimationFrame(frame);
  });
}

// A debug view of an object's properties. Clearing is useful when debugging a single object at 60hz.
export function debugTable(obj: {}, clear = true) {
  if (clear) {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    console.clear();
  }
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  console.table(objectWithSortedKeys(obj));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>;

// My kingdom for a standard library that includes a key-sorted Map.
export function objectWithSortedKeys(obj: Obj) {
  const newObj: Obj = {};
  for (const k of Object.keys(obj).sort()) {
    newObj[k] = obj[k];
  }
  return newObj;
}

export const notNull = <T>(x: T | null): x is T => !!x;

export function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

// this is O(n^2), but there is a O(n * log(n)) solution
// that we can use if this ever becomes a bottleneck
// https://www.baeldung.com/cs/most-distant-pair-of-points
export function farthestPair<P extends Position>(points: P[]): [P, P] {
  let maxDist = -Infinity;
  let mdp1: P | null = null;
  let mdp2: P | null = null;
  for (const p1 of points) {
    for (const p2 of points) {
      const d = Vec.dist(p1, p2);
      if (d > maxDist) {
        mdp1 = p1;
        mdp2 = p2;
        maxDist = d;
      }
    }
  }
  return [mdp1!, mdp2!];
}

export function makeIterableIterator<T, S extends T>(
  iterables: Iterable<T>[],
  pred: (t: T) => t is S
): IterableIterator<S>;
export function makeIterableIterator<T>(
  iterables: Iterable<T>[],
  pred?: (t: T) => boolean
): IterableIterator<T>;
export function makeIterableIterator<T>(
  iterables: Iterable<T>[],
  pred: (t: T) => boolean = _t => true
) {
  function* generator() {
    for (const ts of iterables) {
      for (const t of ts) {
        if (!pred || pred(t)) {
          yield t;
        }
      }
    }
  }
  return generator();
}

// Sorted Set
// Guarantees unique items, and allows resorting of items when iterating
export class SortedSet<T> {
  constructor(private readonly items: T[] = []) {}

  static fromSet<T>(set: Set<T>) {
    return new SortedSet(Array.from(set));
  }

  add(item: T) {
    for (const o of this.items) {
      if (o === item) {
        return;
      }
    }

    this.items.push(item);
  }

  moveItemToFront(item: T) {
    // find old position
    const oldIndex = this.items.indexOf(item);
    if (oldIndex === -1) {
      return;
    }

    // Remove item from old position
    const oldItem = this.items.splice(oldIndex, 1)[0];

    // Add it back to front
    this.items.unshift(oldItem);
  }

  get(index: number) {
    return this.items[index];
  }

  size() {
    return this.items.length;
  }

  [Symbol.iterator]() {
    let index = -1;
    const data = this.items;

    return {
      next: () => ({ value: data[++index], done: !(index in data) }),
    };
  }
}
