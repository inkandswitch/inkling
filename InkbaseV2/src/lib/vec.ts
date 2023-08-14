// Vec
// This is a port of (part of) Ivan's homemade CoffeeScript vector library.

import { isZero, roundTo } from "./math";

// Constructors ///////////////////////////////////////////////////////////////

const Vec = (x = 0, y = 0) => ({ x, y });
export default Vec;

Vec.clone = (v) => Vec(v.x, v.y);

Vec.fromRectXY = (r) => Vec(r.x, r.y);

Vec.fromRectWH = (r) => Vec(r.w, r.h);

Vec.fromRectRB = (r) => Vec(r.x + r.w, r.y + r.h);

Vec.of = (s) => Vec(s, s);

Vec.random = (scale = 1) =>
  Vec.Smul(scale, Vec.complement(Vec.Smul(2, Vec(Math.random(), Math.random()))));

Vec.toA = (v) => [v.x, v.y];

Vec.polar = (angle, length) => Vec(length * Math.cos(angle), length * Math.sin(angle));

// Static Vectors /////////////////////////////////////////////////////////////

Vec.x = Object.freeze(Vec(1));
Vec.y = Object.freeze(Vec(0, 1));
Vec.zero = Object.freeze(Vec());

// FP /////////////////////////////////////////////////////////////////////////

Vec.map = (f, v) => Vec(f(v.x), f(v.y));

Vec.map2 = (f, a, b) => Vec(f(a.x, b.x), f(a.y, b.y));

Vec.reduce = (f, v) => f(v.x, v.y);

// Vector Algebra /////////////////////////////////////////////////////////////

// Not really cross product, but close enough
Vec.cross = (a, b) => a.x * b.y - a.y * b.x;

Vec.project = (a, b) => Vec.mulS(b, Vec.dot(a, b) / Vec.len2(b));

Vec.reject = (a, b) => Vec.sub(a, Vec.project(a, b));

Vec.scalarProjection = (p, a, b) => {
  const ap = Vec.sub(p, a);
  const ab = Vec.normalize(Vec.sub(b, a));
  const f = Vec.mulS(ab, Vec.dot(ap, ab));
  return Vec.add(a, f);
};

// Piecewise Vector Arithmetic ////////////////////////////////////////////////

Vec.add = (a, b) => Vec(a.x + b.x, a.y + b.y);
Vec.div = (a, b) => Vec(a.x / b.x, a.y / b.y);
Vec.mul = (a, b) => Vec(a.x * b.x, a.y * b.y);
Vec.sub = (a, b) => Vec(a.x - b.x, a.y - b.y);

// Vector-Scalar Arithmetic ///////////////////////////////////////////////////

Vec.addS = (v, s) => Vec.add(v, Vec.of(s));
Vec.divS = (v, s) => Vec.div(v, Vec.of(s));
Vec.mulS = (v, s) => Vec.mul(v, Vec.of(s));
Vec.subS = (v, s) => Vec.sub(v, Vec.of(s));

// Scalar-Vector Arithmetic ///////////////////////////////////////////////////

Vec.Sadd = (s, v) => Vec.add(Vec.of(s), v);
Vec.Sdiv = (s, v) => Vec.div(Vec.of(s), v);
Vec.Smul = (s, v) => Vec.mul(Vec.of(s), v);
Vec.Ssub = (s, v) => Vec.sub(Vec.of(s), v);

// Measurement ////////////////////////////////////////////////////////////////

Vec.dist = (a, b) => Vec.len(Vec.sub(a, b));

// Strongly recommend using Vec.dist instead of Vec.dist2 (distance-squared)
Vec.dist2 = (a, b) => Vec.len2(Vec.sub(a, b));

Vec.dot = (a, b) => a.x * b.x + a.y * b.y;

Vec.equal = (a, b) => isZero(Vec.dist2(a, b));

// Strongly recommend using Vec.len instead of Vec.len2 (length-squared)
Vec.len2 = (v) => Vec.dot(v, v);

