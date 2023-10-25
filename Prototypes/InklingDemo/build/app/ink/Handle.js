import {GameObject, root} from "../GameObject.js";
import SVG from "../Svg.js";
import * as constraints from "../constraints.js";
import {generateId} from "../../lib/helpers.js";
import Vec from "../../lib/vec.js";
import {Constraint, Pin} from "../constraints.js";
import {TAU} from "../../lib/math.js";
export default class Handle extends GameObject {
  constructor(position) {
    super(root);
    this.id = generateId();
    this.backElm = SVG.add("g", SVG.handleElm, {class: "handle"});
    this.frontElm = SVG.add("g", SVG.constraintElm, {
      class: "handle"
    });
    this.xVariable = constraints.variable(0, {
      object: this,
      property: "x"
    });
    this.yVariable = constraints.variable(0, {
      object: this,
      property: "y"
    });
    this._canonicalHandle = this;
    this.absorbedHandles = new Set();
    this.position = position;
    SVG.add("circle", this.backElm, {r: 15});
    const arcs1 = SVG.add("g", this.frontElm, {class: "arcs1"});
    const arcs2 = SVG.add("g", this.frontElm, {class: "arcs2"});
    const arc = (angle = 0) => SVG.arcPath(Vec.zero, 14, angle, Math.PI / 10);
    SVG.add("path", arcs1, {d: arc(0 * TAU / 4)});
    SVG.add("path", arcs1, {d: arc(1 * TAU / 4)});
    SVG.add("path", arcs1, {d: arc(2 * TAU / 4)});
    SVG.add("path", arcs1, {d: arc(3 * TAU / 4)});
    SVG.add("path", arcs2, {d: arc(0 * TAU / 4)});
    SVG.add("path", arcs2, {d: arc(1 * TAU / 4)});
    SVG.add("path", arcs2, {d: arc(2 * TAU / 4)});
    SVG.add("path", arcs2, {d: arc(3 * TAU / 4)});
  }
  static create(position, getAbsorbed = true) {
    const handle = new Handle(position);
    if (getAbsorbed) {
      handle.getAbsorbedByNearestHandle();
    }
    return handle;
  }
  get x() {
    return this.xVariable.value;
  }
  get y() {
    return this.yVariable.value;
  }
  get position() {
    return this;
  }
  set position(pos) {
    ({x: this.xVariable.value, y: this.yVariable.value} = pos);
  }
  remove() {
    this.backElm.remove();
    this.frontElm.remove();
    if (!this.isCanonical) {
      this.canonicalInstance.breakOff(this);
    }
    this.xVariable.remove();
    this.yVariable.remove();
    super.remove();
  }
  absorb(that) {
    constraints.absorb(this, that);
  }
  getAbsorbedByNearestHandle() {
    const nearestHandle = this.page.find({
      what: aCanonicalHandle,
      near: this.position,
      that: (handle) => handle !== this
    });
    if (nearestHandle) {
      nearestHandle.absorb(this);
    }
  }
  get isCanonical() {
    return this._canonicalHandle === this;
  }
  get canonicalInstance() {
    return this._canonicalHandle;
  }
  set canonicalInstance(handle) {
    this._canonicalHandle = handle;
  }
  _absorb(that) {
    if (that === this) {
      return;
    }
    that.canonicalInstance.absorbedHandles.delete(that);
    for (const handle of that.absorbedHandles) {
      this._absorb(handle);
    }
    that.canonicalInstance = this;
    this.absorbedHandles.add(that);
  }
  _forgetAbsorbedHandles() {
    this.canonicalInstance = this;
    this.absorbedHandles.clear();
  }
  breakOff(handle) {
    if (this.absorbedHandles.has(handle)) {
      constraints.absorb(this, handle).remove();
    } else if (handle === this) {
      const absorbedHandles = [...this.absorbedHandles];
      const newCanonicalHandle = absorbedHandles.shift();
      constraints.absorb(this, newCanonicalHandle).remove();
      for (const absorbedHandle of absorbedHandles) {
        constraints.absorb(newCanonicalHandle, absorbedHandle);
      }
    } else {
      throw new Error("tried to break off a handle that was not absorbed");
    }
    return handle;
  }
  get hasPin() {
    for (const constraint of Constraint.all) {
      if (constraint instanceof Pin && constraint.handle.canonicalInstance === this.canonicalInstance) {
        return true;
      }
    }
    return false;
  }
  togglePin(doPin = !this.hasPin) {
    if (!this.isCanonical) {
      return this.canonicalInstance.togglePin(doPin);
    }
    for (const h of [this, ...this.absorbedHandles]) {
      if (doPin) {
        constraints.pin(h);
      } else {
        constraints.pin(h).remove();
      }
    }
  }
  render(t, dt) {
    const attrs = {
      transform: SVG.positionToTransform(this),
      "is-canonical": this.isCanonical,
      "has-pin": this.hasPin
    };
    SVG.update(this.backElm, attrs);
    SVG.update(this.frontElm, attrs);
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
  distanceToPoint(point) {
    return Vec.dist(this.position, point);
  }
  equals(that) {
    return this.xVariable.equals(that.xVariable) && this.yVariable.equals(that.yVariable);
  }
}
export const aHandle = (gameObj) => gameObj instanceof Handle ? gameObj : null;
export const aCanonicalHandle = (gameObj) => gameObj instanceof Handle && gameObj.isCanonical ? gameObj : null;
