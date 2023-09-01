// Math
// The JS Math APIs aren't great. Here's a few extras that are nice to have.

export const TAU = Math.PI * 2;

export const isZero = (v) => {
  return Number.EPSILON > Math.abs(v);
};

export const isNonZero = (v) => {
  return !Math.zero(v);
};

export const avg = (a, b) => {
  return (a + b) / 2;
};

export const clip = (v, min = 0, max = 1) => {
  return Math.min(Math.max(min, v), max);
};

export const lerpN = (input, outputMin = 0, outputMax = 1, doClip = false) => {
  input *= outputMax - outputMin;
  input += outputMin;
  if (doClip) input = clip(input, outputMin, outputMax);
  return input;
};

// Prettier really screwed this one up, alas.
// The args should be: input, inputMin, inputMax, outputMin, outputMax, doClip
export const lerp = (i, im = 0, iM = 1, om = 0, oM = 1, doClip = true) => {
  if (im == iM) return om; // Avoids a divide by zero
  if (im > iM) [im, iM, om, oM] = [iM, im, oM, om];
  if (doClip) i = clip(i, im, iM);
  i -= im;
  i /= iM - im;
  return lerpN(i, om, oM, false);
};

export const rand = (min = -1, max = 1) => {
  return lerpN(Math.random(), min, max);
};

export const randInt = (min, max) => {
  return Math.round(rand(min, max));
};

export const roundTo = (input, precision) => {
  // Using the reciprocal avoids floating point errors. Eg: 3/10 is fine, but 3*0.1 is wrong.
  p = 1 / precision;
  return Math.round(input * p) / p;
};

export const easeInOut = (t) => {
  let ease = (t) => Math.pow(t, 3);
  if (t < 0.5) return lerp(ease(t * 2), 0, 1, 0, 0.5);
  else return lerp(ease((1 - t) * 2), 1, 0, 0.5, 1);
};
