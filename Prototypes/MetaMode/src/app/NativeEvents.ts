import { Position } from '../lib/types';
import Vec from '../lib/vec';

// TODO: Do we want to add some way to fake pencil input with a finger?
// That might be a useful thing to add HERE, so that other parts of the system
// will be forced to assume multi-pencil support exists, which might drive novel ideas.

// TODO: Check if we have stale events lingering for a long time, which could be caused by
// the Swift wrapper not sending us (say) finger ended events. If so, we might need to
// cull fingers (or pencils?) if we go for a certain amount of time without receiving a new
// event with a corresponding TouchId.

// How far does the input need to move before we count it as a drag?
const fingerMinDragDist = 10;
const pencilMinDragDist = 10;

export type Event = PencilEvent | FingerEvent;
export type InputState = PencilState | FingerState;

export type EventType = Event['type'];
export type EventState = 'began' | 'moved' | 'cancelled' | 'ended';
export type TouchId = string;

interface AEvent {
  state: EventState;
  id: TouchId;
  position: Position;
  timestamp: number;
  radius: number;
}

export interface PencilEvent extends AEvent {
  type: 'pencil';
  pressure: number;
  altitude: number;
  azimuth: number;
}

export interface FingerEvent extends AEvent {
  type: 'finger';
}

interface AState {
  down: boolean; // Is the pencil/finger currently down?
  drag: boolean; // Has the pencil/finger moved at least a tiny bit since being put down?
  // TODO — do we want to store the original & current *event* instead of cherry-picking their properties?
  position: Position | null; // Where is the pencil/finger now?
  originalPosition: Position | null; // Where was the pencil/finger initially put down?
  dragDelta: Position | null; // What's the delta from where the pencil/finger was initiall put down.
}

export interface PencilState extends AState {
  event: PencilEvent; // What's the current (or most recent) event that has contributed to the state?
}
export interface FingerState extends AState {
  id: TouchId; // What's the ID of this finger?
  event: FingerEvent; // What's the current (or most recent) event that has contributed to the state?
}

type TouchPoint = {
  type: EventType;
  altitude: number;
  azimuth: number;
  pressure: number;
  radius: number;
  timestamp: number;
  position: Position;
};

type ApplyEvent = (event: Event, state: InputState) => void;

export default class Events {
  events: Event[] = [];
  pencilState: PencilState | null = null;
  fingerStates: FingerState[] = [];
  fingerStatesById: Record<TouchId, FingerState> = {};

  constructor(private applyEvent: ApplyEvent) {
    this.setupNativeEventHandler();
  }

  // prettier-ignore
  update() {
    for (let event of this.events) {
      let state: InputState;

      // Tempted to make this a dynamic dispatch
      if (event.type === 'finger') {
        switch(event.state) {
          case 'began':     state = this.fingerBegan(event); break;
          case 'moved':     state = this.fingerMoved(event); break;
          case 'cancelled': state = this.fingerEnded(event); break;
          case 'ended':     state = this.fingerEnded(event); break;
        }
      } else {
        switch(event.state) {
          case 'began':     state = this.pencilBegan(event); break;
          case 'moved':     state = this.pencilMoved(event); break;
          case 'cancelled': state = this.pencilEnded(event); break;
          case 'ended':     state = this.pencilEnded(event); break;
        }
      }

      this.applyEvent(event, state);

      // Remove states that are no longer down
      if (this.pencilState?.down === false) { this.pencilState = null }
      this.fingerStates = this.fingerStates.filter((state) => {
        if (!state.down) { delete this.fingerStatesById[state.id]; }
        return state.down;
      });
    }

    this.events = [];
  }

  // Deprecated
  find(
    type: 'pencil',
    state: EventState,
    id?: TouchId
  ): PencilEvent | undefined;
  find(
    type: 'finger',
    state: EventState,
    id?: TouchId
  ): FingerEvent | undefined;
  find(type: EventType, state: EventState, id?: TouchId) {
    return this.events.find(
      e => e.type === type && e.state === state && (!id || e.id === id)
    );
  }

