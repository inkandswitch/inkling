import { EventContext, Gesture } from "../Gesture"
import Handle, { aCanonicalHandle } from "../ink/Handle"
import * as constraints from "../Constraints"
import StrokeGroup from "../ink/StrokeGroup"
import Vec from "../../lib/vec"
import SVG from "../Svg"
import { Position } from "../../lib/types"
import { createGizmo } from "./effects/CreateGizmo"
import MetaToggle from "../gui/MetaToggle"

const handleTouchDist = 40

export function handleCreateGizmo(ctx: EventContext): Gesture | void {
  if (MetaToggle.active && ctx.root.find({ what: aCanonicalHandle, near: ctx.event.position })) {
    return createGizmo(ctx)
  }
}

export function handleGoAnywhere(ctx: EventContext): Gesture | void {
  const handle = ctx.root.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: handleTouchDist
  })

  if (handle && ctx.pseudoCount >= 4) {
    return new Gesture("Go Anywhere", {
      began() {
        handle.canonicalInstance.toggleGoesAnywhere()
      }
    })
  }
}

export function handleBreakOff(ctx: EventContext): Gesture | void {
  const handle = ctx.root.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: handleTouchDist
  })

  if (handle && ctx.pseudoCount >= 3 && handle.canonicalInstance.absorbedHandles.size > 0) {
    const handles = [...handle.canonicalInstance.absorbedHandles]
    touchHandleHelper(handle.breakOff(handles[handles.length - 1]))
  }
}

export function handleMoveOrTogglePin(ctx: EventContext): Gesture | void {
  let handle = ctx.root.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: handleTouchDist
  })

  if (handle) {
    return touchHandleHelper(handle)
  }
}

export function touchHandleHelper(handle: Handle): Gesture {
  let lastPos = Vec.clone(handle)
  let offset: Position

  return new Gesture("Handle Move or Toggle Constraints", {
    moved(ctx) {
      // touchHandleHelper is sometimes called from another gesture, after began,
      // so we need to do our initialization lazily.
      offset ??= Vec.sub(handle.position, ctx.event.position)

      handle.position = Vec.add(ctx.event.position, offset)
      lastPos = Vec.clone(handle)

      constraints.finger(handle)

      if (
        ctx.pseudoCount === 2 &&
        handle.parent instanceof StrokeGroup &&
        handle.canonicalInstance.absorbedHandles.size === 0
      ) {
        handle.parent.generatePointData()
      }
    },
    ended(ctx) {
      handle.getAbsorbedByNearestHandle()
      constraints.finger(handle).remove()

      // Tune: you must tap a little more precisely to toggle a pin than drag a handle
      // TODO: This creates a small tap deadzone between the stroke (to toggle handles) and the handle (to toggle pin), because the handle claims the gesture but doesn't do anything with it
      const tappedPrecisely = Vec.dist(handle, ctx.event.position) < 20
      if (!ctx.state.drag && MetaToggle.active && tappedPrecisely) {
        handle.togglePin()
      }
    },
    render() {
      const count = Math.pow(Vec.dist(handle.position, lastPos), 1 / 3)
      let c = count
      while (--c > 0) {
        let v = Vec.sub(handle.position, lastPos)
        v = Vec.add(lastPos, Vec.mulS(v, c / count))
        SVG.now("circle", {
          cx: v.x,
          cy: v.y,
          r: 4,
          class: "desire"
        })
      }
    }
  })
}
