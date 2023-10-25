import Vec from "../lib/vec.js";
import Config from "./Config.js";
const fingerMinDragDist = 10;
const pencilMinDragDist = 10;
const touchMaxAge = 15e3;
export default class Events {
  constructor(metaToggle, applyEvent) {
    this.metaToggle = metaToggle;
    this.applyEvent = applyEvent;
    this.events = [];
    this.pencilState = null;
    this.fingerStates = [];
    this.forcePseudo = 0;
    this.keymap = {};
    this.shortcuts = {
      Tab: () => {
        this.metaToggle.toggle();
      }
    };
    this.setupFallbackEvents();
    this.setupNativeEventHandler();
  }
  update() {
    for (const event of this.events) {
      let state;
      if (event.type === "finger") {
        switch (event.state) {
          case "began":
            state = this.fingerBegan(event);
            break;
          case "moved":
            state = this.fingerMoved(event);
            break;
          case "ended":
            state = this.fingerEnded(event);
            break;
        }
      } else {
        switch (event.state) {
          case "began":
            state = this.pencilBegan(event);
            break;
          case "moved":
            state = this.pencilMoved(event);
            break;
          case "ended":
            state = this.pencilEnded(event);
            break;
        }
      }
      state.lastUpdated = performance.now();
      this.applyEvent(event, state);
      if (this.pencilState?.down === false) {
        this.pencilState = null;
      }
      this.fingerStates = this.fingerStates.filter((state2) => state2.down);
    }
    this.events = [];
    if (Config.gesture.reapTouches) {
      this.fingerStates = this.fingerStates.filter(wasRecentlyUpdated);
      if (this.pencilState && !wasRecentlyUpdated(this.pencilState)) {
        this.pencilState = null;
      }
    }
  }
  mouseEvent(e, state) {
    this.events.push({
      position: {x: e.clientX, y: e.clientY},
      id: "-1",
      state,
      type: this.keymap.space ? "pencil" : "finger",
      timestamp: performance.now(),
      radius: 1,
      lastUpdated: performance.now(),
      altitude: 0,
      azimuth: 0,
      pressure: 1
    });
  }
  keyboardEvent(e, state) {
    const k = keyName(e);
    if (state === "began" && this.keymap[k]) {
      return;
    } else if (state === "began") {
      this.keymap[k] = true;
    } else {
      delete this.keymap[k];
    }
    this.forcePseudo = [
      this.keymap["1"],
      this.keymap["2"],
      this.keymap["3"],
      this.keymap["4"]
    ].lastIndexOf(true) + 1;
    if (state === "began") {
      if (this.shortcuts[k]) {
        this.shortcuts[k]();
        e.preventDefault();
      }
    }
  }
  setupFallbackEvents() {
    window.onmousedown = (e) => this.mouseEvent(e, "began");
    window.onmousemove = (e) => this.mouseEvent(e, "moved");
    window.onmouseup = (e) => this.mouseEvent(e, "ended");
    window.onkeydown = (e) => this.keyboardEvent(e, "began");
    window.onkeyup = (e) => this.keyboardEvent(e, "ended");
  }
  disableFallbackEvents() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
    window.onkeydown = null;
    window.onkeyup = null;
  }
  setupNativeEventHandler() {
    window.nativeEvent = (state, touches) => {
      this.disableFallbackEvents();
      if (state === "cancelled") {
        state = "ended";
      }
      const lastUpdated = performance.now();
      for (const id in touches) {
        for (const point of touches[id]) {
          const {type, timestamp, position, radius, pressure, altitude, azimuth} = point;
          const sharedProperties = {id, state, type, timestamp, position, radius, lastUpdated};
          const event = type === "finger" ? {...sharedProperties, type} : {...sharedProperties, type, pressure, altitude, azimuth};
          this.events.push(event);
        }
      }
    };
  }
  fingerBegan(event, down = true) {
    const state = {
      id: event.id,
      down,
      drag: false,
      dragDist: 0,
      position: event.position,
      originalPosition: event.position,
      event,
      lastUpdated: 0
    };
    this.fingerStates.push(state);
    return state;
  }
  pencilBegan(event, down = true) {
    this.pencilState = {
      down,
      drag: false,
      dragDist: 0,
      position: event.position,
      originalPosition: event.position,
      event,
      lastUpdated: 0
    };
    return this.pencilState;
  }
  fingerMoved(event) {
    let state = this.fingerStates.find((state2) => state2.id === event.id);
    if (!state) {
      state = this.fingerBegan(event, false);
    }
    state.dragDist = Vec.dist(event.position, state.originalPosition);
    state.drag || (state.drag = state.dragDist > fingerMinDragDist);
    state.position = event.position;
    state.event = event;
    return state;
  }
  pencilMoved(event) {
    let state = this.pencilState;
    if (!state) {
      state = this.pencilBegan(event, false);
    }
    state.dragDist = Vec.dist(event.position, state.originalPosition);
    state.drag || (state.drag = state.dragDist > pencilMinDragDist);
    state.position = event.position;
    state.event = event;
    return state;
  }
  fingerEnded(event) {
    let state = this.fingerStates.find((state2) => state2.id === event.id);
    if (!state) {
      state = this.fingerBegan(event, false);
    }
    state.down = false;
    state.event = event;
    return state;
  }
  pencilEnded(event) {
    let state = this.pencilState;
    if (!state) {
      state = this.pencilBegan(event), false;
    }
    state.down = false;
    state.event = event;
    return state;
  }
}
export function getPositionWithPressure(event) {
  return {...event.position, pressure: event.pressure};
}
export function wasRecentlyUpdated(thing) {
  const recentlyUpdated = thing.lastUpdated + touchMaxAge > performance.now();
  if (!recentlyUpdated) {
    console.log("TELL IVAN YOU SAW THIS");
  }
  return recentlyUpdated;
}
function keyName(e) {
  return e.key.replace(" ", "space");
}
