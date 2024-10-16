import { EventContext } from "../../Gesture"
import Lead from "../../ink/Lead"

export function createLead(ctx: EventContext): Lead {
  const lead = Lead.create(ctx.event.position)
  ctx.root.adopt(lead)
  return lead
}
