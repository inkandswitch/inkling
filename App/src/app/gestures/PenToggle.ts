import { EventContext, Gesture } from "../Gesture"
import PenToggle, { aPenToggle } from "../gui/PenToggle"
import { Root } from "../Root"

export function penToggleFingerActions(ctx: EventContext): Gesture | void {
  const penToggle = ctx.root.find({
    what: aPenToggle,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50
  })

  if (penToggle) {
    return new Gesture("Pen Toggle Finger Actions", {
      endedTap(ctx) {
        PenToggle.toggle()
      }
    })
  }
}