  // Deprecated
  findAll(type: 'pencil', state: EventState, id?: TouchId): PencilEvent[];
  findAll(type: 'finger', state: EventState, id?: TouchId): FingerEvent[];
  findAll(type: EventType, state: EventState, id?: TouchId) {
    return this.events.filter(
      e => e.type === type && e.state === state && (!id || e.id === id)
    );
  }

  // Deprecated
  findLast(
    type: 'pencil',
    state: EventState,
    id?: TouchId
  ): PencilEvent | undefined;
  findLast(
    type: 'finger',
    state: EventState,
    id?: TouchId
  ): FingerEvent | undefined;
  findLast(type: EventType, state: EventState, id?: TouchId) {
    return this.events.findLast(
      e => e.type === type && e.state === state && (!id || e.id === id)
    );
  }

  // prettier-ignore
  private setupNativeEventHandler() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).nativeEvent = (state: EventState, touches: Record<TouchId, TouchPoint[]>) => {
      // Okay, so this is weird. Swift gives us a single EventState, but multiple "touches"?
      // And then we loop through the touches and make… an Event for each one?
      // Why are we thinking of these as "touches"? What does that word mean here?
      // Why doesn't the Swift wrapper just give us an array of Events?
      // This seems like an abstraction leak, where the design of UIGestureRecognizer
      // is forcing a data model that doesn't match what we're actually trying to do.
      for (const id in touches) {
        for (const point of touches[id]) {
          const { type, timestamp, position, radius, pressure, altitude, azimuth } = point;
          const sharedProperties = { id, state, type, timestamp, position, radius };
          const event: Event = type === 'finger'
            ? { ...sharedProperties, type }
            : { ...sharedProperties, type, pressure, altitude, azimuth };
          this.events.push(event);
        }
      }
    };
  }

  // TODO: I suspect the below functions could be made generic, to act on both pencils and fingers,
  // with no loss of clarity. I also suspect they could be made drastically smaller.

  fingerBegan(event: FingerEvent) {
    const state: FingerState = {
      id: event.id,
      down: true,
      drag: false,
      position: event.position,
      originalPosition: event.position,
      dragDelta: null,
      event,
    };
    this.fingerStates.push(state);
    this.fingerStatesById[event.id] = state;
    return state;
  }

  pencilBegan(event: PencilEvent) {
    this.pencilState = {
      down: true,
      drag: false,
      position: event.position,
      originalPosition: event.position,
      dragDelta: null,
      event,
    };
    return this.pencilState;
  }

  fingerMoved(event: FingerEvent) {
    const state = this.fingerStatesById[event.id];
    if (!state) {
      throw new Error('Received finger move event with no matching begin.');
    }
    state.drag ||=
      Vec.dist(event.position, state.originalPosition!) > fingerMinDragDist;
    state.position = event.position;
    state.dragDelta = Vec.sub(event.position, state.originalPosition!);
    state.event = event;
    return state;
  }

  pencilMoved(event: PencilEvent) {
    const state = this.pencilState;
    if (!state) {
      throw new Error('Received pencil move event with no matching begin.');
    }
    state.drag ||=
      Vec.dist(event.position, state.originalPosition!) > pencilMinDragDist;
    state.position = event.position;
    state.dragDelta = Vec.sub(event.position, state.originalPosition!);
    state.event = event;
    return state;
  }

  fingerEnded(event: FingerEvent) {
    const state = this.fingerStatesById[event.id];
    if (!state) {
      throw new Error('Received finger ended event with no matching begin.');
    }
    state.down = false;
    state.event = event;
    return state;
  }

  pencilEnded(event: PencilEvent) {
    const state = this.pencilState;
    if (!state) {
      throw new Error('Received pencil ended event with no matching begin.');
    }
    state.down = false;
    state.event = event;
    return state;
  }
}
