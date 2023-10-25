import SVG from "../Svg.js";
export class Gesture {
  constructor(label, api) {
    this.label = label;
    this.api = api;
    this.lastUpdated = 0;
    this.touches = {};
  }
  claimsTouch(ctx) {
    const typeIsPencil = ctx.event.type === "pencil";
    const typeIsFinger = ctx.event.type === "finger";
    const oneFinger = ctx.events.fingerStates.length === 1;
    const typeMatchesClaim = this.api.claim === ctx.event.type;
    const claimIsFingers = this.api.claim === "fingers";
    if (typeMatchesClaim && typeIsPencil) {
      return true;
    }
    if (typeMatchesClaim && typeIsFinger && oneFinger) {
      return true;
    }
    if (typeIsFinger && claimIsFingers) {
      return true;
    }
    if (this.api.claim instanceof Function) {
      return this.api.claim(ctx);
    }
    return false;
  }
  applyEvent(ctx) {
    this.lastUpdated = performance.now();
    let eventHandlerName = ctx.event.state;
    if (eventHandlerName === "moved" && ctx.state.drag && this.api.dragged) {
      eventHandlerName = "dragged";
    }
    const result = this.api[eventHandlerName]?.call(this, ctx);
    if (ctx.event.state !== "ended") {
      this.touches[ctx.event.id] = ctx.event;
    } else {
      delete this.touches[ctx.event.id];
      if (Object.keys(this.touches).length === 0) {
        this.api.done?.call(this);
      }
    }
    return result;
  }
  render() {
    this.api.render?.call(this);
  }
  debugRender() {
    for (const id in this.touches) {
      const event = this.touches[id];
      const elm = SVG.now("g", {
        class: "gesture",
        transform: SVG.positionToTransform(event.position)
      });
      SVG.add("circle", elm, {r: event.type === "pencil" ? 2 : 8});
      SVG.add("text", elm, {content: this.label});
    }
  }
}
