// Vec
// This is a port of (part of) Ivan's homemade CoffeeScript vector library.

import { Point as RPoint } from './relax-pk';
import { isZero, roundTo, clip } from "./math";

// Constructors ///////////////////////////////////////////////////////////////

const Vec = (x = 0, y = 0) => {
  return new RPoint(x, y);
};
export default Vec;

Vec.clone = (v) => {
  return Vec(v.x, v.y);
};

Vec.fromRectXY = (r) => {
  return Vec(r.x, r.y);
};

Vec.fromRectWH = (r) => {
  return Vec(r.w, r.h);
};

Vec.fromRectRB = (r) => {
  return Vec(r.x + r.w, r.y + r.h);
};

Vec.of = (s) => {
  return Vec(s, s);
};

Vec.random = (scale = 1) => {
  return Vec.Smul(
    scale,
    Vec.complement(Vec.Smul(2, Vec(Math.random(), Math.random())))
  );
};

Vec.toA = (v) => {
  return [v.x, v.y];
};

Vec.polar = (angle, length) => {
  const angleInRadians = (angle * Math.PI) / 180;
  return Vec(
    length * Math.cos(angleInRadians),
    length * Math.sin(angleInRadians)
  );
}

// Static Vectors /////////////////////////////////////////////////////////////

Vec.x = Object.freeze(Vec(1));
Vec.y = Object.freeze(Vec(0, 1));
Vec.zero = Object.freeze(Vec());

// FP /////////////////////////////////////////////////////////////////////////

Vec.map = (f, v) => {
  return Vec(f(v.x), f(v.y));
};

Vec.map2 = (f, a, b) => {
  return Vec(f(a.x, b.x), f(a.y, b.y));
};

Vec.reduce = (f, v) => {
  return f(v.x, v.y);
};

// Vector Algebra /////////////////////////////////////////////////////////////

// Not really cross product, but close enough
Vec.cross = (a, b) => {
  return a.x * b.y - a.y * b.x
};

Vec.project = (a, b) => {
  return Vec.mulS(b, Vec.dot(a, b) / Vec.len2(b));
};

Vec.reject = (a, b) => {
  return Vec.sub(a, Vec.project(a, b));
};

Vec.scalarProjection = (p, a, b) => {
  let ap = Vec.sub(p, a)
  let ab = Vec.normalize(Vec.sub(b, a))
  let f = Vec.mulS(ab,  Vec.dot(ap, ab))
  return Vec.add(a, f)
}

// Piecewise Vector Arithmetic ////////////////////////////////////////////////

Vec.add = (a, b) => {
  return Vec(a.x + b.x, a.y + b.y);
};

Vec.div = (a, b) => {
  return Vec(a.x / b.x, a.y / b.y);
};

Vec.mul = (a, b) => {
  return Vec(a.x * b.x, a.y * b.y);
};

Vec.sub = (a, b) => {
  return Vec(a.x - b.x, a.y - b.y);
};

// Vector-Scalar Arithmetic ///////////////////////////////////////////////////

Vec.addS = (v, s) => {
  return Vec.add(v, Vec.of(s));
};

Vec.divS = (v, s) => {
  return Vec.div(v, Vec.of(s));
};

Vec.mulS = (v, s) => {
  return Vec.mul(v, Vec.of(s));
};

Vec.subS = (v, s) => {
  return Vec.sub(v, Vec.of(s));
};

// Scalar-Vector Arithmetic ///////////////////////////////////////////////////

Vec.Sadd = (s, v) => {
  return Vec.add(Vec.of(s), v);
};

Vec.Sdiv = (s, v) => {
  return Vec.div(Vec.of(s), v);
};

Vec.Smul = (s, v) => {
  return Vec.mul(Vec.of(s), v);
};

Vec.Ssub = (s, v) => {
  return Vec.sub(Vec.of(s), v);
};

// Measurement ////////////////////////////////////////////////////////////////

Vec.dist = (a, b) => {
  return Vec.len(Vec.sub(a, b));
};

// Strongly recommend using Vec.dist instead of Vec.dist2 (distance-squared)
Vec.dist2 = (a, b) => {
  return Vec.len2(Vec.sub(a, b));
};

Vec.dot = (a, b) => {
  return a.x * b.x + a.y * b.y;
};

Vec.equal = (a, b) => {
  return isZero(Vec.dist2(a, b));
};

// Strongly recommend using Vec.len instead of Vec.len2 (length-squared)
Vec.len2 = (v) => {
  return Vec.dot(v, v);
};

Vec.len = (v) => {
  return Math.sqrt(Vec.dot(v, v));
};

// Rounding ///////////////////////////////////////////////////////////////////

Vec.ceil = (v) => {
  return Vec.map(Math.ceil, v);
};

Vec.floor = (v) => {
  return Vec.map(Math.floor, v);
};

Vec.round = (v) => {
  return Vec.map(Math.round, v);
};

Vec.roundTo = (v, s) => {
  return Vec.map2(roundTo, v, Vec.of(s));
};

// Variations ///////////////////////////////////////////////////////////////////

Vec.complement = (v) => {
  return Vec.Ssub(1, v);
};

Vec.half = (v) => {
  return Vec.divS(v, 2);
};

Vec.normalize = (v) => {
  return Vec.divS(v, Vec.len(v));
};

Vec.recip = (v) => {
  return Vec.Sdiv(1, v);
};

// Prettier really screwed this one up, alas.
// The args should be: input, inputMin, inputMax, outputMin, outputMax
Vec.renormalize = (v, im, iM, om, oM) => {
  return Vec.add(
    Vec.mul(Vec.div(Vec.sub(v, im), Vec.sub(iM, im)), Vec.sub(oM, om)),
    om
  );
};

// Combinations ///////////////////////////////////////////////////////////////////

Vec.avg = (a, b) => {
  return Vec.half(Vec.add(a, b));
};

Vec.lerp = (a, b, t) => {
  return Vec.add(a, Vec.Smul(t, Vec.sub(b, a)));
};

Vec.max = (a, b) => {
  return Vec.map2(Math.max, a, b);
};

Vec.min = (a, b) => {
  return Vec.map2(Math.min, a, b);
};

// Reflections ///////////////////////////////////////////////////////////////////

Vec.abs = (v) => {
  return Vec.map(Math.abs, v);
};

Vec.invert = (v) => {
  return Vec(-v.x, -v.y);
};

Vec.invertX = (v) => {
  return Vec(-v.x, v.y);
};

Vec.invertY = (v) => {
  return Vec(v.x, -v.y);
};

// Rotation & angles ///////////////////////////////////////////////////////////


// 90 degrees clockwise
Vec.rotate90CW = (v)=>{
  return Vec(v.y, -v.x);
}

// 90 degrees counter clockwise
Vec.rotate90CCW = (v)=>{
  return Vec(-v.y, v.x);
}

Vec.angle = (v) =>{
  var angleInRadians = Math.atan2(v.y, v.x);
  var angleInDegrees = ((angleInRadians * 180) / Math.PI)
  if (angleInDegrees < 0) {
    angleInDegrees += 360;
  }
  return angleInDegrees;
}

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
}

Vec.angleBetweenClockwise = (a, b) => {
  const dP = Vec.dot(a, b);
  const cP = Vec.cross(a, b);

  let angle = Math.atan2(dP, cP);

  // Convert the angle from radians to degrees
  let angleInDegrees = angle * (180 / Math.PI);
  if (angleInDegrees < 0) {
    angleInDegrees = 360 + angleInDegrees;
  }

  return angleInDegrees;
}