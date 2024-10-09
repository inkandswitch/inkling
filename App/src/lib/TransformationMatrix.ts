// Marcel's carefully written Transformation Matrix Library
// There are three types of method:
// Statefull transforms: that change the matrix
// Getters: that return a value
// Transform other things: For transforming points etc.

import Line from "./line"
import { Position } from "./types"
import Vec from "./vec"

const DEGREES_TO_RADIANS = Math.PI / 180
const RADIANS_TO_DEGREES = 180 / Math.PI

export default class TransformationMatrix {
  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0

  private constructor() {}

  reset() {
    this.a = 1
    this.b = 0
    this.c = 0
    this.d = 1
    this.e = 0
    this.f = 0
  }

  // STATEFULL TRANSFORMS

  transform(a2: number, b2: number, c2: number, d2: number, e2: number, f2: number) {
    const { a: a1, b: b1, c: c1, d: d1, e: e1, f: f1 } = this

    this.a = a1 * a2 + c1 * b2
    this.b = b1 * a2 + d1 * b2
    this.c = a1 * c2 + c1 * d2
    this.d = b1 * c2 + d1 * d2
    this.e = a1 * e2 + c1 * f2 + e1
    this.f = b1 * e2 + d1 * f2 + f1

    return this
  }

  rotate(angle: number) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    this.transform(cos, sin, -sin, cos, 0, 0)
    return this
  }

  rotateDegrees(angle: number) {
    this.rotate(angle * DEGREES_TO_RADIANS)
    return this
  }

  scale(sx: number, sy: number) {
    this.transform(sx, 0, 0, sy, 0, 0)
    return this
  }

  skew(sx: number, sy: number) {
    this.transform(1, sy, sx, 1, 0, 0)
    return this
  }

  translate(tx: number, ty: number) {
    this.transform(1, 0, 0, 1, tx, ty)
    return this
  }

  flipX() {
    this.transform(-1, 0, 0, 1, 0, 0)
    return this
  }

  flipY() {
    this.transform(1, 0, 0, -1, 0, 0)
    return this
  }

  inverse() {
    const { a, b, c, d, e, f } = this

    const dt = a * d - b * c

    this.a = d / dt
    this.b = -b / dt
    this.c = -c / dt
    this.d = a / dt
    this.e = (c * f - d * e) / dt
    this.f = -(a * f - b * e) / dt

    return this
  }

  // GETTERS

  getInverse() {
    const { a, b, c, d, e, f } = this

    const m = new TransformationMatrix()
    const dt = a * d - b * c

    m.a = d / dt
    m.b = -b / dt
    m.c = -c / dt
    m.d = a / dt
    m.e = (c * f - d * e) / dt
    m.f = -(a * f - b * e) / dt

    return m
  }

  getPosition() {
    return { x: this.e, y: this.f }
  }

  getRotation() {
    const E = (this.a + this.d) / 2
    const F = (this.a - this.d) / 2
    const G = (this.c + this.b) / 2
    const H = (this.c - this.b) / 2

    const a1 = Math.atan2(G, F)
    const a2 = Math.atan2(H, E)

    const phi = (a2 + a1) / 2
    return -phi * RADIANS_TO_DEGREES
  }

  getScale() {
    const E = (this.a + this.d) / 2
    const F = (this.a - this.d) / 2
    const G = (this.c + this.b) / 2
    const H = (this.c - this.b) / 2

    const Q = Math.sqrt(E * E + H * H)
    const R = Math.sqrt(F * F + G * G)

    return {
      scaleX: Q + R,
      scaleY: Q - R
    }
  }

  // TRANSFORM OTHER THINGS

  transformMatrix(m2: TransformationMatrix) {
    const { a: a1, b: b1, c: c1, d: d1, e: e1, f: f1 } = this

    const a2 = m2.a
    const b2 = m2.b
    const c2 = m2.c
    const d2 = m2.d
    const e2 = m2.e
    const f2 = m2.f

    const m = new TransformationMatrix()
    m.a = a1 * a2 + c1 * b2
    m.b = b1 * a2 + d1 * b2
    m.c = a1 * c2 + c1 * d2
    m.d = b1 * c2 + d1 * d2
    m.e = a1 * e2 + c1 * f2 + e1
    m.f = b1 * e2 + d1 * f2 + f1

    return m
  }

  transformPoint<P extends Position>(p: P): P {
    const { x, y } = p
    const { a, b, c, d, e, f } = this

    return {
      ...p, // to get the other properties
      x: x * a + y * c + e,
      y: x * b + y * d + f
    }
  }

  transformLine(l2: Line): Line {
    return {
      a: this.transformPoint(l2.a),
      b: this.transformPoint(l2.b)
    }
  }

  // factory methods

  static identity(): TransformationMatrix {
    return new TransformationMatrix()
  }

  static fromLineTranslateRotate(a: Position, b: Position) {
    const line = Vec.sub(b, a)

    const m = new TransformationMatrix()
    m.translate(a.x, a.y)
    m.rotate(Vec.angle(line))
    return m
  }

  static fromLine(a: Position, b: Position) {
    const line = Vec.sub(b, a)
    const length = Vec.len(line)

    const m = new TransformationMatrix()
    m.translate(a.x, a.y)
    m.rotate(Vec.angle(line))
    m.scale(length, length)

    return m
  }
}
