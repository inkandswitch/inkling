import Vec from '../lib/vec';
import { aGizmo } from './Gizmo';
import Events, {
  Event,
  FingerEvent,
  InputState,
  PencilEvent,
  TouchId,
  getPositionWithPressure,
} from './NativeEvents';
import Page from './Page';
import FormulaEditor, { aFormulaEditor } from './meta/FormulaEditor';
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
import { GameObject } from './GameObject';

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
  scrubToken: {
    owner: TouchId;
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
  events: Events, // The full NativeEvents instance, so we can look at other the pencils/fingers.
  root: GameObject,
  // Marcel thinking: Passing every single thing as an argument seems kind of messy
  // Maybe if we turn App into a singleton, we could just pass that into here as context?
  pencil: Pencil,
  formulaEditor: FormulaEditor,
  metaToggle: MetaToggle
) {
  switch (event.type) {
    case 'finger':
      if (handleMetaToggleEvent(event, state, root)) {
        // already handled it!
      } else if (metaToggle.active) {
        handleMetaModeFingerEvent(
          event,
          state,
          events,
          root.page,
          formulaEditor
        );
      } else {
        handleConcreteModeFingerEvent(event, root.page);
      }
      break;
    case 'pencil':
      if (metaToggle.active) {
        handleMetaModePencilEvent(event, events, root, formulaEditor, pencil);
      } else {
        handleConcreteModePencilEvent(event, formulaEditor, pencil);
      }
      break;
  }
}

function handleMetaToggleEvent(
  event: FingerEvent,
  state: InputState,
  root: GameObject
): boolean {
  const metaToggleNearEvent = root.find({
    what: aMetaToggle,
    near: event.position,
    recursive: false,
    tooFar: 50,
  });

  if (event.state === 'began' && metaToggleNearEvent) {
    objects.touchedMetaToggle = {
      owner: event.id,
      toggle: metaToggleNearEvent,
    };
    return true;
  }

  if (
    event.state === 'moved' &&
    state.drag &&
    objects.touchedMetaToggle?.owner === event.id
  ) {
    objects.touchedMetaToggle.toggle.dragTo(event.position);
    return true;
  }

  if (
    event.state === 'ended' &&
    objects.touchedMetaToggle?.owner === event.id
  ) {
    if (!state.drag) {
      objects.touchedMetaToggle.toggle.toggle();
    } else {
      objects.touchedMetaToggle.toggle.snapToCorner();
    }
    objects.touchedMetaToggle = undefined;
    return true;
  }

  return false;
}

