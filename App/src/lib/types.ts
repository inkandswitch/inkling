export interface Position {
  x: number
  y: number
}

export interface PositionWithPressure extends Position {
  pressure: number
}

export function isPosition(value: any): value is Position {
  return value instanceof Object && typeof value.x === "number" && typeof value.y === "number"
}

export function isBoolean(value: any): value is boolean {
  return typeof value === "boolean"
}
