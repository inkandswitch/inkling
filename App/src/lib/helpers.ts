import Line from "./line"
import { Position } from "./types"
import Vec from "./vec"

/**
 * Assigns a value to one of the properties on `window` to make it available
 * for debugging via the console. If `valueOrValueFn` is a function, it calls
 * that function w/ the old value for the property and stores the result.
 * Otherwise it stores the value.
 */
export function forDebugging<T>(property: string, valueOrValueFn: T | ((oldValue?: T) => T)) {
  let value: T
  if (typeof valueOrValueFn === "function") {
    const valueFn = valueOrValueFn as (oldValue?: T) => T
    const oldValue = (window as any)[property] as T | undefined
    value = valueFn(oldValue)
  } else {
    value = valueOrValueFn
  }

  ;(window as any)[property] = value
}

let nextId = 0
export function generateId() {
  return nextId++
}

export function onEveryFrame(update: (dt: number, time: number) => void) {
  // Set this to the number of updates you'd like to run per second.
  // Should be at least as high as the device frame rate to ensure smooth motion.
  // Must not be modified at runtime, because it's used to calculate elapsed time.
  const updatesPerSecond = 60

  // You CAN change this at runtime for slow-mo / speed-up effects, eg for debugging.
  ;(window as any).timeScale ||= 1

  // Internal state
  let lastRafTime: number
  let accumulatedTime = 0 // Time is added to this by RAF, and consumed by running updates
  let elapsedUpdates = 0 // How many updates have we run — used to measure elapsed time
  const secondsPerUpdate = 1 / updatesPerSecond

  function frame(ms: number) {
    const currentRafTime = ms / 1000
    const deltaRafTime = currentRafTime - lastRafTime
    accumulatedTime += deltaRafTime * (window as any).timeScale

    while (accumulatedTime > secondsPerUpdate) {
      accumulatedTime -= secondsPerUpdate
      elapsedUpdates++
      update(secondsPerUpdate, elapsedUpdates * secondsPerUpdate)
    }

    lastRafTime = currentRafTime

    requestAnimationFrame(frame)
  }

  requestAnimationFrame((ms) => {
    lastRafTime = ms / 1000
    requestAnimationFrame(frame)
  })
}

// A debug view of an object's properties. Clearing is useful when debugging a single object at 60hz.
export function debugTable(obj: {}, clear = true) {
  if (clear) {
    console.clear()
  }
  console.table(objectWithSortedKeys(obj))
}

type Obj = Record<string, any>

// My kingdom for a standard library that includes a key-sorted Map.
export function objectWithSortedKeys(obj: Obj) {
  const newObj: Obj = {}
  for (const k of Object.keys(obj).sort()) {
    newObj[k] = obj[k]
  }
  return newObj
}

export const notNull = <T>(x: T | null): x is T => !!x
export const notUndefined = <T>(x: T | undefined): x is T => !!x

export function toDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

// this is O(n^2), but there is a O(n * log(n)) solution
// that we can use if this ever becomes a bottleneck
// https://www.baeldung.com/cs/most-distant-pair-of-points
export function farthestPair<P extends Position>(points: P[]): [P, P] {
  let maxDist = -Infinity
  let mdp1: P | null = null
  let mdp2: P | null = null
  for (const p1 of points) {
    for (const p2 of points) {
      const d = Vec.dist(p1, p2)
      if (d > maxDist) {
        mdp1 = p1
        mdp2 = p2
        maxDist = d
      }
    }
  }
  return [mdp1!, mdp2!]
}

export function forEach<T extends WeakKey>(xs: WeakRef<T>[], fn: (x: T, idx: number, xs: WeakRef<T>[]) => void) {
  xs.forEach((wr, idx) => {
    const x = wr.deref()
    if (x !== undefined) {
      fn(x, idx, xs)
    }
  })
}

export function makeIterableIterator<T, S extends T>(
  iterables: Iterable<T>[],
  pred: (t: T) => t is S
): IterableIterator<S>
export function makeIterableIterator<T>(iterables: Iterable<T>[], pred?: (t: T) => boolean): IterableIterator<T>
export function makeIterableIterator<T>(iterables: Iterable<T>[], pred: (t: T) => boolean = (_t) => true) {
  function* generator() {
    for (const ts of iterables) {
      for (const t of ts) {
        if (!pred || pred(t)) {
          yield t
        }
      }
    }
  }
  return generator()
}

export function removeOne<T>(set: Set<T>): T | undefined {
  for (const element of set) {
    set.delete(element)
    return element
  }
  return undefined
}

// Sorted Set
// Guarantees unique items, and allows resorting of items when iterating
export class SortedSet<T> {
  constructor(private readonly items: T[] = []) {}

  static fromSet<T>(set: Set<T>) {
    return new SortedSet(Array.from(set))
  }

  add(item: T) {
    for (const o of this.items) {
      if (o === item) {
        return
      }
    }

    this.items.push(item)
  }

  moveItemToFront(item: T) {
    // find old position
    const oldIndex = this.items.indexOf(item)
    if (oldIndex === -1) {
      return
    }

    // Remove item from old position
    const oldItem = this.items.splice(oldIndex, 1)[0]

    // Add it back to front
    this.items.unshift(oldItem)
  }

  get(index: number) {
    return this.items[index]
  }

  size() {
    return this.items.length
  }

  [Symbol.iterator]() {
    let index = -1
    const data = this.items

    return {
      next: () => ({ value: data[++index], done: !(index in data) })
    }
  }
}

/** Helper functions for dealing with `Set`s. */
export const sets = {
  overlap<T>(s1: Set<T>, s2: Set<T>) {
    for (const x of s1) {
      if (s2.has(x)) {
        return true
      }
    }
    return false
  },
  union<T>(s1: Set<T>, s2: Set<T>) {
    return new Set<T>([...s1, ...s2])
  },
  map<S, T>(s: Set<S>, fn: (x: S) => T) {
    return new Set([...s].map(fn))
  }
}

export function distanceToPath(pos: Position, points: Position[]) {
  switch (points.length) {
    case 0:
      return null
    case 1:
      return Vec.dist(pos, points[0])
    default: {
      // This is probably *very* slow
      let minDist = Infinity
      for (let idx = 0; idx < points.length - 1; idx++) {
        const p1 = points[idx]
        const p2 = points[idx + 1]
        minDist = Math.min(minDist, Line.distToPoint(Line(p1, p2), pos))
      }
      return minDist
    }
  }
}
