import {generateId} from "../../lib/helpers.js";
import Vec from "../../lib/vec.js";
import SVG from "../Svg.js";
import * as constraints from "../constraints.js";
const SHOW_DEBUG_INFO = false;
const _Handle = class {
  constructor(instanceState) {
    this.instanceState = instanceState;
    this.listeners = new Set();
    if (instanceState.isCanonical) {
      _Handle.all.add(this);
    }
    _Handle.allInstances.add(this);
  }
  static create(type, position, listener = null) {
    const handle = new _Handle(this.makeCanonicalInstanceState(type, position));
    if (listener) {
      handle.addListener(listener);
    }
    handle.absorbNearbyHandles();
    return handle;
  }
  static makeCanonicalInstanceState(type, position, id = generateId()) {
    return {
      isCanonical: true,
      id,
      type,
      absorbedHandles: new Set(),
      position,
      elements: {
        normal: SVG.add("circle", type === "formal" ? {cx: 0, cy: 0, r: 3, fill: "black"} : {r: 5, fill: "rgba(100, 100, 100, .2)"}),
        selected: SVG.add("circle", {
          cx: 0,
          cy: 0,
          r: 7,
          fill: "none"
        }),
        label: SVG.add("text", {
          x: 0,
          y: 0,
          visibility: SHOW_DEBUG_INFO ? "visible" : "hidden",
          content: "?"
        })
      },
      isSelected: false,
      needsRerender: true,
      wasRemoved: false
    };
  }
  get id() {
    return !this.instanceState.isCanonical ? this.canonicalInstance.id : this.instanceState.id;
  }
  get ownId() {
    return this.instanceState.isCanonical ? this.instanceState.id : this.instanceState.origId;
  }
  get type() {
    return !this.instanceState.isCanonical ? this.canonicalInstance.type : this.instanceState.type;
  }
  get canonicalInstance() {
    return !this.instanceState.isCanonical ? this.instanceState.canonicalInstance : this;
  }
  get position() {
    return !this.instanceState.isCanonical ? this.canonicalInstance.position : this.instanceState.position;
  }
  set position(pos) {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.position = pos;
      return;
    }
    this.instanceState.position = pos;
    this.instanceState.needsRerender = true;
    this.notifyListeners((listener) => listener.onHandleMoved(this));
    this.notifyAbsorbedListeners((handle, listener) => listener.onHandleMoved(handle));
  }
  addListener(listener) {
    this.listeners.add(listener);
  }
  select() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.select();
      return;
    }
    this.instanceState.isSelected = true;
    this.instanceState.needsRerender = true;
  }
  deselect() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.deselect();
      return;
    }
    this.instanceState.isSelected = false;
    this.instanceState.needsRerender = true;
  }
  get isSelected() {
    return this.instanceState.isCanonical ? this.instanceState.isSelected : this.canonicalInstance.isSelected;
  }
  remove() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.remove();
      return;
    }
    this.removeFromDOM();
    _Handle.allInstances.delete(this);
    for (const handle of this.instanceState.absorbedHandles) {
      _Handle.allInstances.delete(handle);
    }
    _Handle.all.delete(this);
    this.instanceState.wasRemoved = true;
  }
  absorb(that) {
    if (!this.instanceState.isCanonical || !that.instanceState.isCanonical) {
      this.canonicalInstance.absorb(that.canonicalInstance);
      return;
    }
    if (this.instanceState.type !== that.instanceState.type) {
      throw new Error("handle type mismatch");
    }
    that.removeFromDOM();
    _Handle.all.delete(that);
    for (const handle of [that, ...that.instanceState.absorbedHandles]) {
      handle.instanceState = {
        isCanonical: false,
        canonicalInstance: this,
        origId: handle.ownId
      };
      this.instanceState.absorbedHandles.add(handle);
      handle.notifyListeners((listener) => listener.onHandleMoved(that));
    }
    constraints.onHandlesReconfigured();
  }
  absorbNearbyHandles() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.absorbNearbyHandles();
      return;
    }
    for (const that of _Handle.all) {
      if (that === this) {
        continue;
      }
      const dist = Vec.dist(this.position, that.position);
      if (dist < 10) {
        this.absorb(that);
      }
    }
  }
  get absorbedHandles() {
    if (!this.instanceState.isCanonical) {
      throw new Error("accessed absorbedHandles on absorbed handle");
    }
    return this.instanceState.absorbedHandles;
  }
  breakOff(handle, destination = null) {
    if (!this.instanceState.isCanonical) {
      throw new Error("called breakOff() on an absorbed handle");
    } else if (this.instanceState.absorbedHandles.size < 1) {
      throw new Error("called breakOff() on a singleton handle");
    }
    if (this === handle) {
      const absorbedHandles = Array.from(this.absorbedHandles);
      const newCanonicalInstance = absorbedHandles.pop();
      newCanonicalInstance.promoteToCanonical();
      while (absorbedHandles.length > 0) {
        const absorbedHandle = absorbedHandles.pop();
        this.breakOff(absorbedHandle, newCanonicalInstance);
      }
      destination?.absorb(this);
    } else if (this.absorbedHandles.has(handle)) {
      handle.promoteToCanonical();
      destination?.absorb(handle);
    } else {
      throw new Error("called breakOff(h) but h is unrelated to receiver");
    }
    constraints.onHandlesReconfigured();
  }
  render() {
    const state = this.instanceState;
    if (!state.isCanonical) {
      throw new Error("called render() on absorbed handle");
    }
    if (!state.needsRerender) {
      return;
    }
    SVG.update(state.elements.normal, {
      transform: `translate(${state.position.x} ${state.position.y})`
    });
    SVG.update(state.elements.selected, {
      transform: `translate(${state.position.x} ${state.position.y})`,
      fill: state.isSelected ? "rgba(180, 134, 255, 0.42)" : "none"
    });
    SVG.update(state.elements.label, {
      transform: `translate(${state.position.x - state.elements.label.getBBox().width / 2} ${state.position.y - 10})`,
      content: `${this.id}@(${Math.round(this.position.x)}, ${Math.round(this.position.y)})`
    });
    state.needsRerender = false;
  }
  removeFromDOM() {
    if (!this.instanceState.isCanonical) {
      throw new Error("called removeFromDOM() on absorbed handle");
    }
    this.instanceState.elements.normal.remove();
    this.instanceState.elements.selected.remove();
    this.instanceState.elements.label.remove();
  }
  notifyListeners(fn) {
    for (const listener of this.listeners) {
      fn(listener);
    }
  }
  notifyAbsorbedListeners(fn) {
    if (!this.instanceState.isCanonical) {
      throw new Error("called  notifyAbsorbedListeners() on absorbed handle");
    }
    for (const handle of this.absorbedHandles) {
      for (const listener of handle.listeners) {
        fn(handle, listener);
      }
    }
  }
  promoteToCanonical() {
    if (this.instanceState.isCanonical) {
      throw new Error("called promoteToCanonical() on canonical handle");
    }
    this.canonicalInstance.absorbedHandles.delete(this);
    this.instanceState = _Handle.makeCanonicalInstanceState(this.type, this.position, this.instanceState.origId);
    _Handle.all.add(this);
  }
};
let Handle = _Handle;
Handle.all = new Set();
Handle.allInstances = new Set();
export default Handle;
