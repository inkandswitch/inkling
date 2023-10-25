import {
  closeFormulaEditor,
  pencilFormulaEditor,
  tapFormulaLabel
} from "./gestures/FormulaEditor.js";
import {wasRecentlyUpdated} from "./NativeEvents.js";
import {Gesture} from "./gestures/Gesture.js";
import {touchHandle} from "./gestures/Handle.js";
import {touchMetaToggle} from "./gestures/MetaToggle.js";
import {touchToken, scrubNumberToken} from "./gestures/Token.js";
import {drawInk} from "./gestures/DrawInk.js";
import {createWire} from "./gestures/CreateWire.js";
import {tapPropertyPicker} from "./gestures/PropertyPicker.js";
import SVG from "./Svg.js";
import {createGizmo} from "./gestures/CreateGizmo.js";
import {touchGizmo} from "./gestures/Gizmo.js";
import Config from "./Config.js";
import {erase} from "./gestures/Erase.js";
import {toggleHandles} from "./gestures/ToggleHandles.js";
import {toggleWire} from "./gestures/ToggleWire.js";
import {createFormula} from "./gestures/CreateFormula.js";
const gestureCreators = {
  finger: [
    closeFormulaEditor,
    scrubNumberToken,
    tapPropertyPicker,
    touchToken,
    touchHandle,
    touchMetaToggle,
    touchGizmo,
    toggleWire,
    toggleHandles
  ],
  pencil: [
    erase,
    createGizmo,
    tapPropertyPicker,
    tapFormulaLabel,
    pencilFormulaEditor,
    createWire,
    createFormula,
    drawInk
  ]
};
const pseudoTouches = {};
const gesturesByTouchId = {};
export function applyEvent(ctx) {
  if (Config.gesture.reapTouches) {
    for (const id in pseudoTouches) {
      if (!wasRecentlyUpdated(pseudoTouches[id])) {
        delete pseudoTouches[id];
      }
    }
    for (const id in gesturesByTouchId) {
      if (!wasRecentlyUpdated(gesturesByTouchId[id])) {
        delete gesturesByTouchId[id];
      }
    }
  }
  if (pseudoTouches[ctx.event.id]) {
    if (ctx.event.state === "ended") {
      delete pseudoTouches[ctx.event.id];
    } else {
      pseudoTouches[ctx.event.id] = ctx.event;
    }
    return;
  }
  ctx.pseudoTouches = pseudoTouches;
  ctx.pseudoCount = Object.keys(pseudoTouches).length + ctx.events.forcePseudo;
  ctx.pseudo = ctx.pseudoCount > 0;
  const gestureForTouch = gesturesByTouchId[ctx.event.id];
  if (gestureForTouch) {
    runGesture(gestureForTouch, ctx);
    if (ctx.event.state === "ended") {
      delete gesturesByTouchId[ctx.event.id];
    }
    return;
  }
  if (ctx.event.state !== "began") {
    return;
  }
  for (const id in gesturesByTouchId) {
    const gesture = gesturesByTouchId[id];
    if (gesture.claimsTouch(ctx)) {
      gesturesByTouchId[ctx.event.id] = gesture;
      runGesture(gesture, ctx);
      return;
    }
  }
  for (const gestureCreator of gestureCreators[ctx.event.type]) {
    const gesture = gestureCreator(ctx);
    if (gesture) {
      gesturesByTouchId[ctx.event.id] = gesture;
      runGesture(gesture, ctx);
      return;
    }
  }
  if (ctx.event.type === "finger") {
    pseudoTouches[ctx.event.id] = ctx.event;
    return;
  }
}
function runGesture(gesture, ctx) {
  const result = gesture.applyEvent(ctx);
  if (result instanceof Gesture) {
    for (const id in gesturesByTouchId) {
      if (gesturesByTouchId[id] === gesture) {
        gesturesByTouchId[id] = result;
      }
    }
    runGesture(result, ctx);
  }
}
export function render() {
  for (const id in gesturesByTouchId) {
    gesturesByTouchId[id].render();
  }
  if (Config.gesture.debugVisualization) {
    for (const id in gesturesByTouchId) {
      gesturesByTouchId[id].debugRender();
    }
    for (const id in pseudoTouches) {
      const event = pseudoTouches[id];
      SVG.now("circle", {
        class: "pseudo-touch",
        cx: event.position.x,
        cy: event.position.y,
        r: 8
      });
    }
  }
}
