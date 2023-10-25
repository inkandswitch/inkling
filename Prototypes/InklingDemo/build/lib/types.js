export function isPosition(value) {
  return value instanceof Object && typeof value.x === "number" && typeof value.y === "number";
}
