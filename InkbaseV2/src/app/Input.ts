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
import NumberToken from './meta/NumberToken';
import Token, { aPrimaryToken, aToken } from './meta/Token';
import Handle, { aCanonicalHandle } from './strokes/Handle';
import Pencil from './tools/Pencil';
import { Position } from '../lib/types';
import Wire from './meta/Wire';
import * as constraints from './constraints';
import {
  isLabelToken,
  isNumberToken,
  isPropertyPicker,
  isTokenWithVariable,
} from './meta/token-helpers';
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
  pseudoFinger: TouchId;
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
      if (handleMetaToggleFingerEvent(event, state, root)) {
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

function handleMetaToggleFingerEvent(
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

  switch (event.state) {
    case 'began':
      if (metaToggleNearEvent) {
        objects.touchedMetaToggle = {
          owner: event.id,
          toggle: metaToggleNearEvent,
        };
        return true;
      }
      break;
    case 'moved':
      if (state.drag && objects.touchedMetaToggle?.owner === event.id) {
        objects.touchedMetaToggle.toggle.dragTo(event.position);
        return true;
      }
      break;
    case 'ended':
      if (objects.touchedMetaToggle?.owner === event.id) {
        if (!state.drag) {
          objects.touchedMetaToggle.toggle.toggle();
        } else {
          objects.touchedMetaToggle.toggle.snapToCorner();
        }
        objects.touchedMetaToggle = undefined;
        return true;
      }
      break;
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

  switch (event.state) {
    case 'began':
      if (propertyPickerEditorNearEvent) {
        // tap inside property picker editor
        propertyPickerEditorNearEvent.onTapInside(event.position);
      } else if (
        formulaEditorNearEvent?.isActive() &&
        events.fingerStates.length === 1 &&
        !objects.pseudoFinger
      ) {
        // write inside formula editor (switch mode)
        formulaEditorNearEvent.switchCellMode(event.position);
        objects.pseudoFinger = events.fingerStates[0].id;
      } else if (formulaEditorNearEvent?.isActive()) {
        pencil.startStroke(getPositionWithPressure(event));
      } else if (isTokenWithVariable(primaryTokenNearEvent)) {
        // add wire from token
        const w = new Wire();
        w.attachFront(primaryTokenNearEvent.wirePort);
        page.adopt(w);
        objects.drawWire = w;
      } else if (isPropertyPicker(tokenNearEvent)) {
        // add wire from property picker
        const w = new Wire();
        w.attachFront(tokenNearEvent.outputPort);
        page.adopt(w);
        objects.drawWire = w;
      } else if (gizmoNearEvent) {
        // add wire from gizmo
        const w = new Wire();
        w.attachFront(gizmoNearEvent.wirePort);
        page.adopt(w);
        objects.drawWire = w;
      } else {
        // add wire from the middle of nowhere
        objects.drawWire = page.addWireFromPosition(event.position);
      }
      break;
    case 'moved':
      if (pencilStroke) {
        pencil.extendStroke(getPositionWithPressure(event));
      } else if (objects.drawWire) {
        // drag wire endpoint
        objects.drawWire.points[1] = event.position;
      }
      break;
    case 'ended':
      if (pencilStroke) {
        formulaEditor.captureStroke(pencilStroke);
        pencil.endStroke();
      } else if (objects.drawWire?.isCollapsable()) {
        // if it's a tiny wire, remove it and open formula editor (simple tap)
        objects.drawWire.remove();
        objects.drawWire = undefined;
        formulaEditor.activateFromPosition(event.position);
      } else if (
        objects.drawWire &&
        isTokenWithVariable(primaryTokenNearEvent)
      ) {
        // attach & snap to a token
        objects.drawWire.attachEnd(primaryTokenNearEvent.wirePort);
        objects.drawWire = undefined;
      } else if (objects.drawWire && gizmoNearEvent) {
        // attach & snap to a gizmo
        objects.drawWire.attachEnd(gizmoNearEvent.wirePort);
        objects.drawWire = undefined;
      } else if (objects.drawWire?.a?.deref()?.value instanceof MetaStruct) {
        // end and create a new property picker
        const p = new PropertyPicker();
        p.position = event.position;
        page.adopt(p);
        objects.drawWire.attachEnd(p.inputPort);
        objects.drawWire = undefined;
        const editor = new PropertyPickerEditor(p);
        page.adopt(editor);
      } else if (objects.drawWire) {
        // end wire & Open context menu
        // TODO: open context menu
        const n = new NumberToken();
        n.position = event.position;
        objects.drawWire.attachEnd(n.wirePort);
        page.adopt(n);
        objects.drawWire = undefined;
      }
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

  switch (event.state) {
    case 'began':
      if (formulaEditor.isActive() && events.fingerStates.length === 3) {
        // close formula editor
        formulaEditor.parseFormulaAndClose();
      } else if (
        formulaEditor.isActive() &&
        events.fingerStates.length === 1 &&
        isLabelToken(primaryTokenNearEvent)
      ) {
        // tapped label while editing formula
        formulaEditor.addLabelTokenFromExisting(primaryTokenNearEvent.label);
      } else if (
        isNumberToken(primaryTokenNearEvent) &&
        events.fingerStates.length >= 2
      ) {
        // start scrubbing a number token
        const v = primaryTokenNearEvent.getVariable();
        objects.scrubToken = {
          owner: event.id,
          token: primaryTokenNearEvent,
          initialValue: v.value,
          wasLocked: v.isLocked,
        };
      } else if (events.fingerStates.length === 1 && tokenNearEvent) {
        // start dragging a token
        objects.dragToken = {
          token: tokenNearEvent,
          offset: Vec.sub(event.position, tokenNearEvent.position),
        };
      }
      break;
    case 'moved':
      if (event.id === objects.scrubToken?.owner) {
        // scrub a number token
        const { token, initialValue } = objects.scrubToken;
        const delta = state.originalPosition!.y - event.position.y;
        const m = 1 / Math.pow(10, events.fingerStates.length - 2);
        const newValue = Math.round((initialValue + delta * m) / m) * m;
        token.getVariable().lock().value = newValue;
      } else if (objects.dragToken && events.fingerStates.length === 1) {
        // drag a token
        const { token, offset } = objects.dragToken;
        token.position = Vec.sub(event.position, offset);
      }
      break;
    case 'ended':
      if (formulaEditor.isActive() && event.id === objects.pseudoFinger) {
        console.log(event.id);
        formulaEditor.recognizeStrokes();
        objects.pseudoFinger = undefined;
      } else if (
        isNumberToken(primaryTokenNearEvent) &&
        state.originalPosition &&
        Vec.dist(state.originalPosition, event.position) < 10
      ) {
        // tap on token
        primaryTokenNearEvent.onTap();
      } else if (event.id === objects.scrubToken?.owner) {
        if (!objects.scrubToken.wasLocked) {
          objects.scrubToken.token.getVariable().unlock();
        }
        objects.scrubToken = undefined;
      }

      objects.dragToken = undefined;
      objects.touchedHandle = undefined;
      break;
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
    case 'ended':
      objects.touchedHandle = undefined;
      break;
  }
}
