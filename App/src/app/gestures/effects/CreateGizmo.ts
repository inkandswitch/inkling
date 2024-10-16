import { EventContext, Gesture } from "../../Gesture"
import Handle from "../../ink/Handle"
import Gizmo from "../../meta/Gizmo"
import { touchHandleHelper } from "../Handle"

export function createGizmo(ctx: EventContext): Gesture {
  const a = ctx.root.adopt(Handle.create({ ...ctx.event.position }, false))
  a.getAbsorbedByNearestHandle()
  const b = ctx.root.adopt(Handle.create({ ...ctx.event.position }, false))
  ctx.root.adopt(Gizmo.create(a, b))
  return touchHandleHelper(b)
}