Vec.len = (v) => Math.sqrt(Vec.dot(v, v));

// Rounding ///////////////////////////////////////////////////////////////////

Vec.ceil = (v) => Vec.map(Math.ceil, v);
Vec.floor = (v) => Vec.map(Math.floor, v);
Vec.round = (v) => Vec.map(Math.round, v);
Vec.roundTo = (v, s) => Vec.map2(roundTo, v, Vec.of(s));

// Variations ///////////////////////////////////////////////////////////////////

Vec.complement = (v) => Vec.Ssub(1, v);
Vec.half = (v) => Vec.divS(v, 2);
Vec.normalize = (v) => Vec.divS(v, Vec.len(v));
Vec.recip = (v) => Vec.Sdiv(1, v);

// Prettier really screwed this one up, alas.
// The args should be: input, inputMin, inputMax, outputMin, outputMax
Vec.renormalize = (v, im, iM, om, oM) =>
  Vec.add(Vec.mul(Vec.div(Vec.sub(v, im), Vec.sub(iM, im)), Vec.sub(oM, om)), om);

// Combinations ///////////////////////////////////////////////////////////////////

Vec.avg = (a, b) => Vec.half(Vec.add(a, b));
Vec.lerp = (a, b, t) => Vec.add(a, Vec.Smul(t, Vec.sub(b, a)));
Vec.max = (a, b) => Vec.map2(Math.max, a, b);
Vec.min = (a, b) => Vec.map2(Math.min, a, b);

// Reflections ///////////////////////////////////////////////////////////////////

Vec.abs = (v) => Vec.map(Math.abs, v);
Vec.invert = (v) => Vec(-v.x, -v.y);
Vec.invertX = (v) => Vec(-v.x, v.y);
Vec.invertY = (v) => Vec(v.x, -v.y);

// Rotation & angles ///////////////////////////////////////////////////////////

// 90 degrees clockwise
Vec.rotate90CW = (v) => Vec(v.y, -v.x);

// 90 degrees counter clockwise
Vec.rotate90CCW = (v) => Vec(-v.y, v.x);

// TODO(marcel): right now this module is inconsistent in the way it expects angles to work.
// e.g., this function takes an angle in radians, whereas angleBetween uses degrees.
// (this will help avoid confusion...)
Vec.rotate = (v, angle) =>
  Vec(v.x * Math.cos(angle) - v.y * Math.sin(angle), v.x * Math.sin(angle) + v.y * Math.cos(angle));

// Rotate around
Vec.rotateAround = (vector, point, angle) => {
  // Translate vector to the origin
  const translatedVector = Vec.sub(vector, point);

  const rotatedVector = Vec.rotate(translatedVector, angle);

  // Translate vector back to its original position
  return Vec.add(rotatedVector, point);
};

Vec.angle = (v) => Math.atan2(v.y, v.x);

Vec.angleBetween = (a, b) => {
  // Calculate the dot product of the two vectors
  const dotProduct = Vec.dot(a, b);

  // Calculate the magnitudes of the two vectors
  const magnitudeA = Vec.len(a);
  const magnitudeB = Vec.len(b);

  // Calculate the angle between the vectors using the dot product and magnitudes
  const angleInRadians = Math.acos(dotProduct / (magnitudeA * magnitudeB));

  // Convert the angle from radians to degrees
  const angleInDegrees = (angleInRadians * 180) / Math.PI;

  return angleInDegrees;
};

Vec.angleBetweenClockwise = (a, b) => {
  const dP = Vec.dot(a, b);
  const cP = Vec.cross(a, b);

  const angle = Math.atan2(dP, cP);

  // Convert the angle from radians to degrees
  let angleInDegrees = angle * (180 / Math.PI);
  if (angleInDegrees < 0) {
    angleInDegrees = 360 + angleInDegrees;
  }

  return angleInDegrees;
};

Vec.update = (a, b) => {
  a.x = b.x;
  a.y = b.y;
};
