export function debugTable(obj, clear = true) {
  if (clear) {
    console.clear();
  }
  console.table(objectWithSortedKeys(obj));
}
export function objectWithSortedKeys(obj) {
  return Object.keys(obj).sort().reduce((acc, k) => ({...acc, [k]: obj[k]}), {});
}
