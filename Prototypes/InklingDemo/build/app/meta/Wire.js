import {GameObject} from "../GameObject.js";
import SVG from "../Svg.js";
import Vec from "../../lib/vec.js";
import {distanceToPath} from "../../lib/helpers.js";
import Svg from "../Svg.js";
export class WirePort extends GameObject {
  constructor(position, value) {
    super();
    this.position = position;
    this.value = value;
  }
  distanceToPoint(point) {
    return null;
  }
  render(dt, t) {
  }
}
export default class Wire extends GameObject {
  constructor() {
    super(...arguments);
    this.points = [];
    this.connection = null;
    this.elm = SVG.add("polyline", SVG.wiresElm, {
      points: "",
      class: "wire"
    });
  }
  distanceToPoint(point) {
    return distanceToPath(point, this.points);
  }
  togglePaused(isPaused = !this.connection?.paused) {
    return this.connection?.togglePaused(isPaused);
  }
  render() {
    const a = this.a?.deref();
    const b = this.b?.deref();
    if (a) {
      this.points[0] = a.position;
    }
    if (b) {
      this.points[1] = b.position;
    }
    SVG.update(this.elm, {
      points: SVG.points(this.points),
      "is-paused": this.connection?.paused
    });
  }
  isCollapsable() {
    const [p1, p2] = this.points;
    return p1 && p2 && Vec.dist(p1, p2) < 10;
  }
  attachFront(element) {
    this.a = new WeakRef(element);
    this.updateConstraint();
  }
  attachEnd(element) {
    this.b = new WeakRef(element);
    this.updateConstraint();
  }
  updateConstraint() {
    const a = this.a?.deref();
    const b = this.b?.deref();
    if (a && b) {
      this.connection = a.value.wireTo(b.value);
      if (this.connection === null) {
        Svg.showStatus("You can't wire those things together silly billy");
        this.remove();
      }
    }
  }
  remove() {
    this.elm.remove();
    this.connection?.remove();
    super.remove();
  }
}
export const aWire = (g) => g instanceof Wire ? g : null;
