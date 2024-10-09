import { Position, PositionWithPressure } from '../lib/types';
import Vec from '../lib/vec';
import Config from './Config';
import { Gesture } from './Gesture';
import MetaToggle from './gui/MetaToggle';

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

// How long (milliseconds) can a touch go without being updated before we consider it "dead"?
const touchMaxAge = 15000;

export type Event = PencilEvent | FingerEvent;
export type InputState = PencilState | FingerState;

export type EventType = Event['type'];
export type EventState = 'began' | 'moved' | 'ended';
export type EventStateWithCancelled = EventState | 'cancelled';
export type TouchId = string;

interface SharedEventProperties {
  state: EventState;
  id: TouchId;
  position: Position;
  timestamp: number;
  radius: number;
  lastUpdated: number;
}

export interface PencilEvent extends SharedEventProperties {
  type: 'pencil';
  pressure: number;
  altitude: number;
  azimuth: number;
}

export interface FingerEvent extends SharedEventProperties {
  type: 'finger';
}

interface SharedStateProperties {
  down: boolean; // Is the touch currently down?
  drag: boolean; // Has the touch moved at least a tiny bit since being put down?
  dragDist: number; // How far has the touch moved?
  // TODO — do we want to store the original & current *event* instead of cherry-picking their properties?
  position: Position; // Where is the touch now?
  originalPosition: Position; // Where was the touch initially put down?
  lastUpdated: number;
}

export interface PencilState extends SharedStateProperties {
  event: PencilEvent; // What's the current (or most recent) event that has contributed to the state?
}
export interface FingerState extends SharedStateProperties {
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
  forcePseudo: number = 0;

  constructor(
    private metaToggle: MetaToggle,
    private applyEvent: ApplyEvent
  ) {
    this.setupFallbackEvents();
    this.setupNativeEventHandler();
  }

  // prettier-ignore
  update() {
    for (const event of this.events) {
      let state: InputState;

      // Tempted to make this a dynamic dispatch
      if (event.type === 'finger') {
        switch(event.state) {
          case 'began':     state = this.fingerBegan(event); break;
          case 'moved':     state = this.fingerMoved(event); break;
          case 'ended':     state = this.fingerEnded(event); break;
        }
      } else {
        switch(event.state) {
          case 'began':     state = this.pencilBegan(event); break;
          case 'moved':     state = this.pencilMoved(event); break;
          case 'ended':     state = this.pencilEnded(event); break;
        }
      }

      state.lastUpdated = performance.now();

      this.applyEvent(event, state);

      // Remove states that are no longer down
      if (this.pencilState?.down === false) { this.pencilState = null }
      this.fingerStates = this.fingerStates.filter((state) => state.down);
    }

    this.events = [];

    // We need to reap any eventStates that haven't been touched in a while,
    // because we don't always receive the "ended".
    if (Config.gesture.reapTouches) {
      this.fingerStates = this.fingerStates.filter(wasRecentlyUpdated);
      if (this.pencilState && !wasRecentlyUpdated(this.pencilState)) {
        this.pencilState = null;
      }
    }
  }

  private mouseEvent(e: MouseEvent, state: EventState) {
    this.events.push({
      position: { x: e.clientX, y: e.clientY },
      id: '-1',
      state,
      type: this.keymap.space ? 'pencil' : 'finger',
      timestamp: performance.now(),
      radius: 1,
      lastUpdated: performance.now(),
      altitude: 0,
      azimuth: 0,
      pressure: 1,
    });
  }

  keymap: Record<string, boolean> = {};

  private keyboardEvent(e: KeyboardEvent, state: EventState) {
    const k = keyName(e);

    if (state === 'began' && this.keymap[k]) {
      return;
    } else if (state === 'began') {
      this.keymap[k] = true;
    } else {
      delete this.keymap[k];
    }

    this.forcePseudo =
      [
        this.keymap['1'],
        this.keymap['2'],
        this.keymap['3'],
        this.keymap['4'],
      ].lastIndexOf(true) + 1;

    if (state === 'began') {
      if (this.shortcuts[k]) {
        this.shortcuts[k]();
        e.preventDefault();
      }
    }
  }

