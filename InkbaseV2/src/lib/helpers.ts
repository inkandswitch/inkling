import { Position } from "./types";
import Vec from "./vec";

// A debug view of an object's properties. Clearing is useful when debugging a single object at 60hz.
export function debugTable(obj: {}, clear = true) {
  if (clear) {
    console.clear();
  }
  console.table(objectWithSortedKeys(obj));
}

// My kingdom for a standard library that includes a key-sorted Map.
// tslint:disable:no-any
export function objectWithSortedKeys(obj: Record<string, any>) {
  const newObj: Record<string, any> = {};
  for (const k of Object.keys(obj).sort()) {
    newObj[k] = obj[k];
  }
  return newObj;
}
// tslint:enable

export function notNull<T>(x: T | null): x is T {
  return x != null;
}

// this is O(n^2), but there is a O(n * log(n)) solution
// that we can use if this ever becomes a bottleneck
// https://www.baeldung.com/cs/most-distant-pair-of-points
export function farthestPair(points: Position[]): [Position, Position] {
  let maxDist = -Infinity;
  let mdp1: Position | null = null;
  let mdp2: Position | null = null;
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
