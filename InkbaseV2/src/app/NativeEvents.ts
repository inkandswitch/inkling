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
}

export interface PencilEvent extends AEvent {
  type: "pencil"
  pressure: number
}

export interface FingerEvent extends AEvent {
  type: "finger"
}

export default class Events {
  static events: Event[] = []
  static activePencil?: Position
  static activeFingers: { [key: TouchId]: Position } = {}

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

// Attach event listeners
;(window as any).nativeEvent = (state: EventState, touches: { [key: TouchId]: any[] }) => {
  Object.entries(touches).forEach(([id, points]) => {
    points.forEach((point) => {
      const sharedProperties = {
        state,
        id,
        position: { x: point.x as number, y: point.y as number },
        timestamp: point.timestamp as number,
      }
      const event: Event =
        point.type === "pencil"
          ? {
              ...sharedProperties,
              type: "pencil",
              pressure: point.force as number,
            }
          : {
              ...sharedProperties,
              type: "finger",
            }

      Events.add(event)

      if (event.type === "pencil") {
        Events.activePencil = state === "ended" ? event.position : undefined
      } else {
        if (state !== "ended") {
          Events.activeFingers[event.id] = event.position
        } else {
          delete Events.activeFingers[event.id]
        }
      }
    })
  })
}
