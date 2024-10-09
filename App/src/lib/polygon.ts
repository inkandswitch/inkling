import Line from "./line"
import { Position } from "./types"
import Vec from "./vec"

export function closestPointOnPolygon(polygon: Array<Position>, pos: Position) {
  let closestPoint = polygon[0]
  let closestDistance = Infinity

  for (let idx = 0; idx < polygon.length - 1; idx++) {
    const p1 = polygon[idx]
    const p2 = polygon[idx + 1]
    const pt = Line.closestPoint(Line(p1, p2), pos)
    const distance = Vec.dist(pt, pos)
    if (distance < closestDistance) {
      closestPoint = pt
      closestDistance = distance
    }
  }

  return closestPoint
}
