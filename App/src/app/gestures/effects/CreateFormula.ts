import Vec from "../../../lib/vec"
import { EventContext } from "../../Gesture"
import Formula from "../../meta/Formula"
import Token from "../../meta/Token"

export function createFormula(ctx: EventContext, token?: Token): Formula {
  const formula = new Formula()
  ctx.page.adopt(formula)

  if (token) {
    formula.adopt(token)
    formula.position = Vec.sub(token.position, Vec(-3, -3))
  } else {
    formula.position = ctx.event.position
  }

  formula.edit()
  return formula
}
