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
