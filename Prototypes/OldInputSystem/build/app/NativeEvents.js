export default class Events {
  constructor() {
    this.events = [];
    this.setupNativeEventHandler();
  }
  clear() {
    this.events = [];
  }
  find(type, state, id) {
    return this.events.find((e) => e.type === type && e.state === state && (!id || e.id === id));
  }
  findAll(type, state, id) {
    return this.events.filter((e) => e.type === type && e.state === state && (!id || e.id === id));
  }
  findLast(type, state, id) {
    return this.events.findLast((e) => e.type === type && e.state === state && (!id || e.id === id));
  }
  setupNativeEventHandler() {
    window.nativeEvent = (state, touches) => {
      for (const id in touches) {
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
          this.events.push(event);
        }
      }
    };
  }
}
