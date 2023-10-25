import {aStrokeGroup} from "./ink/StrokeGroup.js";
import {GameObject} from "./GameObject.js";
import {MetaStruct} from "./meta/MetaSemantics.js";
export default class Page extends GameObject {
  constructor() {
    super();
    this.scope = new MetaStruct([]);
  }
  get strokeGroups() {
    return this.findAll({what: aStrokeGroup, recursive: false});
  }
  addStroke(stroke) {
    return this.adopt(stroke);
  }
  distanceToPoint(point) {
    return null;
  }
  render(dt, t) {
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
}
