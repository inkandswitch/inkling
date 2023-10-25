import {forDebugging} from "../lib/helpers.js";
import Page from "./Page.js";
import SVG from "./Svg.js";
const DEFAULT_TOO_FAR = 20;
export class GameObject {
  constructor(parent) {
    this.maxHp = 0;
    this.hp = this.maxHp;
    this.parent = null;
    this.children = new Set();
    if (parent) {
      parent.adopt(this);
    }
  }
  get page() {
    let p = this.parent;
    while (p) {
      if (p instanceof Page) {
        return p;
      }
      p = p.parent;
    }
    return this.root.page;
  }
  get root() {
    let p = this;
    while (p.parent) {
      p = p.parent;
    }
    return p;
  }
  adopt(child) {
    child.parent?.children.delete(child);
    this.children.add(child);
    child.parent = this;
    return child;
  }
  remove() {
    this.parent?.children.delete(this);
    this.parent = null;
  }
  removeChild(child) {
    if (!this.children.has(child)) {
      throw new Error("GameObject.removeChild() called w/ non-child argument!");
    }
    child.remove();
  }
  find(options) {
    const {
      what,
      that,
      recursive,
      near: pos,
      tooFar = DEFAULT_TOO_FAR
    } = options;
    let nearestDist = tooFar;
    let ans = null;
    this.forEach({
      what,
      that,
      recursive,
      do(gameObj) {
        if (pos) {
          const dist = gameObj.distanceToPoint(pos);
          if (dist !== null && dist <= nearestDist) {
            ans = gameObj;
            nearestDist = dist;
          }
        } else {
          if (ans === null) {
            ans = gameObj;
          }
        }
      }
    });
    return ans;
  }
  findAll(options) {
    const ans = [];
    this.forEach({
      ...options,
      do(gameObj) {
        ans.push(gameObj);
      }
    });
    return ans;
  }
  forEach(options) {
    const {
      what,
      that,
      recursive = true,
      near: pos,
      tooFar = DEFAULT_TOO_FAR,
      do: doFn
    } = options;
    for (const gameObj of this.children) {
      if (recursive) {
        gameObj.forEach(options);
      }
      const narrowedGameObj = what(gameObj);
      if (!narrowedGameObj || that && !that(narrowedGameObj)) {
        continue;
      }
      if (pos) {
        const dist = narrowedGameObj.distanceToPoint(pos);
        if (dist === null || dist >= tooFar) {
          continue;
        }
      }
      doFn.call(this, narrowedGameObj);
    }
  }
  bringToFront() {
    for (const obj of Object.values(this)) {
      if (obj instanceof SVGElement) {
        SVG.bringToFront(obj);
      }
    }
  }
}
export const aGameObject = (gameObj) => gameObj;
export const root = new class extends GameObject {
  constructor() {
    super(...arguments);
    this.currentPage = null;
  }
  get page() {
    return this.currentPage;
  }
  distanceToPoint(point) {
    return null;
  }
  render(dt, t) {
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
}();
forDebugging("root", root);