function handleMetaModePencilEvent(
  event: PencilEvent,
  events: Events,
  root: GameObject,
  formulaEditor: FormulaEditor,
  pencil: Pencil
) {
  const page = root.page;

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

  const pencilStroke = pencil.stroke?.deref();

  // TAP INSIDE PROPERTY PICKER EDITOR
  if (event.state === 'began' && propertyPickerEditorNearEvent) {
    propertyPickerEditorNearEvent.onTapInside(event.position);
    return;
  }

  // WRITE INSIDE FORMULA EDITOR
  // Switch mode
  if (
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

  if (event.state === 'began' && formulaEditorNearEvent?.active) {
    pencil.startStroke(getPositionWithPressure(event));
    return;
  }

  if (event.state === 'moved' && pencilStroke) {
    pencil.extendStroke(getPositionWithPressure(event));
    return;
  }

  if (event.state === 'ended' && pencilStroke) {
    formulaEditor.captureStroke(pencilStroke);
    pencil.endStroke();
    return;
  }

  // META PEN
  // Add wire from token
  if (
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
  if (event.state === 'began' && gizmoNearEvent) {
    const w = new Wire();
    w.attachFront(gizmoNearEvent.wirePort);
    page.adopt(w);
    objects.drawWire = w;
    return;
  }

  // Add wire from the middle of nowhere
  if (event.state === 'began') {
    objects.drawWire = page.addWireFromPosition(event.position);
    return;
  }

  // Drag wire endpoint
  if (event.state === 'moved' && objects.drawWire) {
    objects.drawWire.points[1] = event.position;
    return;
  }

  // If it's a tiny wire, remove it, and open formula editor (Simple tap)
  if (event.state === 'ended' && objects.drawWire?.isCollapsable()) {
    objects.drawWire.remove();
    formulaEditor.activateFromPosition(event.position);
    objects.drawWire = undefined;
    return;
  }

  // Attach & snap to a token
  if (
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
  if (event.state === 'ended' && objects.drawWire && gizmoNearEvent) {
    objects.drawWire.attachEnd(gizmoNearEvent.wirePort);
    objects.drawWire = undefined;
    return;
  }

  // End and create a new property Picker
  if (
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
  if (event.state === 'ended' && objects.drawWire) {
    const n = new NumberToken();
    n.position = event.position;
    objects.drawWire.attachEnd(n.wirePort);
    page.adopt(n);
    objects.drawWire = undefined;
    return;
  }
}

function handleMetaModeFingerEvent(
  event: FingerEvent,
  state: InputState,
  events: Events,
  page: Page,
  formulaEditor: FormulaEditor
) {
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

  if (
    event.state === 'ended' &&
    formulaEditor.isActive() &&
    event.id === objects.pseudoFinger
  ) {
    console.log(event.id);
    formulaEditor.recognizeStrokes();
    objects.pseudoFinger = undefined;
    return;
  }

  // FORMULA EDITOR
  // Close formula editor
  if (
    event.state === 'began' &&
    events.fingerStates.length === 3 &&
    formulaEditor.isActive()
  ) {
    formulaEditor.parseFormulaAndClose();
    return;
  }

  // Tapped label while editing formula
  if (
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
    event.state === 'began' &&
    events.fingerStates.length >= 2 &&
    primaryTokenNearEvent &&
    primaryTokenNearEvent instanceof NumberToken
  ) {
    const v = primaryTokenNearEvent.getVariable();
    objects.scrubToken = {
      owner: event.id,
      token: primaryTokenNearEvent,
      initialValue: v.value,
      wasLocked: v.isLocked,
    };
    return;
  }

  if (event.id === objects.scrubToken?.owner && event.state === 'moved') {
    const { token, initialValue } = objects.scrubToken;
    const delta = state.originalPosition!.y - event.position.y;
    const m = 1 / Math.pow(10, events.fingerStates.length - 2);
    const newValue = Math.round((initialValue + delta * m) / m) * m;
    token.getVariable().lock().value = newValue;
    return;
  }

  // DRAGGING TOKENS
  if (
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
    event.state === 'moved' &&
    events.fingerStates.length === 1 &&
    objects.dragToken
  ) {
    const { token, offset } = objects.dragToken;
    token.position = Vec.sub(event.position, offset);
    return;
  }

  if (event.state === 'ended') {
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
}

function handleConcreteModePencilEvent(
  event: PencilEvent,
  formulaEditor: FormulaEditor,
  pencil: Pencil
) {
  const pencilStroke = pencil.stroke?.deref();
  switch (event.state) {
    case 'began':
      pencil.startStroke(getPositionWithPressure(event));
      break;
    case 'moved':
      if (pencilStroke) {
        pencil.extendStroke(getPositionWithPressure(event));
      }
      break;
    case 'ended':
      if (pencilStroke) {
        formulaEditor.captureStroke(pencilStroke);
        pencil.endStroke();
      }
      break;
  }
}

function handleConcreteModeFingerEvent(event: FingerEvent, page: Page) {
  switch (event.state) {
    case 'began': {
      const handleNearEvent = page.find({
        what: aCanonicalHandle,
        near: event.position,
      });
      if (handleNearEvent) {
        objects.touchedHandle = handleNearEvent;
      }
      break;
    }
    case 'moved':
      if (objects.touchedHandle) {
        // TODO: replace this with the correct gestures
        const handle = objects.touchedHandle;
        handle.position = event.position;
        constraints.now.pin(handle);
      }
      break;
  }
}
