// Vec
// This is a port of (part of) Ivan's homemade CoffeeScript vector library.

import { isZero, roundTo } from "./math"
import { Position } from "./types"

export interface Vector {
  x: number
  y: number
}

// Constructors ///////////////////////////////////////////////////////////////

const Vec = (x = 0, y = 0): Vector => ({ x, y })
export default Vec

Vec.clone = (v: Vector) => Vec(v.x, v.y)

Vec.of = (s: number) => Vec(s, s)

Vec.random = (scale = 1) => Vec.Smul(scale, Vec.complement(Vec.Smul(2, Vec(Math.random(), Math.random()))))

Vec.toA = (v: Vector) => [v.x, v.y]

Vec.polar = (angle: number, length: number) => Vec(length * Math.cos(angle), length * Math.sin(angle))

// Static Vectors /////////////////////////////////////////////////////////////

Vec.x = Object.freeze(Vec(1))
Vec.y = Object.freeze(Vec(0, 1))
Vec.zero = Object.freeze(Vec())

// FP /////////////////////////////////////////////////////////////////////////

Vec.map = (f: (x: number) => number, v: Vector) => Vec(f(v.x), f(v.y))

Vec.map2 = (f: (x: number, y: number) => number, a: Vector, b: Vector) => Vec(f(a.x, b.x), f(a.y, b.y))

Vec.reduce = (f: (x: number, y: number) => number, v: Vector) => f(v.x, v.y)

// Vector Algebra /////////////////////////////////////////////////////////////

// Not really cross product, but close enough
Vec.cross = (a: Vector, b: Vector) => a.x * b.y - a.y * b.x

Vec.project = (a: Vector, b: Vector) => Vec.mulS(b, Vec.dot(a, b) / Vec.len2(b))

Vec.reject = (a: Vector, b: Vector) => Vec.sub(a, Vec.project(a, b))

Vec.scalarProjection = (p: Position, a: Vector, b: Vector): Position => {
  const ap = Vec.sub(p, a)
  const ab = Vec.normalize(Vec.sub(b, a))
  const f = Vec.mulS(ab, Vec.dot(ap, ab))
  return Vec.add(a, f)
}

// Piecewise Vector Arithmetic ////////////////////////////////////////////////

Vec.add = (a: Vector, b: Vector) => Vec(a.x + b.x, a.y + b.y)
Vec.div = (a: Vector, b: Vector) => Vec(a.x / b.x, a.y / b.y)
Vec.mul = (a: Vector, b: Vector) => Vec(a.x * b.x, a.y * b.y)
Vec.sub = (a: Vector, b: Vector) => Vec(a.x - b.x, a.y - b.y)

// Vector-Scalar Arithmetic ///////////////////////////////////////////////////

Vec.addS = (v: Vector, s: number) => Vec.add(v, Vec.of(s))
Vec.divS = (v: Vector, s: number) => Vec.div(v, Vec.of(s))
Vec.mulS = (v: Vector, s: number) => Vec.mul(v, Vec.of(s))
Vec.subS = (v: Vector, s: number) => Vec.sub(v, Vec.of(s))

// Scalar-Vector Arithmetic ///////////////////////////////////////////////////

Vec.Sadd = (s: number, v: Vector) => Vec.add(Vec.of(s), v)
Vec.Sdiv = (s: number, v: Vector) => Vec.div(Vec.of(s), v)
Vec.Smul = (s: number, v: Vector) => Vec.mul(Vec.of(s), v)
Vec.Ssub = (s: number, v: Vector) => Vec.sub(Vec.of(s), v)

// Measurement ////////////////////////////////////////////////////////////////

Vec.dist = (a: Vector, b: Vector) => Vec.len(Vec.sub(a, b))

// Strongly recommend using Vec.dist instead of Vec.dist2 (distance-squared)
Vec.dist2 = (a: Vector, b: Vector) => Vec.len2(Vec.sub(a, b))

Vec.dot = (a: Vector, b: Vector) => a.x * b.x + a.y * b.y

