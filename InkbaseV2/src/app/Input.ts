import Vec from '../lib/vec';
import { aGizmo } from './Gizmo';
import Events, {
  Event,
  InputState,
  TouchId,
  getPositionWithPressure,
} from './NativeEvents';
import Page from './Page';
import FormulaEditor, {
  aFormulaEditor,
  // aFormulaEditorCell,
} from './meta/FormulaEditor';
import LabelToken from './meta/LabelToken';
import NumberToken from './meta/NumberToken';
import Token, { aPrimaryToken, aToken } from './meta/Token';
import Handle, { aCanonicalHandle } from './strokes/Handle';
import Pencil from './tools/Pencil';
import { Position } from '../lib/types';
import Wire from './meta/Wire';
import * as constraints from './constraints';
import { isTokenWithVariable } from './meta/token-helpers';
import MetaToggle, { aMetaToggle } from './gui/MetaToggle';
import { MetaStruct } from './meta/MetaSemantics';
import PropertyPicker from './meta/PropertyPicker';
import PropertyPickerEditor, {
  aPropertyPickerEditor,
} from './meta/PropertyPickerEditor';

// Variables that store state needed by our gestures go here.

// THINKING OUT LOUD
// One possible way we could use this objects collection is to add some sort of "pre" and "post" code
// to applyEvent(). In the "pre" section (which could just be at the top of applyEvent),
// we'd capture any object(s?) that (eg) were under each finger/pencil "began" event.
// In the "post" section (which would have to be outside applyEvent(), since we eagerly return)
// we'd clean up any objects that are associated with each ended finger/pencil.
// TODO: use weak refs for GameObjects.
const objects: Partial<{
  touchedHandle: Handle;
  drawWire: Wire;
  drawStroke: boolean;
  scrubToken: {
    touchId: string;
    token: NumberToken;
    initialValue: number;
    wasLocked: boolean;
  };
  dragToken: {
    token: Token;
    offset: Position;
  };
  touchedMetaToggle: {
    owner: TouchId;
    toggle: MetaToggle;
  };
  pseudoFinger: string;
}> = {};

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
  formulaEditor: FormulaEditor,
  metaToggle: MetaToggle
) {
  // TODO: Need a more reliable way to get root here.
  const root = page.parent!;

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
    recursive: false,
  });

  const primaryTokenNearEvent = page.find({
    what: aPrimaryToken,
    near: event.position,
    recursive: true,
  });

  const metaToggleNearEvent = root.find({
    what: aMetaToggle,
    near: event.position,
    recursive: false,
    tooFar: 50,
  });

  const _formulaEditorToggleEvent = formulaEditor.isPositionNearToggle(
    event.position
  );

  const formulaEditorNearEvent = root.find({
    what: aFormulaEditor,
    near: event.position,
    recursive: false,
  });

  const propertyPickerEditorNearEvent = page.find({
    what: aPropertyPickerEditor,
    near: event.position,
    recursive: false,
  });

  // Below here, you'll find a list of each gesture recognizer in the system, one by one.
  // Each recognized gesture should end with a return, to keep the cyclomatic complexity super low.
  // In other words, we should try really hard to only have blocks (like `if`) go one level deep.
  // If we find that we can't express what we want with this pattern, we likely need a state machine.

  // TODO: We could potentially split these up to handle pencil separately from finger, and handle
  // each state separately, since (in theory) these separations cleanly split the gesture space
  // into non-overlapping sets.
  // META TOGGLE
  if (
    event.type === 'finger' &&
    event.state === 'began' &&
    metaToggleNearEvent
  ) {
    objects.touchedMetaToggle = {
      owner: event.id,
      toggle: metaToggleNearEvent,
    };
  }

  if (
    event.type === 'finger' &&
    event.state === 'moved' &&
    state.drag &&
    objects.touchedMetaToggle?.owner === event.id
  ) {
    objects.touchedMetaToggle.toggle.dragTo(event.position);
  }

  if (
    event.type === 'finger' &&
    event.state === 'ended' &&
    objects.touchedMetaToggle?.owner === event.id
  ) {
    if (!state.drag) {
      objects.touchedMetaToggle.toggle.toggle();
    } else {
      objects.touchedMetaToggle.toggle.snapToCorner();
    }
    objects.touchedMetaToggle = undefined;
    return;
  }

  // Tentatively making this a top level if-statement. In principle cleanly divides the the gesture space in two. (We'll have to see if this is a good idea)
  if (metaToggle.active) {
    // TAP INSIDE PROPERTY PICKER EDITOR
    if (
      event.type === 'pencil' &&
      event.state === 'began' &&
      propertyPickerEditorNearEvent
    ) {
      propertyPickerEditorNearEvent.onTapInside(event.position);
      return;
    }

    // WRITE INSIDE FORMULA EDITOR
    // Switch mode
    if (
      event.type === 'pencil' &&
      event.state === 'began' &&
      events.fingerStates.length === 1 &&
      formulaEditorNearEvent &&
      formulaEditor.isActive() &&
      !objects.pseudoFinger
    ) {
      formulaEditor.switchCellMode(event.position);
      objects.pseudoFinger = events.fingerStates[0].id;
      return;
    }

    if (
      event.type === 'finger' &&
      event.state === 'ended' &&
      formulaEditor.isActive() &&
      event.id === objects.pseudoFinger
    ) {
      console.log(event.id);
      formulaEditor.recognizeStrokes();
      objects.pseudoFinger = undefined;
      return;
    }

    if (
      event.type === 'pencil' &&
      event.state === 'began' &&
      formulaEditorNearEvent &&
      formulaEditorNearEvent.active
    ) {
      pencil.startStroke(getPositionWithPressure(event));
      objects.drawStroke = true;
      return;
    }

    if (
      event.type === 'pencil' &&
      event.state === 'moved' &&
      objects.drawStroke
    ) {
      pencil.extendStroke(getPositionWithPressure(event));
      return;
    }

    if (
      event.type === 'pencil' &&
      event.state === 'ended' &&
      objects.drawStroke &&
      pencil.stroke?.deref()
    ) {
      formulaEditor.captureStroke(pencil.stroke!.deref()!);
      pencil.endStroke();
      objects.drawStroke = false;
      return;
    }

    // META PEN
    // Add wire from token
    if (
      event.type === 'pencil' &&
      event.state === 'began' &&
      primaryTokenNearEvent &&
      isTokenWithVariable(primaryTokenNearEvent)
    ) {
      const w = new Wire();
      w.attachFront(primaryTokenNearEvent.wirePort);
      page.adopt(w);
      objects.drawWire = w;
      return;
    }

    // Add wire from property picker
    if (
      event.type === 'pencil' &&
      event.state === 'began' &&
      tokenNearEvent &&
      tokenNearEvent instanceof PropertyPicker
    ) {
      const w = new Wire();
      w.attachFront(tokenNearEvent.outputPort);
      page.adopt(w);
      objects.drawWire = w;
      return;
    }

    // Add wire from gizmo
    if (event.type === 'pencil' && event.state === 'began' && gizmoNearEvent) {
      const w = new Wire();
      w.attachFront(gizmoNearEvent.wirePort);
      page.adopt(w);
      objects.drawWire = w;
      return;
    }

    // Add wire from the middle of nowhere
    if (event.type === 'pencil' && event.state === 'began') {
      objects.drawWire = page.addWireFromPosition(event.position);
      return;
    }

    // Drag wire endpoint
    if (
      event.type === 'pencil' &&
      event.state === 'moved' &&
      objects.drawWire
    ) {
      objects.drawWire.points[1] = event.position;
      return;
    }

    // If it's a tiny wire, remove it, and open formula editor (Simple tap)
    if (
      event.type === 'pencil' &&
      event.state === 'ended' &&
      objects.drawWire?.isCollapsable()
    ) {
      objects.drawWire.remove();
      formulaEditor.activateFromPosition(event.position);
      objects.drawWire = undefined;
      return;
    }

    // Attach & snap to a token
    if (
      event.type === 'pencil' &&
      event.state === 'ended' &&
      objects.drawWire &&
      primaryTokenNearEvent &&
      isTokenWithVariable(primaryTokenNearEvent)
    ) {
      objects.drawWire.attachEnd(primaryTokenNearEvent.wirePort);
      objects.drawWire = undefined;
      return;
    }

    // Attach & snap to a gizmo
    if (
      event.type === 'pencil' &&
      event.state === 'ended' &&
      objects.drawWire &&
      gizmoNearEvent
    ) {
      objects.drawWire.attachEnd(gizmoNearEvent.wirePort);
      objects.drawWire = undefined;
      return;
    }

    // End and create a new property Picker
    if (
      event.type === 'pencil' &&
      event.state === 'ended' &&
      objects.drawWire?.a &&
      objects.drawWire?.a.deref()?.value instanceof MetaStruct
    ) {
      const p = new PropertyPicker();
      p.position = event.position;
      page.adopt(p);
      objects.drawWire.attachEnd(p.inputPort);
      objects.drawWire = undefined;
      const editor = new PropertyPickerEditor(p);
      page.adopt(editor);
      return;
    }

    // End wire & Open context menu
    // TODO: Open context menu
    if (
      event.type === 'pencil' &&
      event.state === 'ended' &&
      objects.drawWire
    ) {
      const n = new NumberToken();
      n.position = event.position;
      objects.drawWire.attachEnd(n.wirePort);
      page.adopt(n);
      objects.drawWire = undefined;
      return;
    }

    // FORMULA EDITOR
    // Close formula editor
    if (
      event.type === 'finger' &&
      event.state === 'began' &&
      events.fingerStates.length === 3 &&
      formulaEditor.isActive()
    ) {
      formulaEditor.parseFormulaAndClose();
      return;
    }

    // Tapped label while editing formula
    if (
      event.type === 'finger' &&
      event.state === 'began' &&
      events.fingerStates.length === 1 &&
      formulaEditor.isActive() &&
      primaryTokenNearEvent &&
      primaryTokenNearEvent instanceof LabelToken
    ) {
      formulaEditor.addLabelTokenFromExisting(primaryTokenNearEvent.label);
    }

    // SCRUB TOKENS
    if (
      event.type === 'finger' &&
      event.state === 'began' &&
      events.fingerStates.length >= 2 &&
      primaryTokenNearEvent &&
      primaryTokenNearEvent instanceof NumberToken
    ) {
      const v = primaryTokenNearEvent.getVariable();
      objects.scrubToken = {
        touchId: event.id,
        token: primaryTokenNearEvent,
        initialValue: v.value,
        wasLocked: v.isLocked,
      };
      return;
    }

    if (
      event.id === objects.scrubToken?.touchId &&
      event.type === 'finger' &&
      event.state === 'moved'
    ) {
      const { token, initialValue } = objects.scrubToken;
      const delta = state.originalPosition!.y - event.position.y;
      const m = 1 / Math.pow(10, events.fingerStates.length - 2);
      const newValue = Math.round((initialValue + delta * m) / m) * m;
      token.getVariable().lock().value = newValue;
      return;
    }

    // DRAGGING TOKENS
    if (
      event.type === 'finger' &&
      event.state === 'began' &&
      events.fingerStates.length === 1 &&
      tokenNearEvent
    ) {
      objects.dragToken = {
        token: tokenNearEvent,
        offset: Vec.sub(event.position, tokenNearEvent.position),
      };
      return;
    }

    if (
      event.type === 'finger' &&
      event.state === 'moved' &&
      events.fingerStates.length === 1 &&
      objects.dragToken
    ) {
      const { token, offset } = objects.dragToken;
      token.position = Vec.sub(event.position, offset);
      return;
    }

    if (event.type === 'finger' && event.state === 'ended') {
      if (
        primaryTokenNearEvent &&
        primaryTokenNearEvent instanceof NumberToken &&
        state.originalPosition &&
        Vec.dist(state.originalPosition, event.position) < 10
      ) {
        primaryTokenNearEvent.onTap();
      }

      objects.dragToken = undefined;
      objects.touchedHandle = undefined;

      if (objects.scrubToken) {
        if (!objects.scrubToken.wasLocked) {
          objects.scrubToken.token.getVariable().unlock();
        }
        objects.scrubToken = undefined;
      }
    }

    return;
  }

  // DRAWING MODE
  // REGULAR PEN
  if (event.type === 'pencil' && event.state === 'began') {
    pencil.startStroke(getPositionWithPressure(event));
    objects.drawStroke = true;
    return;
  }

  if (
    event.type === 'pencil' &&
    event.state === 'moved' &&
    objects.drawStroke
  ) {
    pencil.extendStroke(getPositionWithPressure(event));
    return;
  }

  if (
    event.type === 'pencil' &&
    event.state === 'ended' &&
    objects.drawStroke &&
    pencil.stroke?.deref()
  ) {
    formulaEditor.captureStroke(pencil.stroke!.deref()!);
    pencil.endStroke();
    objects.drawStroke = false;
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

  // MOVE SELECTED HANDLES

  if (event.type === 'finger' && event.state === 'began' && handleNearEvent) {
    objects.touchedHandle = handleNearEvent;
    return;
  }

  if (
    event.type === 'finger' &&
    event.state === 'moved' &&
    objects.touchedHandle
  ) {
    // TODO: replace this with the correct gestures
    const handle = objects.touchedHandle;
    handle.position = event.position;
    constraints.now.pin(handle);
    return;
  }
}
