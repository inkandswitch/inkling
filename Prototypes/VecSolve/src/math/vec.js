// Vec
// This is a port of (part of) Ivan's homemade CoffeeScript vector library.
// Feel free to add new functions as needed. And if we want additional vector
// graphic libs, Ivan has a bunch: matrices, rectangles, etc.
// Vecs aren't frozen, but the library treats them as immutable.
// Worth saying — this code is much nicer in CoffeeScript (sorry), and holy cow
// it'd be nice to have real operator overloading in JS. Anyway...
// Feel free to make your own {x,y} objects, or manipulate Vecs yourself,
// instead of using the functions here. They're just here if you want 'um.

import { isZero, roundTo, clip } from "./math";

// Constructors ///////////////////////////////////////////////////////////////

const Vec = (x = 0, y = 0) => {
  return { x, y };
};
export default Vec;

Vec.clone = (v) => {
  return Vec(v.x, v.y);
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

Vec.cross = () => {
  throw new Error("There is no cross product in 2D");
  return;
};

Vec.project = (a, b) => {
  return Vec.mulS(b, Vec.dot(a, b) / Vec.len2(b));
};

Vec.reject = (a, b) => {
  return Vec.sub(a, Vec.project(a, b));
};

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

// Rotatiion ////////////////////////////////////////////////////////////////
Vec.rotate = (v, a) => {
    a = a * (Math.PI/180)
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    return Vec(
      v.x * cos - v.y * sin,
      v.x * sin + v.y * cos
    )
}

Vec.angle = (v) => {
    const angle = Math.atan2(v.y, v.x);
    return angle
    //const degrees = 180 * angle / Math.PI;
    //return (360 + Math.round(degrees)) % 360;
}


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

Vec.same = (a,b) =>{
  return a.x == b.x && a.y == b.y
}

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

Vec.set = (a,b) =>{
  a.x = b.x
  a.y = b.y
}

// Niceness for Crosscut //////////////////////////////////////////////////////////////////////////

Vec.midpoint = Vec.avg;

// This will give you the normalized position (0 to 1) of a point that lies somewhere along a line.
// p is the point whose position we want.
// lineA and lineB are the endpoints of the line.
// The return value will be 0 if p is right on top of lineA.
Vec.intersectionPosition = (p, lineA, lineB) => {
  if (Vec.equal(lineA, lineB)) return 0; // Avoid divide-by-zero
  return Vec.dist(p, lineA) / Vec.dist(lineA, lineB);
};

Vec.distPointLine = (p, lineA, lineB) => {
  // Here's my favourite (visual) explanation of the math that follows: https://www.youtube.com/watch?v=PMltMdi1Wzg

  // Treat the lineA point as the origin, and make 2 vectors relative to it:
  const vecToP = Vec.sub(p, lineA); // A vector from the origin to the target point.
  const vecToB = Vec.sub(lineB, lineA); // A vector from the origin to the other end of the line.

  // Imagine that the line from lineA to lineB actually stretches off to infinity in both directions.
  // There's some imaginary point along this line that is closest to our target point.
  // Let's call that imaginary point Q.
  // We will compute where Q is along this line, relative to A and B.
  // If Q is between A and B, we get numbers in the range 0-1. If Q is before A, we get < 0. If Q is after B, we get > 1.
  let relativePosition = Vec.dot(vecToP, vecToB) / Vec.len2(vecToB);

  // Now, let's clip this relativePosition to the range 0-1.
  relativePosition = clip(relativePosition);

  // Take the vector between A and B, and scale by this relative position.
  // This gives us the actual point Q, but limited so that it can't go past A or B.
  let vecToQ = Vec.mulS(vecToB, relativePosition);

  // Boom! Now we can take the distance between our target point and point Q
  return Vec.dist(vecToP, vecToQ);
};

Vec.distPointAABBPerimeter = (p, aabb) => {
  // Here's my favourite (visual) explanation of the math that follows: https://www.youtube.com/watch?v=62-pRVZuS5c

  // Treat the aabb center as the origin.
  p = Vec.sub(p, aabb.center);
  // The aabb is symmetrical on both axes, so we can simplify to just the bottom-right quadrant
  // (where everything is positive).
  p = Vec.abs(p);
  let size = Vec(aabb.width / 2, aabb.height / 2);
  // Along each axis, get the distance between the point and the aabb perimeter.
  let q = Vec.sub(p, size);

  // It might seem like we could stop now, but the above doesn't correctly handle the case where
  // the target point is outside the rect and closest to a corner (rather than an edge).
  // To handle the corner, we need to get a little fancier.

  // If the point is outside the aabb, this will be the distance from the point to the closest edge,
  // or to the corner. If the point is inside, this will be zero.
  let outside = Vec.len(Vec.max(q, Vec.zero));
  // If the point is inside the aabb, this will be the negative(!) distance from the point to the closest edge.
  // If the point is outside, this will be zero.
  let inside = Math.min(Math.max(q.x, q.y), 0);
  // Boom! We've got the signed distance between a point and an aabb.
  let signedDistance = outside + inside;

  // Since we don't care about the sign, we will just abs this before returning.
  return Math.abs(signedDistance);
};

Vec.closestPointOnAABBPerimeter = (p, aabb) => {
  // Treat the aabb center as the origin.
  p = Vec.sub(p, aabb.center);
  let size = Vec(aabb.width / 2, aabb.height / 2);
  // Along each axis, get the distance between the point and the aabb perimeter.
  let q = Vec.sub(p, size);

  // It might seem like we could stop now, but the above doesn't correctly handle the case where
  // the target point is outside the rect and closest to a corner (rather than an edge).
  // To handle the corner, we need to get a little fancier.

  // If the point is outside the aabb, this will be the distance from the point to the closest edge,
  // or to the corner. If the point is inside, this will be zero.
  let outside = Vec.len(Vec.max(q, Vec.zero));
  // If the point is inside the aabb, this will be the negative(!) distance from the point to the closest edge.
  // If the point is outside, this will be zero.
  let inside = Math.min(Math.max(q.x, q.y), 0);
  // Boom! We've got the signed distance between a point and an aabb.
  let signedDistance = outside + inside;

  // Since we don't care about the sign, we will just abs this before returning.
  return Math.abs(signedDistance);
};

Vec.intersectPointAABBCenter = (p, aabb) => {
  // Treat the aabb center as the origin.
  let pAABB = Vec.sub(p, aabb.center);

  // The aabb is symmetrical on both axes, so we can simplify to just the bottom-right quadrant
  // (where everything is positive).
  p = Vec.abs(pAABB);
  let size = Vec(aabb.width / 2, aabb.height / 2);

  // 0-----A
  // |     |
  // C-----B
  const A = Vec(size.x, 0);
  const B = Vec(size.x, size.y);
  const C = Vec(0, size.y);

  // Find the intersections on the right side and bottom side of the aabb
  let right = Vec.intersectLineLine(Vec.zero, p, A, B);
  let bottom = Vec.intersectLineLine(Vec.zero, p, B, C);

  // Keep whichever intersection results in a shorter line between the intersection and the aabb center.
  let q = Vec.len(right) < Vec.len(bottom) ? right : bottom;

  // If the original point isn't actually in the bottom right quadrant, flip the sign
  if (pAABB.x != p.x) q.x *= -1;
  if (pAABB.y != p.y) q.y *= -1;

  return Vec.add(q, aabb.center);
};

Vec.intersectLineLine = (A, B, C, D) => {
  // Caution — I *suspect* this function assumes the lines are infinitely long.
  let AB = Vec.sub(B, A);
  let CA = Vec.sub(A, C);
  let CD = Vec.sub(D, C);
  let den = CD.y * AB.x - CD.x * AB.y;
  if (isZero(den)) return null;
  var s = (CD.x * CA.y - CD.y * CA.x) / den;
  return Vec.add(A, Vec.Smul(s, AB));
};

Vec.intersectRayLine = (rayP, rayD, a, b) => {
  // rayP is the start point of a ray
  // rayD is the direction of the ray (eg: {x:1,y:0} to point straight to the right);
  // a and b are the endpoints of a line segment

  let AB = Vec.sub(b, a);
  let AP = Vec.sub(rayP, a);

  // If the ray is parallel to the line, there'll be no intersection.
  if (rayD.y / rayD.x == AB.y / AB.x) return;

  let den = rayD.x * AB.y - rayD.y * AB.x;

  // If this denominator is zero, there'll be no intersection either.
  if (den == 0) return;

  // TBH, I don't quite grock how this works geometrically yet, but it comes up all the time in intersection math.
  let r = (AP.y * AB.x - AP.x * AB.y) / den;
  let s = (AP.y * rayD.x - AP.x * rayD.y) / den;

  // If the intersection would be outside the line segment, no intersection.
  if (r <= 0 || s <= 0 || s >= 1) return;

  // Scale rayD so it's as long as the distance rayP is from the intersection point.
  let scaledD = Vec.mulS(rayD, r);

  // Add rayP to rayD, and you have the intersection! Yay.
  return Vec.add(rayP, scaledD);
};

Vec.isInside = (p, min, max) => {
  return min.x <= p.x && p.x <= max.x && min.y <= p.y && p.y <= max.y;
};

Vec.isFinite = (p) => {
  return isFinite(p.x) && isFinite(p.y);
};
