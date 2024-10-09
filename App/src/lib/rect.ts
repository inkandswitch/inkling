import { Position } from "./types"

interface Rect {
  position: Position
  width: number
  height: number
}

function Rect(position: Position, width: number, height: number) {
  return { position, width, height }
}

export default Rect

Rect.isPointInside = (rect: Rect, point: Position) => {
  return (
    point.x > rect.position.x &&
    point.y > rect.position.y &&
    point.x < rect.position.x + rect.width &&
    point.y < rect.position.y + rect.height
  )
}

Rect.closestPointOnPerimeter = (rect: Rect, point: Position): Position => {
  const { position, width, height } = rect
  const { x, y } = position
  const { x: px, y: py } = point

  const leftDist = Math.abs(px - x)
  const rightDist = Math.abs(px - (x + width))
  const topDist = Math.abs(py - y)
  const bottomDist = Math.abs(py - (y + height))

  const minDist = Math.min(leftDist, rightDist, topDist, bottomDist)

  if (minDist === leftDist) {
    return { x, y: py }
  } else if (minDist === rightDist) {
    return { x: x + width, y: py }
  } else if (minDist === topDist) {
    return { x: px, y }
  } else {
    return { x: px, y: y + height }
  }
}
