import Vec from "./vec.js";
let nextId = 0;
export function generateId() {
  return nextId++;
}
export function onEveryFrame(update) {
  const updatesPerSecond = 60;
  window.timeScale || (window.timeScale = 1);
  let lastRafTime;
  let accumulatedTime = 0;
  let elapsedUpdates = 0;
  const secondsPerUpdate = 1 / updatesPerSecond;
  function frame(ms) {
    const currentRafTime = ms / 1e3;
    const deltaRafTime = currentRafTime - lastRafTime;
    accumulatedTime += deltaRafTime * window.timeScale;
    while (accumulatedTime > secondsPerUpdate) {
      accumulatedTime -= secondsPerUpdate;
      elapsedUpdates++;
      update(secondsPerUpdate, elapsedUpdates * secondsPerUpdate);
    }
    lastRafTime = currentRafTime;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((ms) => {
    lastRafTime = ms / 1e3;
    requestAnimationFrame(frame);
  });
}
export function debugTable(obj, clear = true) {
  if (clear) {
    console.clear();
  }
  console.table(objectWithSortedKeys(obj));
}
export function objectWithSortedKeys(obj) {
  const newObj = {};
  for (const k of Object.keys(obj).sort()) {
    newObj[k] = obj[k];
  }
  return newObj;
}
export const notNull = (x) => !!x;
export function toDegrees(radians) {
  return radians * 180 / Math.PI;
}
export function farthestPair(points) {
  let maxDist = -Infinity;
  let mdp1 = null;
  let mdp2 = null;
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
  return [mdp1, mdp2];
}
export function makeIterableIterator(iterables, pred = (_t) => true) {
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
export function removeOne(set) {
  for (const element of set) {
    set.delete(element);
    return element;
  }
  return void 0;
}
export class SortedSet {
  constructor(items = []) {
    this.items = items;
  }
  static fromSet(set) {
    return new SortedSet(Array.from(set));
  }
  add(item) {
    for (const o of this.items) {
      if (o === item) {
        return;
      }
    }
    this.items.push(item);
  }
  moveItemToFront(item) {
    const oldIndex = this.items.indexOf(item);
    if (oldIndex === -1) {
      return;
    }
    const oldItem = this.items.splice(oldIndex, 1)[0];
    this.items.unshift(oldItem);
  }
  get(index) {
    return this.items[index];
  }
  size() {
    return this.items.length;
  }
  [Symbol.iterator]() {
    let index = -1;
    const data = this.items;
    return {
      next: () => ({value: data[++index], done: !(index in data)})
    };
  }
}
