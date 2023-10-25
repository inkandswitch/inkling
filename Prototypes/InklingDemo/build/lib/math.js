export const TAU = Math.PI * 2;
export const isZero = (v) => Number.EPSILON > Math.abs(v);
export const isNonZero = (v) => !isZero(v);
export const avg = (a, b) => (a + b) / 2;
export const clip = (v, min = 0, max = 1) => Math.max(min, Math.min(v, max));
export const lerpN = (input, outputMin = 0, outputMax = 1, doClip = false) => {
  let output = input * (outputMax - outputMin) + outputMin;
  if (doClip) {
    output = clip(output, outputMin, outputMax);
  }
  return output;
};
export const lerp = (i, im = 0, iM = 1, om = 0, oM = 1, doClip = true) => {
  if (im === iM) {
    return om;
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
export const randInt = (min, max) => Math.round(rand(min, max));
export const roundTo = (input, precision) => {
  const p = 1 / precision;
  return Math.round(input * p) / p;
};
export const easeInOut = (t) => {
  const ease = (t2) => Math.pow(t2, 3);
  return t < 0.5 ? lerp(ease(t * 2), 0, 1, 0, 0.5) : lerp(ease((1 - t) * 2), 1, 0, 0.5, 1);
};
export function nearestMultiple(n, m) {
  return Math.round(n / m) * m;
}
