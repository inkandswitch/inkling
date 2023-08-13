export type Event = PencilEvent | FingerEvent
export type EventType = Event["type"]
export type EventState = "began" | "moved" | "cancelled" | "ended"
export type TouchId = string

interface Position {
  x: number
  y: number
}

interface AEvent {
  state: EventState
  id: TouchId
  position: Position
  timestamp: number
  radius: number
}

export interface PencilEvent extends AEvent {
  type: "pencil"
  pressure: number
  altitude: number
  azimuth: number
}

export interface FingerEvent extends AEvent {
  type: "finger"
}

export default class Events {
  static events: Event[] = []

  // These are unused, so Ivan commented them out as a precursor to deleting them.
  // static activePencil?: Position
  // static activeFingers: { [key: TouchId]: Position } = {}

  static clear() {
    this.events = []
  }

  static add(event: Event) {
    this.events.push(event)
  }

  static did(type: EventType, state: EventState, id?: TouchId) {
    return this.events.find(
      (e) => e.type === type && e.state === state && (id == null || e.id === id)
    )
  }

  static didAll(type: EventType, state: EventState, id?: TouchId) {
    return this.events.filter(
      (e) => e.type === type && e.state === state && (id == null || e.id === id)
    )
  }

  static didLast(type: EventType, state: EventState, id?: TouchId) {
    return this.events.findLast(
      (e) => e.type === type && e.state === state && (id == null || e.id === id)
    )
  }
}

// If we fixed the following inconsistencies, we could delete most of nativeEvent:
// • .type: "touch" -> .type: "finger"
// • .type: "stylus" is deprecated in favor of .type: "pencil"
// • .x and .y -> position: { x, y }
// • .force -> .pressure

type TouchPoint = {
  type: "pencil" | "touch" | "stylus"
  altitude: number
  azimuth: number
  force: number
  radius: number
  timestamp: number
  x: number
  y: number
}
;(window as any).nativeEvent = (state: EventState, touches: Record<TouchId, TouchPoint[]>) => {
  for (let id in touches) {
    for (let point of touches[id]) {
      let { type, timestamp, radius, force, altitude, azimuth, x, y } = point

      const sharedProperties = {
        state,
        id,
        position: { x, y },
        timestamp,
        radius,
      }

      const event: Event =
        type == "touch"
          ? {
              type: "finger",
              ...sharedProperties,
            }
          : {
              type: "pencil",
              pressure: force,
              altitude,
              azimuth,
              ...sharedProperties,
            }

      Events.add(event)

      // This code is unused, so Ivan commented it out as a precursor to deleting it.
      // if (event.type === "pencil") {
      //   Events.activePencil = state !== "ended" ? event.position : undefined
      // } else {
      //   if (state !== "ended") {
      //     Events.activeFingers[event.id] = event.position
      //   } else {
      //     delete Events.activeFingers[event.id]
      //   }
      // }
    }
  }
}
