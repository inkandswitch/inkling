export interface Position {
  x: number;
  y: number;
}

export function isPosition(value: any): value is Position {
  return (
    value instanceof Object &&
    typeof value.x === 'number' &&
    typeof value.y === 'number'
  );
}

// TODO: move this to the right place -- it's application-specific,
// so it doesn't belong here.
export interface PositionWithPressure extends Position {
  pressure: number;
}

export interface PositionWithRadius extends Position {
  radius: number;
}
