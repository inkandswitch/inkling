import { Position } from "../../lib/types"
import { Variable } from "../Constraints"
import Gizmo from "./Gizmo"
import NumberToken from "./NumberToken"
import PropertyPicker from "./PropertyPicker"

export interface Pluggable {
  readonly id: number
  readonly plugVars: { value: Variable } | { distance: Variable; angleInDegrees: Variable }
  getPlugPosition(id: PlugId): Position
}

export type PlugId = "center" | "input" | "output"
export type VariableId = "value" | "distance" | "angleInDegrees"

export type Connection =
  | {
      obj: NumberToken
      plugId: "center"
      variableId: "value"
    }
  | {
      obj: PropertyPicker
      plugId: "input" | "output"
      variableId: "value"
    }
  | {
      obj: Gizmo
      plugId: "center"
      variableId: "distance" | "angleInDegrees"
    }
