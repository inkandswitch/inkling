import { EventContext } from "../../Gesture"
import LinearToken from "../../meta/LinearToken"

export function createLinear(ctx: EventContext): LinearToken {
  const linear = LinearToken.create()
  ctx.root.adopt(linear)
  linear.position = ctx.event.position
  return linear
}
