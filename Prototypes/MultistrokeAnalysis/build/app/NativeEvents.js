export default class Events {
  constructor() {
    this.events = [];
    this.setupNativeEventHandler();
  }
  clear() {
    this.events = [];
  }
  add(event) {
    this.events.push(event);
  }
  did(type, state, id) {
    return this.events.find((e) => e.type === type && e.state === state && (id == null || e.id === id));
  }
  didAll(type, state, id) {
    return this.events.filter((e) => e.type === type && e.state === state && (id == null || e.id === id));
  }
  didLast(type, state, id) {
    return this.events.findLast((e) => e.type === type && e.state === state && (id == null || e.id === id));
  }
  setupNativeEventHandler() {
    window.nativeEvent = (state, touches) => {
      for (const id in touches) {
        if (!touches.hasOwnProperty(id)) {
          continue;
        }
        for (const point of touches[id]) {
          const {type, timestamp, radius, force, altitude, azimuth, x, y} = point;
          const sharedProperties = {
            state,
            id,
            position: {x, y},
            timestamp,
            radius
          };
          const event = type === "finger" ? {
            type: "finger",
            ...sharedProperties
          } : {
            type: "pencil",
            pressure: force,
            altitude,
            azimuth,
            ...sharedProperties
          };
          this.add(event);
        }
      }
    };
  }
}
