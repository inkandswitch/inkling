// A debug view of an object's properties. Clearing is useful when debugging a single object at 60hz.
export function debugTable(obj: Object, clear = true) {
  if (clear) console.clear();
  console.table(objectWithSortedKeys(obj));
}

// My kingdom for a standard library that includes a key-sorted Map.
export function objectWithSortedKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {});
}
