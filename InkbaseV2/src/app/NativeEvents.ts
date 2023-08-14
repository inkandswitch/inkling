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

export default class Events {
  events: Event[] = []

  // These are unused, so Ivan commented them out as a precursor to deleting them.
  // activePencil?: Position
  // activeFingers: { [key: TouchId]: Position } = {}

  constructor() {
    this.setupNativeEventHandler()
  }

  clear() {
    this.events = []
  }

  add(event: Event) {
    this.events.push(event)
  }

  did(type: EventType, state: EventState, id?: TouchId) {
    return this.events.find(
      (e) => e.type === type && e.state === state && (id == null || e.id === id)
    )
  }

  didAll(type: EventType, state: EventState, id?: TouchId) {
    return this.events.filter(
      (e) => e.type === type && e.state === state && (id == null || e.id === id)
    )
  }

  didLast(type: EventType, state: EventState, id?: TouchId) {
    return this.events.findLast(
      (e) => e.type === type && e.state === state && (id == null || e.id === id)
    )
  }

  private setupNativeEventHandler() {
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

          this.add(event)

          // This code is unused, so Ivan commented it out as a precursor to deleting it.
          // if (event.type === "pencil") {
          //   this.activePencil = state !== "ended" ? event.position : undefined
          // } else {
          //   if (state !== "ended") {
          //     this.activeFingers[event.id] = event.position
          //   } else {
          //     delete this.activeFingers[event.id]
          //   }
          // }
        }
      }
    }
  }
}
