import Events, { TouchId, Event, InputState } from './NativeEvents';
import Page from './Page';
import Selection from './Selection';

// Variables that store state needed by our gestures go here.

let objects: Record<TouchId, any> = {}; // The objects we're currently manipulating with each finger/pencil.

// End gesture state variables.

// This is called by NativeEvent (via App) once for every event given to us by Swift.
export function applyEvent(
  event: Event, // The current event we're processing.
  state: InputState, // The current state of the pencil or finger that generated this event.
  events: Events, // The full NativeEvents instance, so we can look at other the pencil/fingers.
  page: Page,
  selection: Selection
) {
  const handleNearEvent = page.findHandleNear(event.position);

  // Below here, you'll find a list of each gesture in the system, one by one.
  // Each gesture should probably end with a return, to keep the cyclomatic complexity super low.
  // In other words, we should try really hard to only have blocks (like `if`) go one level deep.
  // If we find that we can't express what we want with this pattern, we likely need a state machine.

  // TODO: MANIPULATING GIZMOS COULD GO HERE, SO THEY WIN OUT OVER SELECTION

  // SELECT HANDLE ON FIRST FINGER TAP
  if (
    event.type === 'finger' &&
    event.state === 'began' &&
    events.fingerStates.length === 1 &&
    handleNearEvent
  ) {
    return selection.selectHandle(handleNearEvent);
  }

  // CLEAR SELECTION WHEN A FINGER IS TAPPED
  if (
    event.type === 'finger' &&
    event.state === 'ended' &&
    !state.drag &&
    !handleNearEvent
    // TODO: We may want to track the max number of fingers seen since the gesture began,
    // so we can only invoke this gesture when that === 1
  ) {
    return selection.clearSelection();
  }
}
