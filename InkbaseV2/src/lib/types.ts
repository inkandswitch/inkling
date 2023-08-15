export interface Position {
  x: number;
  y: number;
}

// TODO: move this to the right place -- it's application-specific,
// so it doesn't belong here.
export interface PositionWithPressure extends Position {
  pressure: number;
}
