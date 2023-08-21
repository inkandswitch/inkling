export interface Position {
  x: number;
  y: number;
  [etc: string]: any;
}

// TODO: move this to the right place -- it's application-specific,
// so it doesn't belong here.
export interface PositionWithPressure extends Position {
  pressure: number;
}

export interface PositionWithRadius extends Position {
  radius: number;
}
