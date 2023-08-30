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
export function notNull(x) {
  return x != null;
}
