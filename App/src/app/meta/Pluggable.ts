import { Position } from "../../lib/types"
import { Variable } from "../Constraints"

export interface Pluggable {
  readonly id: number
  readonly plugs: Record<string, Variable | { distance: Variable; angleInDegrees: Variable }>
  getPlugPosition(id: string): Position
}

type Connection = {
  obj: Pluggable
  plugId: string
}
