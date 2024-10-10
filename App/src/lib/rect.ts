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
