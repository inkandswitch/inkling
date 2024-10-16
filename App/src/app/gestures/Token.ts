import { EventContext, Gesture } from "../Gesture"
import { aToken } from "../meta/Token"
import Vec from "../../lib/vec"
import { aNumberToken } from "../meta/NumberToken"
import { aTokenWithVariable, createWire } from "./effects/CreateWire"

export function tokenCreateWire(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const token = ctx.root.find({
      what: aTokenWithVariable,
      near: ctx.event.position
    })
    if (token) {
      return new Gesture("Create Wire", {
        dragged(ctx) {
          return createWire(token.wirePort, ctx)
        }
      })
    }
  }
}

export function tokenMoveOrToggleConstraint(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const token = ctx.root.find({
      what: aToken,
      near: ctx.event.position
    })

    if (token) {
      const offset = Vec.sub(token.position, ctx.event.position)

      return new Gesture("Touch Token", {
        dragged(ctx) {
          token.position = Vec.add(ctx.event.position, offset)
        },
        endedTap(ctx) {
          token.onTap()
        }
      })
    }
  }
}

export function numberTokenScrub(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active && ctx.pseudo) {
    const token = ctx.root.find({
      what: aNumberToken,
      near: ctx.event.position
    })

    if (token) {
      const v = token.getVariable()
      const wasLocked = v.isLocked
      let initialY = ctx.event.position.y
      let initialValue = v.value
      let fingers = 0

      return new Gesture("Scrub Number Token", {
        moved(ctx) {
          if (fingers !== ctx.pseudoCount) {
            fingers = ctx.pseudoCount
            initialValue = v.value
            initialY = ctx.event.position.y
          }
          const delta = initialY - ctx.event.position.y
          const m = 1 / Math.pow(10, fingers - 1)
          const value = Math.round((initialValue + delta * m) / m) * m
          token.getVariable().lock(value, true)
        },
        ended(ctx) {
          if (!wasLocked) {
            token.getVariable().unlock()
          }
        }
      })
    }
  }
}