  private shortcuts: Record<string, Function> = {
    Tab: () => {
      this.metaToggle.toggle();
    },
  };

  private setupFallbackEvents() {
    window.onmousedown = (e: MouseEvent) => this.mouseEvent(e, 'began');
    window.onmousemove = (e: MouseEvent) => this.mouseEvent(e, 'moved');
    window.onmouseup = (e: MouseEvent) => this.mouseEvent(e, 'ended');
    window.onkeydown = (e: KeyboardEvent) => this.keyboardEvent(e, 'began');
    window.onkeyup = (e: KeyboardEvent) => this.keyboardEvent(e, 'ended');
  }

  private disableFallbackEvents() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
    window.onkeydown = null;
    window.onkeyup = null;
  }

  // prettier-ignore
  private setupNativeEventHandler() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).nativeEvent = (state: EventStateWithCancelled, touches: Record<TouchId, TouchPoint[]>) => {
      this.disableFallbackEvents();

      // The swift wrapper passes us 'cancelled' events, but they're a pain to code around, so we treat them as 'ended'
      if (state === 'cancelled') {
        state = 'ended'
      }

      const lastUpdated = performance.now();

      // Okay, so this is weird. Swift gives us a single EventState, but multiple "touches"?
      // And then we loop through the touches and make… an Event for each one?
      // Why are we thinking of these as "touches"? What does that word mean here?
      // Why doesn't the Swift wrapper just give us an array of Events?
      // This seems like an abstraction leak, where the design of UIGestureRecognizer
      // is forcing a data model that doesn't match what we're actually trying to do.
      for (const id in touches) {
        for (const point of touches[id]) {
          const { type, timestamp, position, radius, pressure, altitude, azimuth } = point;
          const sharedProperties = { id, state, type, timestamp, position, radius, lastUpdated };
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

  fingerBegan(event: FingerEvent, down = true) {
    const state: FingerState = {
      id: event.id,
      down,
      drag: false,
      dragDist: 0,
      position: event.position,
      originalPosition: event.position,
      event,
      lastUpdated: 0,
    };
    this.fingerStates.push(state);
    return state;
  }

  pencilBegan(event: PencilEvent, down = true) {
    this.pencilState = {
      down,
      drag: false,
      dragDist: 0,
      position: event.position,
      originalPosition: event.position,
      event,
      lastUpdated: 0,
    };
    return this.pencilState;
  }

  fingerMoved(event: FingerEvent) {
    let state = this.fingerStates.find(state => state.id === event.id);
    if (!state) {
      state = this.fingerBegan(event, false);
    }
    state.dragDist = Vec.dist(event.position, state.originalPosition!);
    state.drag ||= state.dragDist > fingerMinDragDist;
    state.position = event.position;
    state.event = event;
    return state;
  }

  pencilMoved(event: PencilEvent) {
    let state = this.pencilState;
    if (!state) {
      state = this.pencilBegan(event, false);
    }
    state.dragDist = Vec.dist(event.position, state.originalPosition!);
    state.drag ||= state.dragDist > pencilMinDragDist;
    state.position = event.position;
    state.event = event;
    return state;
  }

  fingerEnded(event: FingerEvent) {
    let state = this.fingerStates.find(state => state.id === event.id);
    if (!state) {
      state = this.fingerBegan(event, false);
    }
    state.down = false;
    state.event = event;
    return state;
  }

  pencilEnded(event: PencilEvent) {
    let state = this.pencilState;
    if (!state) {
      (state = this.pencilBegan(event)), false;
    }
    state.down = false;
    state.event = event;
    return state;
  }
}

export function getPositionWithPressure(
  event: PencilEvent
): PositionWithPressure {
  return { ...event.position, pressure: event.pressure };
}

export function wasRecentlyUpdated(thing: InputState | Gesture | Event) {
  const recentlyUpdated = thing.lastUpdated + touchMaxAge > performance.now();
  if (!recentlyUpdated) {
    console.log('TELL IVAN YOU SAW THIS');
  }
  return recentlyUpdated;
}

function keyName(e: KeyboardEvent) {
  return e.key.replace(' ', 'space');
}
