import { EventContext } from "../../Gesture"
import Linear from "../../meta/Linear"

export function createLinear(ctx: EventContext): Linear {
  const linear = new Linear()
  ctx.page.adopt(linear)
  linear.position = ctx.event.position
  return linear
}
