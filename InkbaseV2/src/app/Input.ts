import { PositionWithPressure } from '../lib/types';
import { aGizmo } from './Gizmo';
import Events, { TouchId, Event, InputState } from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import Formula from './meta/Formula';
import FormulaEditor from './meta/FormulaEditor';
import { aToken } from './meta/Token';
import { aCanonicalHandle } from './strokes/Handle';

import Pencil from './tools/Pencil';

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
  page: Page,

  // Marcel thinking: Passing every single thing as an argument seems kind of messy
  // Maybe if we turn App into a singleton, we could just pass that into here as context?
  pencil: Pencil,
  formulaEditor: FormulaEditor
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

  const formulaEditorToggleEvent = formulaEditor.isPositionNearToggle(event.position);


  // Below here, you'll find a list of each gesture recognizer in the system, one by one.
  // Each recognized gesture should end with a return, to keep the cyclomatic complexity super low.
  // In other words, we should try really hard to only have blocks (like `if`) go one level deep.
  // If we find that we can't express what we want with this pattern, we likely need a state machine.

  // TODO: We could potentially split these up to handle pencil separately from finger, and handle
  // each state separately, since (in theory) these separations cleanly split the gesture space
  // into non-overlapping sets.

  // ACTIVATE FORMULA EDITOR
  // TODO: This is not a good gesture
  // if (
  //   event.type === 'pencil' &&
  //   event.state === 'began' &&
  //   events.fingerStates.length === 1 &&
  //   tokenNearEvent &&
  //   tokenNearEvent instanceof Formula
  // ) {
  //   formulaEditor.activateFromFormula(new WeakRef(tokenNearEvent));
  //   return
  // }

  // META PEN

  if (
    event.type === 'pencil' &&
    event.state === 'began' &&
    events.fingerStates.length === 1 &&
    tokenNearEvent
  ) {
    objects['drawWire'] = page.addWireFromToken(tokenNearEvent);
    return
  }

  if (
    event.type === 'pencil' &&
    event.state === 'began' &&
    events.fingerStates.length === 1
  ) {
    objects['drawWire'] = page.addWireFromPosition(event.position);
    return
  }

  if (
    event.type === 'pencil' &&
    event.state === 'moved' &&
    objects['drawWire']
  ) {
    objects['drawWire'].points[1] = event.position
    return;
  }

  // PENCIL ENDED
  // If it's a tiny wire, remove it, and open formula editor (Simple tap)
  if (
    event.type === 'pencil' &&
    event.state === 'ended' && 
    objects['drawWire'] &&
    objects['drawWire'].isCollapsable()
  ) {
    objects['drawWire'].remove();
    formulaEditor.activateFromPosition(event.position);
    delete objects['drawWire'];
    return;
  }

  // Attach & snap to a token
  if (
    event.type === 'pencil' &&
    event.state === 'ended' && 
    objects['drawWire'] &&
    tokenNearEvent
  ) {
    objects['drawWire'].attachEnd(tokenNearEvent);
    delete objects['drawWire'];
    return;
  }

  // simply end & open context menu
  if (
    event.type === 'pencil' &&
    event.state === 'ended' && 
    objects['drawWire']
  ) {
    delete objects['drawWire'];
    return;
  }

  // USE THE PEN
  if (
    event.type === 'pencil' &&
    event.state === 'began' &&
    formulaEditor.isActive() &&
    formulaEditorToggleEvent
  ) {
    formulaEditor.toggleMode();
    return
  }

  if (
    event.type === 'finger' &&
    event.state === 'began' &&
    events.fingerStates.length === 3 &&
    formulaEditor.isActive()
  ) {
    formulaEditor.deactivate();
    return
  }

  

  if (
    event.type === 'pencil' &&
    event.state === 'began'
  ) {
    // TODO: Constructing position with pressure like this could be improved
    pencil.startStroke({
      x: event.position.x,
      y: event.position.y,
      pressure: event.pressure
    });
    objects['drawStroke'] = true;
    return;
  }



  if (
    event.type === 'pencil' &&
    event.state === 'moved' &&
    objects['drawStroke']
  ) {
    pencil.extendStroke({
      x: event.position.x, 
      y: event.position.y,
      pressure: event.pressure
    });
    return;
  }

  if (
    event.type === 'pencil' &&
    event.state === 'ended' && 
    objects['drawStroke']
  ) {
    formulaEditor.captureStroke(pencil.stroke!);
    pencil.endStroke();
    objects['drawStroke'] = false;
    return;
  }


  // DRAGGING TOKENS
  if (
    event.type === 'finger' &&
    event.state === 'began' && 
    events.fingerStates.length === 1 &&
    tokenNearEvent
  ) {
    objects['dragToken'] = tokenNearEvent;
    return;
  }

  // TODO: Handle dragging with offset
  if (
    event.type === 'finger' &&
    event.state === 'moved' && 
    events.fingerStates.length === 1 &&
    objects['dragToken']
  ) {
    objects['dragToken'].position = event.position;
    return;
  }

  if (
    event.type === 'finger' &&
    event.state === 'ended' && 
    events.fingerStates.length === 1 &&
    objects['dragToken']
  ) {
    delete objects['dragToken'];
    return;
  }



  // // TAP A HANDLE WITH THE FIRST FINGER —> SELECT THE HANDLE
  // if (
  //   event.type === 'finger' &&
  //   event.state === 'began' &&
  //   events.fingerStates.length === 1 &&
  //   handleNearEvent
  // ) {
  //   // objects[event.id] = handleNearEvent; // TODO: Save this handle so we can immediately start dragging it
  //   return selection.selectHandle(handleNearEvent);
  // }

  // // TAP A GIZMO -> TOGGLE THE GIZMO
  // if (event.type === 'finger' && event.state === 'began' && gizmoNearEvent) {
  //   return gizmoNearEvent.tap(event.position);
  // }

  // // CLEAR SELECTION WHEN A FINGER IS TAPPED
  // if (
  //   event.type === 'finger' &&
  //   event.state === 'ended' &&
  //   !state.drag &&
  //   !handleNearEvent
  //   // TODO: We may want to track the max number of fingers seen since the gesture began,
  //   // so we can only invoke this gesture when that === 1
  //   // TODO: Rather than determining whether a drag has happened in NativeEvent, we might
  //   // want to determine it here, so that each different gesture can decide how much of a drag
  //   // is enough (or too much) to warrant responding to. So in NativeEvent, it'd just accumulate
  //   // the total distance travelled by the pencil/finger.
  // ) {
  //   return selection.clearSelection();
  // }

  // // MOVE SELECTED HANDLES
  // if (event.type === 'finger' && event.state === 'moved') {
  //   // TODO: Implement this
  //   return;
  // }
}
