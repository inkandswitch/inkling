import Line from "./line.js";
import Vec from "./vec.js";
export function forDebugging(property, valueOrValueFn) {
  let value;
  if (typeof valueOrValueFn === "function") {
    const valueFn = valueOrValueFn;
    const oldValue = window[property];
    value = valueFn(oldValue);
  } else {
    value = valueOrValueFn;
  }
  window[property] = value;
}
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
export const notUndefined = (x) => !!x;
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
export function forEach(xs, fn) {
  xs.forEach((wr, idx) => {
    const x = wr.deref();
    if (x !== void 0) {
      fn(x, idx, xs);
    }
  });
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
export const sets = {
  overlap(s1, s2) {
    for (const x of s1) {
      if (s2.has(x)) {
        return true;
      }
    }
    return false;
  },
  union(s1, s2) {
    return new Set([...s1, ...s2]);
  },
  map(s, fn) {
    return new Set([...s].map(fn));
  }
};
export function distanceToPath(pos, points) {
  switch (points.length) {
    case 0:
      return null;
    case 1:
      return Vec.dist(pos, points[0]);
    default: {
      let minDist = Infinity;
      for (let idx = 0; idx < points.length - 1; idx++) {
        const p1 = points[idx];
        const p2 = points[idx + 1];
        minDist = Math.min(minDist, Line.distToPoint(Line(p1, p2), pos));
      }
      return minDist;
    }
  }
}
