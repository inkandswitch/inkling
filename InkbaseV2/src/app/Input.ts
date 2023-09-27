import { aGizmo } from './Gizmo';
import Events, { TouchId, Event, InputState } from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import { aToken } from './meta/Token';
import { aCanonicalHandle } from './strokes/Handle';

// Variables that store state needed by our gestures go here.

// THINKING OUT LOUD
// One possible way we could use this objects collection is to add some sort of "pre" and "post" code
// to applyEvent(). In the "pre" section (which could just be at the top of applyEvent),
// we'd capture any object(s?) that (eg) were under each finger/pencil "began" event.
// In the "post" section (which would have to be outside applyEvent(), since we eagerly return)
// we'd clean up any objects that are associated with each ended finger/pencil.
const objects: Record<TouchId, any> = {}; // The objects we're currently manipulating with each finger/pencil.

// End gesture state variables.

// This is called by NativeEvent (via App) once for every event given to us by Swift.
export function applyEvent(
  event: Event, // The current event we're processing.
  state: InputState, // The current state of the pencil or finger that generated this event.
  events: Events, // The full NativeEvents instance, so we can look at other the pencil/fingers.
  selection: Selection,
  page: Page
) {
  // This is a good place to set up any state needed by the below gesture recognizers.
  // Please don't fret about the performance burden of gathering this state on every event —
  // it rounds to zero! We can optimize the heck out of this later, once we know what we even want.

  const handleNearEvent = page.find({
    what: aCanonicalHandle,
    near: event.position,
  });
  const gizmoNearEvent = page.find({
    what: aGizmo,
    near: event.position,
  });

  const tokenNearEvent = page.find({
    what: aToken,
    near: event.position,
    recursive: false
  });

  // Below here, you'll find a list of each gesture recognizer in the system, one by one.
  // Each recognized gesture should end with a return, to keep the cyclomatic complexity super low.
  // In other words, we should try really hard to only have blocks (like `if`) go one level deep.
  // If we find that we can't express what we want with this pattern, we likely need a state machine.

  // TODO: We could potentially split these up to handle pencil separately from finger, and handle
  // each state separately, since (in theory) these separations cleanly split the gesture space
  // into non-overlapping sets.


  // DRAGGING TOKENS
  if (
    event.type === 'finger' &&
    event.state === 'began' && 
    events.fingerStates.length === 1 &&
    tokenNearEvent
  ) {
    // Drag token
    objects['dragToken'] = tokenNearEvent
  }

  // TODO: Handle dragging with offset
  if (
    event.type === 'finger' &&
    event.state === 'moved' && 
    events.fingerStates.length === 1 &&
    objects['dragToken']
  ) {
    // Drag token
    objects['dragToken'].position = event.position;
  }

  if (
    event.type === 'finger' &&
    event.state === 'ended' && 
    events.fingerStates.length === 1 &&
    objects['dragToken']
  ) {
    // Drag token
    delete objects['dragToken'];
  }



  // TAP A HANDLE WITH THE FIRST FINGER —> SELECT THE HANDLE
  if (
    event.type === 'finger' &&
    event.state === 'began' &&
    events.fingerStates.length === 1 &&
    handleNearEvent
  ) {
    // objects[event.id] = handleNearEvent; // TODO: Save this handle so we can immediately start dragging it
    return selection.selectHandle(handleNearEvent);
  }

  // TAP A GIZMO -> TOGGLE THE GIZMO
  if (event.type === 'finger' && event.state === 'began' && gizmoNearEvent) {
    return gizmoNearEvent.tap(event.position);
  }

  // CLEAR SELECTION WHEN A FINGER IS TAPPED
  if (
    event.type === 'finger' &&
    event.state === 'ended' &&
    !state.drag &&
    !handleNearEvent
    // TODO: We may want to track the max number of fingers seen since the gesture began,
    // so we can only invoke this gesture when that === 1
    // TODO: Rather than determining whether a drag has happened in NativeEvent, we might
    // want to determine it here, so that each different gesture can decide how much of a drag
    // is enough (or too much) to warrant responding to. So in NativeEvent, it'd just accumulate
    // the total distance travelled by the pencil/finger.
  ) {
    return selection.clearSelection();
  }

  // MOVE SELECTED HANDLES
  if (event.type === 'finger' && event.state === 'moved') {
    // TODO: Implement this
    return;
  }
}
