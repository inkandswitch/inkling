// Math
// The JS Math APIs aren't great. Here's a few extras that are nice to have.

export const TAU = Math.PI * 2;

export const isZero = (v: number) => Number.EPSILON > Math.abs(v);

export const isNonZero = (v: number) => !isZero(v);

export const avg = (a: number, b: number) => (a + b) / 2;

export const clip = (v: number, min = 0, max = 1) => Math.max(min, Math.min(v, max));

export const lerpN = (input: number, outputMin = 0, outputMax = 1, doClip = false) => {
  let output = input * (outputMax - outputMin) + outputMin;
  if (doClip) {
    output = clip(output, outputMin, outputMax);
  }
  return output;
};

// Prettier really screwed this one up, alas.
// The args should be: input, inputMin, inputMax, outputMin, outputMax, doClip
export const lerp = (i: number, im = 0, iM = 1, om = 0, oM = 1, doClip = true) => {
  if (im === iM) {
    return om; // Avoids a divide by zero
  }
  if (im > iM) {
    [im, iM, om, oM] = [iM, im, oM, om];
  }
  if (doClip) {
    i = clip(i, im, iM);
  }
  i -= im;
  i /= iM - im;
  return lerpN(i, om, oM, false);
};

export const rand = (min = -1, max = 1) => lerpN(Math.random(), min, max);

export const randInt = (min: number, max: number) => Math.round(rand(min, max));

export const roundTo = (input: number, precision: number) => {
  // Using the reciprocal avoids floating point errors. Eg: 3/10 is fine, but 3*0.1 is wrong.
  const p = 1 / precision;
  return Math.round(input * p) / p;
};

export const easeInOut = (t: number) => {
  const ease = (t) => Math.pow(t, 3);
  return t < 0.5 ? lerp(ease(t * 2), 0, 1, 0, 0.5) : lerp(ease((1 - t) * 2), 1, 0, 0.5, 1);
};