Vec.equal = (a: Vector, b: Vector) => isZero(Vec.dist2(a, b))

// Strongly recommend using Vec.len instead of Vec.len2 (length-squared)
Vec.len2 = (v: Vector) => Vec.dot(v, v)

Vec.len = (v: Vector) => Math.sqrt(Vec.dot(v, v))

// Rounding ///////////////////////////////////////////////////////////////////

Vec.ceil = (v: Vector) => Vec.map(Math.ceil, v)
Vec.floor = (v: Vector) => Vec.map(Math.floor, v)
Vec.round = (v: Vector) => Vec.map(Math.round, v)
Vec.roundTo = (v: Vector, s: number) => Vec.map2(roundTo, v, Vec.of(s))

// Variations ///////////////////////////////////////////////////////////////////

Vec.complement = (v: Vector) => Vec.Ssub(1, v)
Vec.half = (v: Vector) => Vec.divS(v, 2)
Vec.normalize = (v: Vector) => Vec.divS(v, Vec.len(v))
Vec.recip = (v: Vector) => Vec.Sdiv(1, v)
Vec.renormalize = (v: Vector, length: number) => Vec.Smul(length, Vec.normalize(v))

// Combinations ///////////////////////////////////////////////////////////////////

Vec.avg = (a: Vector, b: Vector) => Vec.half(Vec.add(a, b))
Vec.lerp = (a: Vector, b: Vector, t: number) => Vec.add(a, Vec.Smul(t, Vec.sub(b, a)))
Vec.max = (a: Vector, b: Vector) => Vec.map2(Math.max, a, b)
Vec.min = (a: Vector, b: Vector) => Vec.map2(Math.min, a, b)

// Reflections ///////////////////////////////////////////////////////////////////

Vec.abs = (v: Vector) => Vec.map(Math.abs, v)
Vec.invert = (v: Vector) => Vec(-v.x, -v.y)
Vec.invertX = (v: Vector) => Vec(-v.x, v.y)
Vec.invertY = (v: Vector) => Vec(v.x, -v.y)

// Rotation & angles ///////////////////////////////////////////////////////////

// 90 degrees clockwise
Vec.rotate90CW = (v: Vector) => Vec(v.y, -v.x)

// 90 degrees counter clockwise
Vec.rotate90CCW = (v: Vector) => Vec(-v.y, v.x)

// TODO(marcel): right now this module is inconsistent in the way it expects angles to work.
// e.g., this function takes an angle in radians, whereas angleBetween uses degrees.
// (this will help avoid confusion...)
Vec.rotate = (v: Vector, angle: number) =>
  Vec(v.x * Math.cos(angle) - v.y * Math.sin(angle), v.x * Math.sin(angle) + v.y * Math.cos(angle))

// Rotate around
Vec.rotateAround = (vector: Vector, point: Position, angle: number): Position => {
  // Translate vector to the origin
  const translatedVector = Vec.sub(vector, point)

  const rotatedVector = Vec.rotate(translatedVector, angle)

  // Translate vector back to its original position
  return Vec.add(rotatedVector, point)
}

Vec.angle = (v: Vector) => Math.atan2(v.y, v.x)

Vec.angleBetween = (a: Vector, b: Vector) => {
  // Calculate the dot product of the two vectors
  const dotProduct = Vec.dot(a, b)

  // Calculate the magnitudes of the two vectors
  const magnitudeA = Vec.len(a)
  const magnitudeB = Vec.len(b)

  // Calculate the angle between the vectors using the dot product and magnitudes
  const angleInRadians = Math.acos(dotProduct / (magnitudeA * magnitudeB))

  return angleInRadians
}

Vec.angleBetweenClockwise = (a: Vector, b: Vector) => {
  const dP = Vec.dot(a, b)
  const cP = Vec.cross(a, b)

  const angleInRadians = Math.atan2(cP, dP)

  return angleInRadians
}

Vec.update = (dest: Vector, src: Vector) => {
  dest.x = src.x
  dest.y = src.y
}
