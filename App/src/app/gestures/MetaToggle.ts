import { EventContext, Gesture } from "../Gesture"
import MetaToggle, { aMetaToggle } from "../gui/MetaToggle"

declare global {
  function cycleTheme(): void
}

export function metaToggleFingerActions(ctx: EventContext): Gesture | void {
  const metaToggle = ctx.root.find({
    what: aMetaToggle,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50
  })

  const dragThreshold = 100

  if (metaToggle) {
    return new Gesture("Meta Toggle Finger Actions", {
      moved(ctx) {
        if (ctx.state.dragDist > dragThreshold) {
          metaToggle.dragTo(ctx.event.position)
        }
      },
      ended(ctx) {
        if (ctx.state.dragDist <= dragThreshold) {
          if (ctx.pseudo) {
            cycleTheme()
          } else {
            MetaToggle.toggle()
          }
        } else {
          metaToggle.snapToCorner()
        }
      }
    })
  }
}

export function metaToggleIgnorePencil(ctx: EventContext): Gesture | void {
  if (
    ctx.root.find({
      what: aMetaToggle,
      near: ctx.event.position,
      recursive: false,
      tooFar: 35
    })
  ) {
    // This gesture exists just to block other gestures from running when a pencil touch begins on the Meta Toggle
    return new Gesture("Ignore Pencil", {})
  }
}
