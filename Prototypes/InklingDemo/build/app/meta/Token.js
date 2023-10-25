import {GameObject} from "../GameObject.js";
import {signedDistanceToBox} from "../../lib/SignedDistance.js";
import Vec from "../../lib/vec.js";
export default class Token extends GameObject {
  constructor(source) {
    super();
    this.source = source;
    this.position = {x: 100, y: 100};
    this.width = 90;
    this.height = 30;
    this.embedded = false;
    this.hidden = false;
    this.editing = false;
  }
  distanceToPoint(pos) {
    return signedDistanceToBox(this.position.x, this.position.y, this.width, this.height, pos.x, pos.y);
  }
  midPoint() {
    return Vec.add(this.position, Vec.mulS(Vec(this.width, this.height), 0.5));
  }
  render(dt, t) {
  }
}
export const aToken = (gameObj) => gameObj instanceof Token ? gameObj : null;
export const aPrimaryToken = (gameObj) => gameObj instanceof Token && gameObj.isPrimary() ? gameObj : null;
