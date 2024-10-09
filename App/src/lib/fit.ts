import Arc from "./arc"
import Line from "./line"
import { Position } from "./types"
import Vec from "./vec"

export interface LineFit {
  type: "line"
  line: Line
  fitness: number
  length: number
}

function line(stroke: Position[]): LineFit | null {
  if (stroke.length === 0) {
    return null
  }

  const line = Line(Vec.clone(stroke[0]), Vec.clone(stroke[stroke.length - 1]))

  let totalDist = 0
  for (let i = 1; i < stroke.length - 1; i++) {
    totalDist += Line.distToPoint(line, stroke[i])
  }

  const length = Line.len(line)

  return {
    type: "line",
    line,
    length,
    fitness: length === 0 ? 1 : totalDist / length
  }
}

export interface ArcFit {
  type: "arc"
  arc: Arc
  fitness: number
  length: number
}

function arc(points: Position[]): ArcFit | null {
  if (points.length < 3) {
    return null
  }

  const simplified = innerTriangle(points)
  const [a, b, c] = simplified

  if (!b) {
    return null
  }

  const { x: x1, y: y1 } = a
  const { x: x2, y: y2 } = b
  const { x: x3, y: y3 } = c

  const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
  const centerX =
    ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / D
  const centerY =
    ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / D
  const radius = Math.sqrt((x1 - centerX) * (x1 - centerX) + (y1 - centerY) * (y1 - centerY))

  const startAngle = Math.atan2(y1 - centerY, x1 - centerX)
  const endAngle = Math.atan2(y3 - centerY, x3 - centerX)

  // Compute winding order
  const ab = Vec.sub(a, b)
  const bc = Vec.sub(b, c)
  const clockwise = Vec.cross(ab, bc) > 0

  const arc = Arc(Vec(centerX, centerY), radius, startAngle, endAngle, clockwise)

  // Compute fitness
  const arcDist = Arc.len(arc)

  let totalDist = 0
  for (const p of points) {
    totalDist += Arc.distToPointCircle(arc, p)
  }

  return {
    type: "arc",
    arc,
    fitness: totalDist / arcDist,
    length: arcDist
  }
}

function innerTriangle(points: Position[]): [Position, Position, Position] {
  const start = points[0]
  const end = points[points.length - 1]

  let largestDistance = -1
  let farthestIndex = -1

  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const dist = Line.distToPoint(Line(start, end), point)
    if (dist > largestDistance) {
      largestDistance = dist
      farthestIndex = i
    }
  }

  return [start, points[farthestIndex], end]
}

interface Circle {
  center: Position
  radius: number
  startAngle: number
  endAngle: number
  clockwise: boolean
}

export interface CircleFit {
  type: "circle"
  circle: Circle
  fitness: number
}

function circle(points: Position[]): CircleFit | null {
  if (points.length < 3) {
    return null
  }

  // Do a basic circular regression
  const n = points.length
  let sumX = 0
  let sumY = 0
  let sumX2 = 0
  let sumY2 = 0
  let sumXY = 0
  let sumX3 = 0
  let sumY3 = 0
  let sumXY2 = 0
  let sumX2Y = 0

  for (const point of points) {
    const { x, y } = point
    sumX += x
    sumY += y
    sumX2 += x * x
    sumY2 += y * y
    sumXY += x * y
    sumX3 += x * x * x
    sumY3 += y * y * y
    sumXY2 += x * y * y
    sumX2Y += x * x * y
  }

  const C = n * sumX2 - sumX * sumX
  const D = n * sumXY - sumX * sumY
  const E = n * sumX3 + n * sumXY2 - (sumX2 + sumY2) * sumX
  const G = n * sumY2 - sumY * sumY
  const H = n * sumX2Y + n * sumY3 - (sumX2 + sumY2) * sumY

  const a = (H * D - E * G) / (C * G - D * D)
  const b = (H * C - E * D) / (D * D - G * C)
  const c = -(a * sumX + b * sumY + sumX2 + sumY2) / n

  // Construct circle
  const center = Vec(-a / 2, -b / 2)
  const radius = Math.sqrt(center.x * center.x + center.y * center.y - c)

  // Compute angles
  const startAngle = Math.atan2(points[0].y - center.y, points[0].x - center.x)
  const endAngle = Math.atan2(points[points.length - 1].y - center.y, points[points.length - 1].x - center.x)

  // Determine winding order
  // Compute winding order
  const ab = Vec.sub(points[0], points[1])
  const bc = Vec.sub(points[1], points[2])
  const clockwise = Vec.cross(ab, bc) > 0

  const circle = { center, radius, startAngle, endAngle, clockwise }

  // check fitness
  let totalDist = 0
  for (const p of points) {
    totalDist += Arc.distToPointCircle(circle, p)
  }
  const circumference = 2 * Math.PI * radius
  const fitness = totalDist / circumference

  return { type: "circle", circle, fitness }
}

export default {
  line,
  arc,
  circle
}
