// lib/math.js
var TAU = Math.PI * 2;
var isZero = (v) => Number.EPSILON > Math.abs(v);
var clip = (v, min = 0, max = 1) => Math.max(min, Math.min(v, max));
var lerpN = (input, outputMin = 0, outputMax = 1, doClip = false) => {
  let output = input * (outputMax - outputMin) + outputMin;
  if (doClip) {
    output = clip(output, outputMin, outputMax);
  }
  return output;
};
var lerp = (i, im = 0, iM = 1, om = 0, oM = 1, doClip = true) => {
  if (im === iM) {
    return om;
  }
  if (im > iM) {
    [im, iM, om, oM] = [iM, im, oM, om];
  }
  if (doClip) {
    i = clip(i, im, iM);
  }
  i -= im;
  i /= iM - im;
  return lerpN(i, om, oM, false);
};
var rand = (min = -1, max = 1) => lerpN(Math.random(), min, max);
var roundTo = (input, precision) => {
  const p = 1 / precision;
  return Math.round(input * p) / p;
};

// lib/vec.js
var Vec = (x = 0, y = 0) => ({x, y});
var vec_default = Vec;
Vec.clone = (v) => Vec(v.x, v.y);
Vec.fromRectXY = (r) => Vec(r.x, r.y);
Vec.fromRectWH = (r) => Vec(r.w, r.h);
Vec.fromRectRB = (r) => Vec(r.x + r.w, r.y + r.h);
Vec.of = (s) => Vec(s, s);
Vec.random = (scale = 1) => Vec.Smul(scale, Vec.complement(Vec.Smul(2, Vec(Math.random(), Math.random()))));
Vec.toA = (v) => [v.x, v.y];
Vec.polar = (angle, length) => Vec(length * Math.cos(angle), length * Math.sin(angle));
Vec.x = Object.freeze(Vec(1));
Vec.y = Object.freeze(Vec(0, 1));
Vec.zero = Object.freeze(Vec());
Vec.map = (f, v) => Vec(f(v.x), f(v.y));
Vec.map2 = (f, a, b) => Vec(f(a.x, b.x), f(a.y, b.y));
Vec.reduce = (f, v) => f(v.x, v.y);
Vec.cross = (a, b) => a.x * b.y - a.y * b.x;
Vec.project = (a, b) => Vec.mulS(b, Vec.dot(a, b) / Vec.len2(b));
Vec.reject = (a, b) => Vec.sub(a, Vec.project(a, b));
Vec.scalarProjection = (p, a, b) => {
  const ap = Vec.sub(p, a);
  const ab = Vec.normalize(Vec.sub(b, a));
  const f = Vec.mulS(ab, Vec.dot(ap, ab));
  return Vec.add(a, f);
};
Vec.add = (a, b) => Vec(a.x + b.x, a.y + b.y);
Vec.div = (a, b) => Vec(a.x / b.x, a.y / b.y);
Vec.mul = (a, b) => Vec(a.x * b.x, a.y * b.y);
Vec.sub = (a, b) => Vec(a.x - b.x, a.y - b.y);
Vec.addS = (v, s) => Vec.add(v, Vec.of(s));
Vec.divS = (v, s) => Vec.div(v, Vec.of(s));
Vec.mulS = (v, s) => Vec.mul(v, Vec.of(s));
Vec.subS = (v, s) => Vec.sub(v, Vec.of(s));
Vec.Sadd = (s, v) => Vec.add(Vec.of(s), v);
Vec.Sdiv = (s, v) => Vec.div(Vec.of(s), v);
Vec.Smul = (s, v) => Vec.mul(Vec.of(s), v);
Vec.Ssub = (s, v) => Vec.sub(Vec.of(s), v);
Vec.dist = (a, b) => Vec.len(Vec.sub(a, b));
Vec.dist2 = (a, b) => Vec.len2(Vec.sub(a, b));
Vec.dot = (a, b) => a.x * b.x + a.y * b.y;
Vec.equal = (a, b) => isZero(Vec.dist2(a, b));
Vec.len2 = (v) => Vec.dot(v, v);
Vec.len = (v) => Math.sqrt(Vec.dot(v, v));
Vec.ceil = (v) => Vec.map(Math.ceil, v);
Vec.floor = (v) => Vec.map(Math.floor, v);
Vec.round = (v) => Vec.map(Math.round, v);
Vec.roundTo = (v, s) => Vec.map2(roundTo, v, Vec.of(s));
Vec.complement = (v) => Vec.Ssub(1, v);
Vec.half = (v) => Vec.divS(v, 2);
Vec.normalize = (v) => Vec.divS(v, Vec.len(v));
Vec.recip = (v) => Vec.Sdiv(1, v);
Vec.renormalize = (v, length) => Vec.Smul(length, Vec.normalize(v));
Vec.avg = (a, b) => Vec.half(Vec.add(a, b));
Vec.lerp = (a, b, t) => Vec.add(a, Vec.Smul(t, Vec.sub(b, a)));
Vec.max = (a, b) => Vec.map2(Math.max, a, b);
Vec.min = (a, b) => Vec.map2(Math.min, a, b);
Vec.abs = (v) => Vec.map(Math.abs, v);
Vec.invert = (v) => Vec(-v.x, -v.y);
Vec.invertX = (v) => Vec(-v.x, v.y);
Vec.invertY = (v) => Vec(v.x, -v.y);
Vec.rotate90CW = (v) => Vec(v.y, -v.x);
Vec.rotate90CCW = (v) => Vec(-v.y, v.x);
Vec.rotate = (v, angle) => Vec(v.x * Math.cos(angle) - v.y * Math.sin(angle), v.x * Math.sin(angle) + v.y * Math.cos(angle));
Vec.rotateAround = (vector, point, angle) => {
  const translatedVector = Vec.sub(vector, point);
  const rotatedVector = Vec.rotate(translatedVector, angle);
  return Vec.add(rotatedVector, point);
};
Vec.angle = (v) => Math.atan2(v.y, v.x);
Vec.angleBetween = (a, b) => {
  const dotProduct = Vec.dot(a, b);
  const magnitudeA = Vec.len(a);
  const magnitudeB = Vec.len(b);
  const angleInRadians = Math.acos(dotProduct / (magnitudeA * magnitudeB));
  return angleInRadians;
};
Vec.angleBetweenClockwise = (a, b) => {
  const dP = Vec.dot(a, b);
  const cP = Vec.cross(a, b);
  const angleInRadians = Math.atan2(cP, dP);
  return angleInRadians;
};
Vec.update = (dest, src) => {
  dest.x = src.x;
  dest.y = src.y;
};

// app/Config.js
var Config_default = {
  gesture: {
    debugVisualization: false,
    reapTouches: false,
    lookAt: false
  }
};

// app/NativeEvents.js
var fingerMinDragDist = 10;
var pencilMinDragDist = 10;
var touchMaxAge = 15e3;
var Events = class {
  constructor(metaToggle2, applyEvent2) {
    this.metaToggle = metaToggle2;
    this.applyEvent = applyEvent2;
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
    if (Config_default.gesture.reapTouches) {
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
          const {type, timestamp, position, radius: radius2, pressure, altitude, azimuth} = point;
          const sharedProperties = {id, state, type, timestamp, position, radius: radius2, lastUpdated};
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
    state.dragDist = vec_default.dist(event.position, state.originalPosition);
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
    state.dragDist = vec_default.dist(event.position, state.originalPosition);
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
};
var NativeEvents_default = Events;
function wasRecentlyUpdated(thing) {
  const recentlyUpdated = thing.lastUpdated + touchMaxAge > performance.now();
  if (!recentlyUpdated) {
    console.log("TELL IVAN YOU SAW THIS");
  }
  return recentlyUpdated;
}
function keyName(e) {
  return e.key.replace(" ", "space");
}

// app/Svg.js
var NS = "http://www.w3.org/2000/svg";
var gizmoElm = document.querySelector("#gizmo");
var handleElm = document.querySelector("#handle");
var inkElm = document.querySelector("#ink");
var constraintElm = document.querySelector("#constraint");
var boxElm = document.querySelector("#box");
var wiresElm = document.querySelector("#wires");
var metaElm = document.querySelector("#meta");
var labelElm = document.querySelector("#label");
var guiElm = document.querySelector("#gui");
var nowElm = document.querySelector("#now");
function add(type, parent, attributes = {}) {
  return parent.appendChild(update(document.createElementNS(NS, type), attributes));
}
function bringToFront(element) {
  const parent = element.parentNode;
  if (parent) {
    element.remove();
    parent.appendChild(element);
  }
}
function update(elm, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    const cache = elm.__cache || (elm.__cache = {});
    if (cache[key] === value) {
      return;
    }
    cache[key] = value;
    const boolish = typeof value === "boolean" || value === null || value === void 0;
    if (key === "content") {
      elm.innerHTML = "" + value;
    } else if (boolish) {
      value ? elm.setAttribute(key, "") : elm.removeAttribute(key);
    } else {
      elm.setAttribute(key, "" + value);
    }
  });
  return elm;
}
var lastTime = 0;
function now(type, attributes) {
  const life = +(attributes.life || 0);
  delete attributes.life;
  const elm = add(type, nowElm, attributes);
  elm.__expiry = lastTime + life;
  return elm;
}
function clearNow(currentTime = Infinity) {
  if (isFinite(currentTime)) {
    lastTime = currentTime;
  }
  for (const elm of Array.from(nowElm.children)) {
    const expiry = elm.__expiry || 0;
    if (currentTime > expiry) {
      elm.remove();
    }
  }
}
function points(...positions) {
  return positions.flat().map(positionToPointsString).join(" ");
}
function positionToPointsString(p) {
  return p.x + " " + p.y;
}
function positionToTransform(p) {
  return `translate(${p.x} ${p.y})`;
}
function arcPath(center, radius2, angle, rotation, mirror = true) {
  rotation = clip(rotation, -Math.PI, Math.PI);
  const S = vec_default.add(center, vec_default.polar(angle, radius2));
  let path2 = "";
  if (mirror) {
    const B = vec_default.add(center, vec_default.polar(angle - rotation, radius2));
    path2 += `M ${B.x}, ${B.y} A ${radius2},${radius2} 0 0,1 ${S.x}, ${S.y}`;
  } else {
    path2 += `M ${S.x}, ${S.y}`;
  }
  const A = vec_default.add(center, vec_default.polar(angle + rotation, radius2));
  path2 += `A ${radius2},${radius2} 0 0,1 ${A.x}, ${A.y}`;
  return path2;
}
function path(points2) {
  return points2.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}
var statusElement = add("text", guiElm, {class: "status-text"});
var statusHideTimeMillis = 0;
function showStatus(content, time = 3e3) {
  update(statusElement, {content, "is-visible": true});
  statusHideTimeMillis = performance.now() + time;
  setTimeout(() => {
    if (performance.now() >= statusHideTimeMillis) {
      update(statusElement, {"is-visible": false});
    }
  }, time);
}
var Svg_default = {
  add,
  update,
  bringToFront,
  now,
  clearNow,
  points,
  positionToTransform,
  arcPath,
  path,
  showStatus,
  gizmoElm,
  handleElm,
  inkElm,
  constraintElm,
  boxElm,
  wiresElm,
  metaElm,
  labelElm,
  guiElm
};

// lib/line.js
function Line(a, b) {
  return {a, b};
}
var line_default = Line;
Line.len = (l) => vec_default.dist(l.a, l.b);
Line.directionVec = (l) => vec_default.normalize(vec_default.sub(l.b, l.a));
Line.intersect = (l1, l2) => {
  const {a: p1, b: p2} = l1;
  const {a: q1, b: q2} = l2;
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = q2.x - q1.x;
  const dy2 = q2.y - q1.y;
  const determinant = dx1 * dy2 - dy1 * dx2;
  if (determinant === 0) {
    return null;
  }
  const dx3 = p1.x - q1.x;
  const dy3 = p1.y - q1.y;
  const t = (dx3 * dy2 - dy3 * dx2) / determinant;
  const u = (dx1 * dy3 - dy1 * dx3) / determinant;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    const intersectionX = p1.x + t * dx1;
    const intersectionY = p1.y + t * dy1;
    return {x: intersectionX, y: intersectionY};
  }
  return null;
};
Line.intersectAnywhere = (l1, l2) => {
  const {a: p1, b: p2} = l1;
  const {a: q1, b: q2} = l2;
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = q2.x - q1.x;
  const dy2 = q2.y - q1.y;
  const determinant = dx1 * dy2 - dy1 * dx2;
  if (determinant === 0) {
    return null;
  }
  const dx3 = p1.x - q1.x;
  const dy3 = p1.y - q1.y;
  const t = (dx3 * dy2 - dy3 * dx2) / determinant;
  const intersectionX = p1.x + t * dx1;
  const intersectionY = p1.y + t * dy1;
  return {x: intersectionX, y: intersectionY};
};
Line.getYforX = (line, x) => {
  const {a, b} = line;
  const {x: x1, y: y1} = a;
  const {x: x2, y: y2} = b;
  const slope = (y2 - y1) / (x2 - x1);
  const y = slope * (x - x1) + y1;
  return y;
};
Line.getXforY = (line, y) => {
  const {a, b} = line;
  const {x: x1, y: y1} = a;
  const {x: x2, y: y2} = b;
  const slope = (y2 - y1) / (x2 - x1);
  const x = (y - y1) / slope + x1;
  return x;
};
Line.distToPoint = (line, point) => vec_default.dist(point, Line.closestPoint(line, point));
Line.closestPoint = (line, point, strict = true) => {
  const {a, b} = line;
  const AB = vec_default.sub(b, a);
  const AP = vec_default.sub(point, a);
  if (isZero(AB.x) && isZero(AB.y)) {
    return a;
  }
  const projection = vec_default.dot(AP, AB) / vec_default.dot(AB, AB);
  if (strict && projection <= 0) {
    return a;
  } else if (strict && projection >= 1) {
    return b;
  } else {
    return vec_default.add(a, vec_default.mulS(AB, projection));
  }
};
Line.spreadPointsAlong = (line, n) => {
  const segLength = Line.len(line) / n;
  const offsetSeg = vec_default.mulS(Line.directionVec(line), segLength);
  const points2 = [];
  for (let i = 0; i < n; i++) {
    points2.push(vec_default.add(line.a, vec_default.mulS(offsetSeg, i)));
  }
  return points2;
};

// lib/helpers.js
function forDebugging(property, valueOrValueFn) {
  let value;
  if (typeof valueOrValueFn === "function") {
    const valueFn = valueOrValueFn;
    const oldValue = window[property];
    value = valueFn(oldValue);
  } else {
    value = valueOrValueFn;
  }
  window[property] = value;
}
var nextId = 0;
function generateId() {
  return nextId++;
}
function onEveryFrame(update3) {
  const updatesPerSecond = 60;
  window.timeScale || (window.timeScale = 1);
  let lastRafTime;
  let accumulatedTime = 0;
  let elapsedUpdates = 0;
  const secondsPerUpdate = 1 / updatesPerSecond;
  function frame(ms) {
    const currentRafTime = ms / 1e3;
    const deltaRafTime = currentRafTime - lastRafTime;
    accumulatedTime += deltaRafTime * window.timeScale;
    while (accumulatedTime > secondsPerUpdate) {
      accumulatedTime -= secondsPerUpdate;
      elapsedUpdates++;
      update3(secondsPerUpdate, elapsedUpdates * secondsPerUpdate);
    }
    lastRafTime = currentRafTime;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((ms) => {
    lastRafTime = ms / 1e3;
    requestAnimationFrame(frame);
  });
}
function farthestPair(points2) {
  let maxDist = -Infinity;
  let mdp1 = null;
  let mdp2 = null;
  for (const p1 of points2) {
    for (const p2 of points2) {
      const d = vec_default.dist(p1, p2);
      if (d > maxDist) {
        mdp1 = p1;
        mdp2 = p2;
        maxDist = d;
      }
    }
  }
  return [mdp1, mdp2];
}
var SortedSet = class {
  constructor(items = []) {
    this.items = items;
  }
  static fromSet(set) {
    return new SortedSet(Array.from(set));
  }
  add(item) {
    for (const o of this.items) {
      if (o === item) {
        return;
      }
    }
    this.items.push(item);
  }
  moveItemToFront(item) {
    const oldIndex = this.items.indexOf(item);
    if (oldIndex === -1) {
      return;
    }
    const oldItem = this.items.splice(oldIndex, 1)[0];
    this.items.unshift(oldItem);
  }
  get(index) {
    return this.items[index];
  }
  size() {
    return this.items.length;
  }
  [Symbol.iterator]() {
    let index = -1;
    const data = this.items;
    return {
      next: () => ({value: data[++index], done: !(index in data)})
    };
  }
};
var sets = {
  overlap(s1, s2) {
    for (const x of s1) {
      if (s2.has(x)) {
        return true;
      }
    }
    return false;
  },
  union(s1, s2) {
    return new Set([...s1, ...s2]);
  },
  map(s, fn) {
    return new Set([...s].map(fn));
  }
};
function distanceToPath(pos, points2) {
  switch (points2.length) {
    case 0:
      return null;
    case 1:
      return vec_default.dist(pos, points2[0]);
    default: {
      let minDist = Infinity;
      for (let idx = 0; idx < points2.length - 1; idx++) {
        const p1 = points2[idx];
        const p2 = points2[idx + 1];
        minDist = Math.min(minDist, line_default.distToPoint(line_default(p1, p2), pos));
      }
      return minDist;
    }
  }
}

// app/GameObject.js
var DEFAULT_TOO_FAR = 20;
var GameObject = class {
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
      if (p instanceof Page_default) {
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
        Svg_default.bringToFront(obj);
      }
    }
  }
};
var aGameObject = (gameObj) => gameObj;
var root = new class extends GameObject {
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

// lib/rect.js
function Rect(position, width, height) {
  return {position, width, height};
}
var rect_default = Rect;
Rect.isPointInside = (rect, point) => {
  return point.x > rect.position.x && point.y > rect.position.y && point.x < rect.position.x + rect.width && point.y < rect.position.y + rect.height;
};
Rect.closestPointOnPerimeter = (rect, point) => {
  const {position, width, height} = rect;
  const {x, y} = position;
  const {x: px, y: py} = point;
  const leftDist = Math.abs(px - x);
  const rightDist = Math.abs(px - (x + width));
  const topDist = Math.abs(py - y);
  const bottomDist = Math.abs(py - (y + height));
  const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
  if (minDist === leftDist) {
    return {x, y: py};
  } else if (minDist === rightDist) {
    return {x: x + width, y: py};
  } else if (minDist === topDist) {
    return {x: px, y};
  } else {
    return {x: px, y: y + height};
  }
};

// app/ink/Stroke.js
var Stroke = class extends GameObject {
  constructor() {
    super(...arguments);
    this.points = [];
    this.element = Svg_default.add("polyline", Svg_default.inkElm, {
      class: "stroke"
    });
  }
  updatePath(newPoints) {
    this.points = newPoints;
  }
  render() {
    Svg_default.update(this.element, {
      points: Svg_default.points(this.points)
    });
  }
  becomeGroup() {
    return this.parent?.adopt(new StrokeGroup_default(new Set([this])));
  }
  distanceToPoint(point) {
    return distanceToPath(point, this.points);
  }
  overlapsRect(rect) {
    for (const point of this.points) {
      if (rect_default.isPointInside(rect, point)) {
        return true;
      }
    }
    return false;
  }
  remove() {
    this.element.remove();
    super.remove();
  }
};
var Stroke_default = Stroke;
var aStroke = (gameObj) => gameObj instanceof Stroke ? gameObj : null;

// lib/g9.js
function norm2(x) {
  return Math.sqrt(x.reduce((a, b) => a + b * b, 0));
}
function identity(n) {
  const ret = Array(n);
  for (let i = 0; i < n; i++) {
    ret[i] = Array(n);
    for (let j = 0; j < n; j++) {
      ret[i][j] = +(i == j);
    }
  }
  return ret;
}
function neg(x) {
  return x.map((a) => -a);
}
function dot(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((x) => dot(x, b));
  }
  return a.reduce((x, y, i) => x + y * b[i], 0);
}
function sub(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((c, i) => sub(c, b[i]));
  }
  return a.map((c, i) => c - b[i]);
}
function add2(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((c, i) => add2(c, b[i]));
  }
  return a.map((c, i) => c + b[i]);
}
function div(a, b) {
  return a.map((c) => c.map((d) => d / b));
}
function mul(a, b) {
  if (typeof a[0] !== "number") {
    return a.map((c) => mul(c, b));
  }
  return a.map((c) => c * b);
}
function ten(a, b) {
  return a.map((c, i) => mul(b, c));
}
function gradient(f, x) {
  const dim = x.length, f1 = f(x);
  if (isNaN(f1)) {
    throw new Error("The gradient at [" + x.join(" ") + "] is NaN!");
  }
  const {max, abs, min} = Math;
  const tempX = x.slice(0), grad = Array(dim);
  for (let i = 0; i < dim; i++) {
    let delta = max(1e-6 * f1, 1e-8);
    for (let k = 0; ; k++) {
      if (k == 20) {
        throw new Error("Gradient failed at index " + i + " of [" + x.join(" ") + "]");
      }
      tempX[i] = x[i] + delta;
      const f0 = f(tempX);
      tempX[i] = x[i] - delta;
      const f2 = f(tempX);
      tempX[i] = x[i];
      if (!(isNaN(f0) || isNaN(f2))) {
        grad[i] = (f0 - f2) / (2 * delta);
        const t0 = x[i] - delta;
        const t1 = x[i];
        const t2 = x[i] + delta;
        const d1 = (f0 - f1) / delta;
        const d2 = (f1 - f2) / delta;
        const err = min(max(abs(d1 - grad[i]), abs(d2 - grad[i]), abs(d1 - d2)), delta);
        const normalize = max(abs(grad[i]), abs(f0), abs(f1), abs(f2), abs(t0), abs(t1), abs(t2), 1e-8);
        if (err / normalize < 1e-3) {
          break;
        }
      }
      delta /= 16;
    }
  }
  return grad;
}
function minimize(f, x0, maxit = 1e3, tol = 1e-8, end_on_line_search = false) {
  tol = Math.max(tol, 2e-16);
  const grad = (a) => gradient(f, a);
  x0 = x0.slice(0);
  let g0 = grad(x0);
  let f0 = f(x0);
  if (isNaN(f0)) {
    throw new Error("minimize: f(x0) is a NaN!");
  }
  const n = x0.length;
  let H1 = identity(n);
  for (var it = 0; it < maxit; it++) {
    if (!g0.every(isFinite)) {
      var msg = "Gradient has Infinity or NaN";
      break;
    }
    const step = neg(dot(H1, g0));
    if (!step.every(isFinite)) {
      var msg = "Search direction has Infinity or NaN";
      break;
    }
    const nstep = norm2(step);
    if (nstep < tol) {
      var msg = "Newton step smaller than tol";
      break;
    }
    let t = 1;
    const df0 = dot(g0, step);
    let x1 = x0;
    var s;
    for (; it < maxit && t * nstep >= tol; it++) {
      s = mul(step, t);
      x1 = add2(x0, s);
      var f1 = f(x1);
      if (!(f1 - f0 >= 0.1 * t * df0 || isNaN(f1))) {
        break;
      }
      t *= 0.5;
    }
    if (t * nstep < tol && end_on_line_search) {
      var msg = "Line search step size smaller than tol";
      break;
    }
    if (it === maxit) {
      var msg = "maxit reached during line search";
      break;
    }
    const g1 = grad(x1);
    const y = sub(g1, g0);
    const ys = dot(y, s);
    const Hy = dot(H1, y);
    H1 = sub(add2(H1, mul(ten(s, s), (ys + dot(y, Hy)) / (ys * ys))), div(add2(ten(Hy, s), ten(s, Hy)), ys));
    x0 = x1;
    f0 = f1;
    g0 = g1;
  }
  return {
    solution: x0,
    f: f0,
    gradient: g0,
    invHessian: H1,
    iterations: it,
    message: msg
  };
}

// app/constraints.js
var _Variable = class {
  constructor(_value = 0, represents) {
    this._value = _value;
    this.id = generateId();
    this.info = {
      isCanonical: true,
      absorbedVariables: new Set()
    };
    this.isScrubbing = false;
    this.represents = represents;
    _Variable.all.add(this);
  }
  static create(value = 0, represents) {
    return new _Variable(value, represents);
  }
  remove() {
    if (!_Variable.all.has(this)) {
      return;
    }
    _Variable.all.delete(this);
    for (const constraint of Constraint.all) {
      if (constraint.variables.includes(this)) {
        constraint.remove();
      }
    }
  }
  get isCanonicalInstance() {
    return this.info.isCanonical;
  }
  get canonicalInstance() {
    return this.info.isCanonical ? this : this.info.canonicalInstance;
  }
  get offset() {
    return this.info.isCanonical ? {m: 1, b: 0} : this.info.offset;
  }
  get value() {
    return this._value;
  }
  set value(newValue) {
    if (this.info.isCanonical) {
      this._value = newValue;
      for (const that of this.info.absorbedVariables) {
        const {m, b} = that.info.offset;
        that._value = (newValue - b) / m;
      }
    } else {
      this.info.canonicalInstance.value = this.toCanonicalValue(newValue);
    }
  }
  toCanonicalValue(value) {
    if (this.info.isCanonical) {
      return value;
    }
    const {m, b} = this.info.offset;
    return m * value + b;
  }
  makeEqualTo(that, offset = {m: 1, b: 0}) {
    if (this === that) {
      return;
    } else if (!this.info.isCanonical) {
      const {m: mThat, b: bThat} = offset;
      const {m: mThis, b: bThis} = this.offset;
      this.canonicalInstance.makeEqualTo(that, {
        m: mThis * mThat,
        b: mThis * bThat + bThis
      });
      return;
    } else if (!that.info.isCanonical) {
      const {m: mThat, b: bThat} = that.offset;
      const {m, b} = offset;
      this.makeEqualTo(that.canonicalInstance, {
        m: m / mThat,
        b: b - bThat / mThat
      });
      return;
    }
    const thatLockConstraint = that.lockConstraint;
    for (const otherVariable of that.info.absorbedVariables) {
      const otherVariableInfo = otherVariable.info;
      otherVariableInfo.canonicalInstance = this;
      otherVariableInfo.offset = {
        m: offset.m * otherVariableInfo.offset.m,
        b: offset.m * otherVariableInfo.offset.b + offset.b
      };
      this.info.absorbedVariables.add(otherVariable);
    }
    that.info = {
      isCanonical: false,
      canonicalInstance: this,
      offset
    };
    this.info.absorbedVariables.add(that);
    this.value = this.value;
    if (thatLockConstraint || this.isLocked) {
      this.lock();
    } else {
      this.unlock();
    }
  }
  promoteToCanonical() {
    if (this.info.isCanonical) {
    } else {
      this.info.canonicalInstance.breakOff(this);
    }
  }
  breakOff(that) {
    if (!this.info.isCanonical) {
      throw new Error("Handle.breakOff() called on absorbed variable");
    }
    if (!this.info.absorbedVariables.has(that)) {
      throw new Error("cannot break off a variable that has not been absorbed");
    }
    this.info.absorbedVariables.delete(that);
    that.info = {isCanonical: true, absorbedVariables: new Set()};
    if (this.isLocked) {
      that.lock();
    }
    forgetClustersForSolver();
  }
  get lockConstraint() {
    for (const c of Constraint.all) {
      if (c instanceof Constant && c.variable === this.canonicalInstance) {
        return c;
      }
    }
    return null;
  }
  get isLocked() {
    return !!this.lockConstraint;
  }
  lock(value, scrub = false) {
    if (!this.info.isCanonical) {
      this.canonicalInstance.lock(value !== void 0 ? this.toCanonicalValue(value) : void 0, scrub);
      return;
    }
    if (value !== void 0) {
      this.value = value;
    }
    for (const variable2 of [this, ...this.info.absorbedVariables]) {
      constant(variable2);
      variable2.isScrubbing = scrub;
    }
  }
  unlock() {
    if (!this.info.isCanonical) {
      this.canonicalInstance.unlock();
      return;
    }
    for (const variable2 of [this, ...this.info.absorbedVariables]) {
      constant(variable2).remove();
      variable2.isScrubbing = false;
    }
  }
  toggleLock() {
    if (this.isLocked) {
      this.unlock();
    } else {
      this.lock();
    }
  }
  equals(that) {
    return this.canonicalInstance === that && this.offset.m === 1 && this.offset.b === 0 || that.canonicalInstance === this && that.offset.m === 1 && that.offset.b === 0 || this.canonicalInstance === that.canonicalInstance && this.offset.m === that.offset.m && this.offset.b === that.offset.b;
  }
  hasLinearRelationshipWith(that) {
    return this.canonicalInstance === that.canonicalInstance;
  }
};
var Variable = _Variable;
Variable.all = new Set();
var variable = Variable.create;
var LowLevelConstraint = class {
  constructor() {
    this.variables = [];
    this.ownVariables = new Set();
  }
  propagateKnowns(knowns) {
  }
};
var Distance = class extends LowLevelConstraint {
  constructor(constraint, a, b) {
    super();
    this.a = a;
    this.b = b;
    this.variables.push(variable(vec_default.dist(a.position, b.position), {
      object: constraint,
      property: "distance"
    }), a.xVariable, a.yVariable, b.xVariable, b.yVariable);
    this.ownVariables.add(this.distance);
  }
  get distance() {
    return this.variables[0];
  }
  addTo(constraints9) {
    for (const that of constraints9) {
      if (that instanceof Distance && (this.a.equals(that.a) && this.b.equals(that.b) || this.a.equals(that.b) && this.b.equals(that.a))) {
        that.distance.makeEqualTo(this.distance);
        return;
      }
    }
    constraints9.push(this);
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.distance.canonicalInstance) && knowns.has(this.a.xVariable.canonicalInstance) && knowns.has(this.a.yVariable.canonicalInstance) && knowns.has(this.b.xVariable.canonicalInstance) && knowns.has(this.b.yVariable.canonicalInstance)) {
      this.distance.value = vec_default.dist(this.a, this.b);
      knowns.add(this.distance.canonicalInstance);
    }
  }
  getError([dist, ax, ay, bx, by], knowns, freeVariables) {
    const aPos = {x: ax, y: ay};
    const bPos = {x: bx, y: by};
    const currDist = vec_default.dist(aPos, bPos);
    if (freeVariables.has(this.distance.canonicalInstance)) {
      this.distance.value = currDist;
    }
    return currDist - dist;
  }
};
var Angle = class extends LowLevelConstraint {
  constructor(constraint, a, b) {
    super();
    this.a = a;
    this.b = b;
    this.variables.push(variable(vec_default.angle(vec_default.sub(b.position, a.position)), {
      object: constraint,
      property: "distance"
    }), a.xVariable, a.yVariable, b.xVariable, b.yVariable);
    this.ownVariables.add(this.angle);
  }
  get angle() {
    return this.variables[0];
  }
  addTo(constraints9) {
    for (const that of constraints9) {
      if (!(that instanceof Angle)) {
        continue;
      } else if (this.a.equals(that.a) && this.b.equals(that.b)) {
        that.angle.makeEqualTo(this.angle);
        return;
      } else if (this.a.equals(that.b) && this.b.equals(that.a)) {
        that.angle.makeEqualTo(this.angle, {m: 1, b: Math.PI});
        return;
      }
    }
    constraints9.push(this);
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.angle) && knowns.has(this.a.xVariable.canonicalInstance) && knowns.has(this.a.yVariable.canonicalInstance) && knowns.has(this.b.xVariable.canonicalInstance) && knowns.has(this.b.yVariable.canonicalInstance)) {
      updateAngle(this.angle, this.a, this.b);
      knowns.add(this.angle.canonicalInstance);
    }
  }
  getError([angle, ax, ay, bx, by], knowns, freeVariables) {
    const aPos = {x: ax, y: ay};
    const bPos = {x: bx, y: by};
    if (freeVariables.has(this.angle.canonicalInstance)) {
      updateAngle(this.angle, aPos, bPos);
      return 0;
    }
    const r = vec_default.dist(bPos, aPos);
    let error = Infinity;
    if (!knowns.has(this.b.xVariable.canonicalInstance) && !knowns.has(this.b.yVariable.canonicalInstance)) {
      const x = ax + r * Math.cos(angle);
      const y = ay + r * Math.sin(angle);
      error = Math.min(error, vec_default.dist(bPos, {x, y}));
    } else if (!knowns.has(this.b.xVariable.canonicalInstance)) {
      const x = ax + (by - ay) / Math.tan(angle);
      error = Math.min(error, Math.abs(x - bx));
    } else if (!knowns.has(this.b.yVariable.canonicalInstance)) {
      const y = ay + (bx - ax) * Math.tan(angle);
      error = Math.min(error, Math.abs(y - by));
    }
    if (!knowns.has(this.a.xVariable.canonicalInstance) && !knowns.has(this.a.yVariable.canonicalInstance)) {
      const x = bx + r * Math.cos(angle + Math.PI);
      const y = by + r * Math.sin(angle + Math.PI);
      error = Math.min(error, vec_default.dist(aPos, {x, y}));
    } else if (!knowns.has(this.a.xVariable.canonicalInstance)) {
      const x = bx + (ay - by) / Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(x - ax));
    } else if (!knowns.has(this.a.yVariable.canonicalInstance)) {
      const y = by + (ax - bx) * Math.tan(angle + Math.PI);
      error = Math.min(error, Math.abs(y - ay));
    }
    if (!Number.isFinite(error)) {
      error = Math.min(vec_default.dist(bPos, {
        x: ax + r * Math.cos(angle),
        y: ay + r * Math.sin(angle)
      }), vec_default.dist(aPos, {
        x: bx + r * Math.cos(angle + Math.PI),
        y: by + r * Math.sin(angle + Math.PI)
      }));
    }
    return error;
  }
};
function updateAngle(angleVar, aPos, bPos) {
  const currAngle = normalizeAngle(angleVar.value);
  const newAngle = normalizeAngle(vec_default.angle(vec_default.sub(bPos, aPos)));
  let diff = normalizeAngle(newAngle - currAngle);
  if (diff > Math.PI) {
    diff -= TAU;
  }
  angleVar.value += diff;
}
function normalizeAngle(angle) {
  return (angle % TAU + TAU) % TAU;
}
var LLFormula = class extends LowLevelConstraint {
  constructor(constraint, args, fn) {
    super();
    this.args = args;
    this.fn = fn;
    this.result = variable(this.computeResult(), {
      object: constraint,
      property: "result"
    });
    this.variables.push(...args, this.result);
    this.ownVariables.add(this.result);
  }
  addTo(constraints9) {
    constraints9.push(this);
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.result.canonicalInstance) && this.args.every((arg) => knowns.has(arg.canonicalInstance))) {
      this.result.value = this.computeResult();
      knowns.add(this.result.canonicalInstance);
    }
  }
  getError(variableValues, knowns, freeVariables) {
    const currValue = this.computeResult(variableValues);
    if (freeVariables.has(this.result.canonicalInstance)) {
      this.result.value = currValue;
    }
    return currValue - this.result.value;
  }
  computeResult(xs = this.args.map((arg) => arg.value)) {
    return this.fn(xs);
  }
};
var _Constraint = class {
  constructor() {
    this._paused = false;
    this.variables = [];
    this.lowLevelConstraints = [];
    _Constraint.all.add(this);
    forgetClustersForSolver();
  }
  get paused() {
    return this._paused;
  }
  set paused(newValue) {
    if (newValue !== this._paused) {
      this._paused = newValue;
      forgetClustersForSolver();
    }
  }
  setUpVariableRelationships() {
  }
  propagateKnowns(knowns) {
    for (const llc of this.lowLevelConstraints) {
      llc.propagateKnowns(knowns);
    }
  }
  getManipulationSet() {
    return new Set(this.variables.map((v) => v.canonicalInstance));
  }
  remove() {
    if (!_Constraint.all.has(this)) {
      return;
    }
    _Constraint.all.delete(this);
    for (const llc of this.lowLevelConstraints) {
      for (const v of llc.ownVariables) {
        v.remove();
      }
    }
    forgetClustersForSolver();
  }
};
var Constraint = _Constraint;
Constraint.all = new Set();
var _Constant = class extends Constraint {
  constructor(variable2, value) {
    super();
    this.variable = variable2;
    this.value = value;
    this.variables.push(variable2);
  }
  static create(variable2, value = variable2.value) {
    let constant2 = _Constant.memo.get(variable2);
    if (constant2) {
      constant2.value = value;
    } else {
      constant2 = new _Constant(variable2, value);
      _Constant.memo.set(variable2, constant2);
    }
    return constant2;
  }
  propagateKnowns(knowns) {
    if (!knowns.has(this.variable.canonicalInstance)) {
      this.variable.value = this.value;
      knowns.add(this.variable.canonicalInstance);
    }
    super.propagateKnowns(knowns);
  }
  remove() {
    _Constant.memo.delete(this.variable);
    super.remove();
  }
};
var Constant = _Constant;
Constant.memo = new Map();
var constant = Constant.create;
var PinLikeConstraint = class extends Constraint {
  constructor(handle, position) {
    super();
    this.handle = handle;
    this.position = position;
    this.variables.push(handle.xVariable, handle.yVariable);
  }
  propagateKnowns(knowns) {
    const {xVariable: x, yVariable: y} = this.handle;
    if (!knowns.has(x.canonicalInstance) || !knowns.has(y.canonicalInstance)) {
      ({x: x.value, y: y.value} = this.position);
      knowns.add(x.canonicalInstance);
      knowns.add(y.canonicalInstance);
    }
    super.propagateKnowns(knowns);
  }
};
var _Pin = class extends PinLikeConstraint {
  static create(handle, position = handle.position) {
    let pin2 = _Pin.memo.get(handle);
    if (pin2) {
      pin2.position = position;
    } else {
      pin2 = new _Pin(handle, position);
      _Pin.memo.set(handle, pin2);
    }
    return pin2;
  }
  constructor(handle, position) {
    super(handle, position);
  }
  remove() {
    _Pin.memo.delete(this.handle);
    super.remove();
  }
};
var Pin = _Pin;
Pin.memo = new Map();
var pin = Pin.create;
var _Finger = class extends PinLikeConstraint {
  static create(handle, position = handle.position) {
    let finger2 = _Finger.memo.get(handle);
    if (finger2) {
      finger2.position = position;
    } else {
      finger2 = new _Finger(handle, position);
      _Finger.memo.set(handle, finger2);
    }
    return finger2;
  }
  constructor(handle, position) {
    super(handle, position);
  }
  remove() {
    _Finger.memo.delete(this.handle);
    super.remove();
  }
};
var Finger = _Finger;
Finger.memo = new Map();
var finger = Finger.create;
var _LinearRelationship = class extends Constraint {
  constructor(y, m, x, b) {
    super();
    this.y = y;
    this.m = m;
    this.x = x;
    this.b = b;
    this.variables.push(y, x);
  }
  static create(y, m, x, b) {
    if (m === 0) {
      throw new Error("tried to create a linear relationship w/ m = 0");
    }
    let lr = _LinearRelationship.memo.get(y)?.get(x);
    if (lr) {
      lr.m = m;
      lr.b = b;
      return lr;
    }
    lr = _LinearRelationship.memo.get(x)?.get(y);
    if (lr) {
      lr.m = 1 / m;
      lr.b = -b / m;
      return lr;
    }
    lr = new _LinearRelationship(y, m, x, b);
    if (!_LinearRelationship.memo.has(y)) {
      _LinearRelationship.memo.set(y, new Map());
    }
    _LinearRelationship.memo.get(y).set(x, lr);
    return lr;
  }
  setUpVariableRelationships() {
    this.y.makeEqualTo(this.x, {m: this.m, b: this.b});
  }
  remove() {
    const yDict = _LinearRelationship.memo.get(this.y);
    if (yDict) {
      yDict.delete(this.x);
      if (yDict.size === 0) {
        _LinearRelationship.memo.delete(this.y);
      }
    }
    const xDict = _LinearRelationship.memo.get(this.x);
    if (xDict) {
      xDict.delete(this.y);
      if (xDict.size === 0) {
        _LinearRelationship.memo.delete(this.x);
      }
    }
    super.remove();
  }
};
var LinearRelationship = _LinearRelationship;
LinearRelationship.memo = new Map();
var linearRelationship = LinearRelationship.create;
var equals = (x, y) => linearRelationship(y, 1, x, 0);
var _Absorb = class extends Constraint {
  constructor(parent, child) {
    super();
    this.parent = parent;
    this.child = child;
    this.variables.push(parent.xVariable, parent.yVariable, child.xVariable, child.yVariable);
  }
  static create(parent, child) {
    if (_Absorb.memo.has(child)) {
      _Absorb.memo.get(child).remove();
    }
    const a = new _Absorb(parent, child);
    _Absorb.memo.set(child, a);
    return a;
  }
  setUpVariableRelationships() {
    this.parent.xVariable.makeEqualTo(this.child.xVariable);
    this.parent.yVariable.makeEqualTo(this.child.yVariable);
    this.parent._absorb(this.child);
  }
  remove() {
    _Absorb.memo.delete(this.child);
    super.remove();
  }
};
var Absorb = _Absorb;
Absorb.memo = new Map();
var absorb = Absorb.create;
var _PolarVector = class extends Constraint {
  constructor(a, b) {
    super();
    this.a = a;
    this.b = b;
    const dc = new Distance(this, a, b);
    this.lowLevelConstraints.push(dc);
    this.distance = dc.distance;
    const ac = new Angle(this, a, b);
    this.lowLevelConstraints.push(ac);
    this.angle = ac.angle;
    this.variables.push(a.xVariable, a.yVariable, b.xVariable, b.yVariable, this.distance, this.angle);
  }
  static create(a, b) {
    let pv = _PolarVector.memo.get(a)?.get(b);
    if (pv) {
      return pv;
    }
    pv = new _PolarVector(a, b);
    if (!_PolarVector.memo.get(a)) {
      _PolarVector.memo.set(a, new Map());
    }
    _PolarVector.memo.get(a).set(b, pv);
    return pv;
  }
  remove() {
    const aDict = _PolarVector.memo.get(this.a);
    aDict.delete(this.b);
    if (aDict.size === 0) {
      _PolarVector.memo.delete(this.a);
    }
    super.remove();
  }
};
var PolarVector = _PolarVector;
PolarVector.memo = new Map();
var polarVector = PolarVector.create;
var Formula = class extends Constraint {
  static create(args, fn) {
    return new Formula(args, fn);
  }
  constructor(args, fn) {
    super();
    const fc = new LLFormula(this, args, fn);
    this.lowLevelConstraints.push(fc);
    this.result = fc.result;
    this.variables.push(...args, this.result);
  }
};
var formula = Formula.create;
var clustersForSolver = null;
function getClustersForSolver(root2) {
  if (clustersForSolver) {
    return clustersForSolver;
  }
  root2.forEach({
    what: aHandle,
    recursive: true,
    do(handle) {
      handle._forgetAbsorbedHandles();
    }
  });
  for (const variable2 of Variable.all) {
    variable2.info = {isCanonical: true, absorbedVariables: new Set()};
  }
  const activeConstraints = [...Constraint.all].filter((constraint) => !constraint.paused);
  for (const constraint of activeConstraints) {
    constraint.setUpVariableRelationships();
  }
  clustersForSolver = computeClusters(activeConstraints);
  forDebugging("clusters", clustersForSolver);
  Svg_default.showStatus(`${clustersForSolver.size} clusters`);
  return clustersForSolver;
}
function computeClusters(activeConstraints) {
  const clusters = new Set();
  for (const constraint of activeConstraints) {
    const constraints9 = [constraint];
    const lowLevelConstraints = [...constraint.lowLevelConstraints];
    let manipulationSet = constraint.getManipulationSet();
    for (const cluster of clusters) {
      if (!sets.overlap(cluster.manipulationSet, manipulationSet)) {
        continue;
      }
      constraints9.push(...cluster.constraints);
      for (const llc of cluster.lowLevelConstraints) {
        llc.addTo(lowLevelConstraints);
      }
      manipulationSet = new Set([...manipulationSet, ...cluster.manipulationSet].map((v) => v.canonicalInstance));
      clusters.delete(cluster);
    }
    clusters.add({constraints: constraints9, lowLevelConstraints, manipulationSet});
  }
  return sets.map(clusters, ({constraints: constraints9, lowLevelConstraints}) => createClusterForSolver(constraints9, lowLevelConstraints));
}
function createClusterForSolver(constraints9, lowLevelConstraints) {
  const knowns = computeKnowns(constraints9, lowLevelConstraints);
  const variables = new Set();
  for (const constraint of constraints9) {
    for (const variable2 of constraint.variables) {
      if (!knowns.has(variable2.canonicalInstance)) {
        variables.add(variable2.canonicalInstance);
      }
    }
  }
  const freeVariableCandidates = new Set();
  for (const llc of lowLevelConstraints) {
    for (const variable2 of llc.ownVariables) {
      if (!knowns.has(variable2.canonicalInstance)) {
        freeVariableCandidates.add(variable2.canonicalInstance);
      }
    }
  }
  const freeVarCandidateCounts = new Map();
  for (const llc of lowLevelConstraints) {
    for (const variable2 of llc.variables) {
      if (!freeVariableCandidates.has(variable2.canonicalInstance)) {
        continue;
      }
      const n = freeVarCandidateCounts.get(variable2.canonicalInstance) ?? 0;
      freeVarCandidateCounts.set(variable2.canonicalInstance, n + 1);
    }
  }
  const freeVariables = new Set();
  for (const [variable2, count] of freeVarCandidateCounts.entries()) {
    if (count === 1) {
      freeVariables.add(variable2.canonicalInstance);
    }
  }
  return {
    constraints: constraints9,
    lowLevelConstraints,
    variables: Array.from(variables),
    freeVariables
  };
}
function forgetClustersForSolver() {
  clustersForSolver = null;
}
function solve(root2) {
  const clusters = getClustersForSolver(root2);
  for (const cluster of clusters) {
    solveCluster(cluster);
  }
}
function solveCluster(cluster) {
  const {constraints: constraints9, lowLevelConstraints, variables} = cluster;
  let {freeVariables} = cluster;
  if (constraints9.length === 0) {
    return;
  }
  const knowns = computeKnowns(constraints9, lowLevelConstraints);
  const handlesWithFingers = getHandlesWithFingers(constraints9);
  for (const pv of constraints9) {
    if (pv instanceof PolarVector && handlesWithFingers.has(pv.a.canonicalInstance) && handlesWithFingers.has(pv.b.canonicalInstance)) {
      for (const k of constraints9) {
        if (k instanceof Constant && (k.variable.hasLinearRelationshipWith(pv.distance) || k.variable.hasLinearRelationshipWith(pv.angle))) {
          k.value = k.variable.value;
        }
      }
    }
  }
  let gizmoHack = false;
  for (const pv of constraints9) {
    if (pv instanceof PolarVector && pv.angle.isScrubbing && freeVariables.has(pv.distance.canonicalInstance)) {
      gizmoHack = true;
      knowns.add(pv.distance.canonicalInstance);
    }
  }
  if (gizmoHack) {
    freeVariables = new Set([...freeVariables].filter((fv) => !knowns.has(fv.canonicalInstance)));
  }
  const inputs = [];
  const varIdx = new Map();
  for (const variable2 of variables) {
    if (variable2.isCanonicalInstance && !knowns.has(variable2) && !freeVariables.has(variable2)) {
      varIdx.set(variable2, inputs.length);
      inputs.push(variable2.value);
    }
  }
  function computeTotalError(currState) {
    let error = 0;
    for (const llc of lowLevelConstraints) {
      const values = llc.variables.map((variable2) => {
        const {m, b} = variable2.offset;
        variable2 = variable2.canonicalInstance;
        const vi = varIdx.get(variable2);
        return ((vi === void 0 ? variable2.value : currState[vi]) - b) / m;
      });
      error += Math.pow(llc.getError(values, knowns, freeVariables), 2);
    }
    return error;
  }
  if (inputs.length === 0) {
    computeTotalError(inputs);
    return;
  }
  let result;
  try {
    result = minimize(computeTotalError, inputs, 1e3, 1e-3);
  } catch (e) {
    console.log("minimizeError threw", e, "while working on cluster", cluster, "with knowns", knowns);
    Svg_default.showStatus("" + e);
    throw e;
  }
  forDebugging("solverResult", result);
  forDebugging("solverResultMessages", (messages) => {
    if (!messages) {
      messages = new Set();
    }
    messages.add(result.message);
    return messages;
  });
  if (!result || result.message?.includes("maxit")) {
    return;
  }
  const outputs = result.solution;
  for (const variable2 of variables) {
    if (variable2.isCanonicalInstance && !knowns.has(variable2) && !freeVariables.has(variable2)) {
      variable2.value = outputs.shift();
    }
  }
}
function computeKnowns(constraints9, lowLevelConstraints) {
  const knowns = new Set();
  while (true) {
    const oldNumKnowns = knowns.size;
    for (const constraint of constraints9) {
      if (constraint instanceof Finger) {
        constraint.propagateKnowns(knowns);
      }
    }
    for (const constraint of constraints9) {
      if (constraint instanceof PolarVector) {
        constraint.propagateKnowns(knowns);
      }
    }
    for (const constraint of constraints9) {
      if (!(constraint instanceof Finger || constraint instanceof PolarVector)) {
        constraint.propagateKnowns(knowns);
      }
    }
    for (const llc of lowLevelConstraints) {
      llc.propagateKnowns(knowns);
    }
    if (knowns.size === oldNumKnowns) {
      break;
    }
  }
  return knowns;
}
function getHandlesWithFingers(constraints9) {
  const handlesWithFingers = new Set();
  for (const constraint of constraints9) {
    if (constraint instanceof Finger) {
      handlesWithFingers.add(constraint.handle.canonicalInstance);
    }
  }
  return handlesWithFingers;
}

// app/ink/Handle.js
var Handle = class extends GameObject {
  constructor(position) {
    super(root);
    this.id = generateId();
    this.backElm = Svg_default.add("g", Svg_default.handleElm, {class: "handle"});
    this.frontElm = Svg_default.add("g", Svg_default.constraintElm, {
      class: "handle"
    });
    this.xVariable = variable(0, {
      object: this,
      property: "x"
    });
    this.yVariable = variable(0, {
      object: this,
      property: "y"
    });
    this._canonicalHandle = this;
    this.absorbedHandles = new Set();
    this.position = position;
    Svg_default.add("circle", this.backElm, {r: 15});
    const arcs1 = Svg_default.add("g", this.frontElm, {class: "arcs1"});
    const arcs2 = Svg_default.add("g", this.frontElm, {class: "arcs2"});
    const arc2 = (angle = 0) => Svg_default.arcPath(vec_default.zero, 14, angle, Math.PI / 10);
    Svg_default.add("path", arcs1, {d: arc2(0 * TAU / 4)});
    Svg_default.add("path", arcs1, {d: arc2(1 * TAU / 4)});
    Svg_default.add("path", arcs1, {d: arc2(2 * TAU / 4)});
    Svg_default.add("path", arcs1, {d: arc2(3 * TAU / 4)});
    Svg_default.add("path", arcs2, {d: arc2(0 * TAU / 4)});
    Svg_default.add("path", arcs2, {d: arc2(1 * TAU / 4)});
    Svg_default.add("path", arcs2, {d: arc2(2 * TAU / 4)});
    Svg_default.add("path", arcs2, {d: arc2(3 * TAU / 4)});
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
    absorb(this, that);
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
      absorb(this, handle).remove();
    } else if (handle === this) {
      const absorbedHandles = [...this.absorbedHandles];
      const newCanonicalHandle = absorbedHandles.shift();
      absorb(this, newCanonicalHandle).remove();
      for (const absorbedHandle of absorbedHandles) {
        absorb(newCanonicalHandle, absorbedHandle);
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
        pin(h);
      } else {
        pin(h).remove();
      }
    }
  }
  render(t, dt) {
    const attrs = {
      transform: Svg_default.positionToTransform(this),
      "is-canonical": this.isCanonical,
      "has-pin": this.hasPin
    };
    Svg_default.update(this.backElm, attrs);
    Svg_default.update(this.frontElm, attrs);
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
  distanceToPoint(point) {
    return vec_default.dist(this.position, point);
  }
  equals(that) {
    return this.xVariable.equals(that.xVariable) && this.yVariable.equals(that.yVariable);
  }
};
var Handle_default = Handle;
var aHandle = (gameObj) => gameObj instanceof Handle ? gameObj : null;
var aCanonicalHandle = (gameObj) => gameObj instanceof Handle && gameObj.isCanonical ? gameObj : null;

// lib/TransformationMatrix.js
var DEGREES_TO_RADIANS = Math.PI / 180;
var RADIANS_TO_DEGREES = 180 / Math.PI;
var TransformationMatrix = class {
  constructor() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
  reset() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
  transform(a2, b2, c2, d2, e2, f2) {
    const {a: a1, b: b1, c: c1, d: d1, e: e1, f: f1} = this;
    this.a = a1 * a2 + c1 * b2;
    this.b = b1 * a2 + d1 * b2;
    this.c = a1 * c2 + c1 * d2;
    this.d = b1 * c2 + d1 * d2;
    this.e = a1 * e2 + c1 * f2 + e1;
    this.f = b1 * e2 + d1 * f2 + f1;
    return this;
  }
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.transform(cos, sin, -sin, cos, 0, 0);
    return this;
  }
  rotateDegrees(angle) {
    this.rotate(angle * DEGREES_TO_RADIANS);
    return this;
  }
  scale(sx, sy) {
    this.transform(sx, 0, 0, sy, 0, 0);
    return this;
  }
  skew(sx, sy) {
    this.transform(1, sy, sx, 1, 0, 0);
    return this;
  }
  translate(tx, ty) {
    this.transform(1, 0, 0, 1, tx, ty);
    return this;
  }
  flipX() {
    this.transform(-1, 0, 0, 1, 0, 0);
    return this;
  }
  flipY() {
    this.transform(1, 0, 0, -1, 0, 0);
    return this;
  }
  inverse() {
    const {a, b, c, d, e, f} = this;
    const dt = a * d - b * c;
    this.a = d / dt;
    this.b = -b / dt;
    this.c = -c / dt;
    this.d = a / dt;
    this.e = (c * f - d * e) / dt;
    this.f = -(a * f - b * e) / dt;
    return this;
  }
  getInverse() {
    const {a, b, c, d, e, f} = this;
    const m = new TransformationMatrix();
    const dt = a * d - b * c;
    m.a = d / dt;
    m.b = -b / dt;
    m.c = -c / dt;
    m.d = a / dt;
    m.e = (c * f - d * e) / dt;
    m.f = -(a * f - b * e) / dt;
    return m;
  }
  getPosition() {
    return {x: this.e, y: this.f};
  }
  getRotation() {
    const E = (this.a + this.d) / 2;
    const F = (this.a - this.d) / 2;
    const G = (this.c + this.b) / 2;
    const H = (this.c - this.b) / 2;
    const a1 = Math.atan2(G, F);
    const a2 = Math.atan2(H, E);
    const phi = (a2 + a1) / 2;
    return -phi * RADIANS_TO_DEGREES;
  }
  getScale() {
    const E = (this.a + this.d) / 2;
    const F = (this.a - this.d) / 2;
    const G = (this.c + this.b) / 2;
    const H = (this.c - this.b) / 2;
    const Q = Math.sqrt(E * E + H * H);
    const R = Math.sqrt(F * F + G * G);
    return {
      scaleX: Q + R,
      scaleY: Q - R
    };
  }
  transformMatrix(m2) {
    const {a: a1, b: b1, c: c1, d: d1, e: e1, f: f1} = this;
    const a2 = m2.a;
    const b2 = m2.b;
    const c2 = m2.c;
    const d2 = m2.d;
    const e2 = m2.e;
    const f2 = m2.f;
    const m = new TransformationMatrix();
    m.a = a1 * a2 + c1 * b2;
    m.b = b1 * a2 + d1 * b2;
    m.c = a1 * c2 + c1 * d2;
    m.d = b1 * c2 + d1 * d2;
    m.e = a1 * e2 + c1 * f2 + e1;
    m.f = b1 * e2 + d1 * f2 + f1;
    return m;
  }
  transformPoint(p) {
    const {x, y} = p;
    const {a, b, c, d, e, f} = this;
    return {
      ...p,
      x: x * a + y * c + e,
      y: x * b + y * d + f
    };
  }
  transformLine(l2) {
    return {
      a: this.transformPoint(l2.a),
      b: this.transformPoint(l2.b)
    };
  }
  static identity() {
    return new TransformationMatrix();
  }
  static fromLineTranslateRotate(a, b) {
    const line = vec_default.sub(b, a);
    const m = new TransformationMatrix();
    m.translate(a.x, a.y);
    m.rotate(vec_default.angle(line));
    return m;
  }
  static fromLine(a, b) {
    const line = vec_default.sub(b, a);
    const length = vec_default.len(line);
    const m = new TransformationMatrix();
    m.translate(a.x, a.y);
    m.rotate(vec_default.angle(line));
    m.scale(length, length);
    return m;
  }
};
var TransformationMatrix_default = TransformationMatrix;

// app/ink/StrokeGroup.js
var StrokeGroup = class extends GameObject {
  constructor(strokes2) {
    super();
    for (const stroke of strokes2) {
      this.adopt(stroke);
    }
    const points2 = this.strokes.flatMap((stroke) => stroke.points);
    [this.a, this.b] = farthestPair(points2).map((pos) => this.adopt(Handle_default.create(pos)));
    this.pointData = this.generatePointData();
  }
  generatePointData() {
    const transform = TransformationMatrix_default.fromLine(this.a.position, this.b.position).inverse();
    this.pointData = this.strokes.map((stroke) => stroke.points.map((p) => transform.transformPoint(p)));
    return this.pointData;
  }
  get strokes() {
    return this.findAll({what: aStroke, recursive: false});
  }
  updatePaths() {
    const transform = TransformationMatrix_default.fromLine(this.a.position, this.b.position);
    for (const [i, stroke] of this.strokes.entries()) {
      const newPoints = this.pointData[i].map((p) => transform.transformPoint(p));
      stroke.updatePath(newPoints);
    }
  }
  distanceToPoint(pos) {
    let minDistance = null;
    for (const stroke of this.strokes) {
      const dist = stroke.distanceToPoint(pos);
      if (dist === null) {
        continue;
      } else if (minDistance === null) {
        minDistance = dist;
      } else {
        minDistance = Math.min(minDistance, dist);
      }
    }
    return minDistance;
  }
  render(dt, t) {
    this.updatePaths();
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
  breakApart() {
    if (!this.parent) {
      throw new Error("You can't break apart a parent-less StrokeGroup");
    }
    let stroke;
    while (stroke = this.strokes.pop()) {
      this.parent.adopt(stroke);
    }
    this.remove();
  }
  remove() {
    this.a.remove();
    this.b.remove();
    for (const s of this.strokes) {
      s.remove();
    }
    super.remove();
  }
};
var StrokeGroup_default = StrokeGroup;
var aStrokeGroup = (gameObj) => gameObj instanceof StrokeGroup ? gameObj : null;

// app/meta/MetaSemantics.js
var MetaNumber = class {
  constructor(variable2) {
    this.variable = variable2;
  }
  wireTo(that) {
    if (that instanceof MetaNumber || that instanceof MetaNumber) {
      return new MetaNumberConnection(this, that);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
};
var MetaNumberConnection = class {
  constructor(a, b) {
    this.constraint = equals(b.variable, a.variable);
  }
  get paused() {
    return this.constraint.paused;
  }
  togglePaused(newValue = !this.constraint.paused) {
    return this.constraint.paused = newValue;
  }
  remove() {
    this.constraint.remove();
  }
};
var MetaLabel = class {
  constructor(display, variable2) {
    this.display = display;
    this.variable = variable2;
    this.id = generateId();
  }
  wireTo(that) {
    if (that instanceof MetaNumber || that instanceof MetaNumber) {
      return new MetaNumberConnection(this, that);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
};
var MetaStruct = class {
  constructor(input) {
    this.labelsById = new Map();
    this.labelsByString = new Map();
    for (const label of input) {
      this.labelsById.set(label.id, label);
      if (typeof label.display === "string") {
        this.labelsByString.set(label.display, label);
      }
    }
  }
  createLabel(strokeData) {
    const label = new MetaLabel(strokeData, variable(0));
    label.variable.represents = {object: label, property: "label-value"};
    this.labelsById.set(label.id, label);
    if (typeof strokeData === "string") {
      this.labelsByString.set(label.display, label);
    }
    return label;
  }
  getLabelByString(textLabel) {
    return this.labelsByString.get(textLabel);
  }
  getLabelById(id) {
    return this.labelsById.get(id);
  }
  isEmpty() {
    return this.labelsById.size === 0;
  }
  list() {
    return Array.from(this.labelsById.values());
  }
  wireTo(that) {
    if (that instanceof MetaStruct) {
      return new MetaStructConnection(this, that);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
};
var MetaStructConnection = class {
  constructor(a, b) {
    this.constraints = [];
    if (a.isEmpty()) {
      [a, b] = [b, a];
    }
    if (!b.isEmpty()) {
      for (const [id, a_label] of a.labelsByString.entries()) {
        const b_label = b.labelsByString.get(id);
        if (b_label) {
          this.constraints.push(equals(b_label.variable, a_label.variable));
        }
      }
    } else {
      b.labelsById = a.labelsById;
    }
    this.b = b;
  }
  get paused() {
    return false;
  }
  togglePaused(newValue) {
    return false;
  }
  remove() {
    this.b.labelsById = new Map();
    for (const constraint of this.constraints) {
      constraint.remove();
    }
    return;
  }
};

// app/Page.js
var Page = class extends GameObject {
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
};
var Page_default = Page;

// app/VarMover.js
var moves = [];
function move(variable2, finalValue, durationSeconds, easeFn = (t) => t) {
  moves = moves.filter((move2) => move2.variable.canonicalInstance !== variable2.canonicalInstance);
  moves.push({
    variable: variable2,
    unlockWhenDone: !variable2.isLocked,
    initialValue: variable2.value,
    finalValue,
    durationSeconds,
    easeFn,
    initialTime: 0,
    done: false
  });
}
function update2(dt, t) {
  for (const move2 of moves) {
    const {
      variable: variable2,
      unlockWhenDone,
      initialValue,
      finalValue,
      durationSeconds,
      easeFn,
      done
    } = move2;
    if (done) {
      if (unlockWhenDone) {
        variable2.unlock();
      }
      moves.splice(moves.indexOf(move2), 1);
      continue;
    }
    if (move2.initialTime === 0) {
      move2.initialTime = t;
    }
    const t0 = move2.initialTime;
    const pct = Math.min((t - t0) / durationSeconds, 1);
    variable2.lock(initialValue + (finalValue - initialValue) * easeFn(pct));
    if (pct === 1) {
      move2.done = true;
    }
  }
}
var VarMover_default = {
  move,
  update: update2
};

// lib/SignedDistance.js
function signedDistanceToBox(xA, yA, widthA, heightA, xB, yB) {
  const halfWidthA = widthA / 2;
  const halfHeightA = heightA / 2;
  const centerXA = xA + halfWidthA;
  const centerYA = yA + halfHeightA;
  const dx = xB - centerXA;
  const dy = yB - centerYA;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const distX = Math.max(absDx - halfWidthA, 0);
  const distY = Math.max(absDy - halfHeightA, 0);
  const signedDistance = Math.sqrt(distX * distX + distY * distY);
  if (dx < -halfWidthA) {
    return signedDistance;
  } else if (dx > halfWidthA) {
    return signedDistance;
  } else if (dy < -halfHeightA) {
    return signedDistance;
  } else if (dy > halfHeightA) {
    return signedDistance;
  } else {
    return -signedDistance;
  }
}

// app/meta/Token.js
var Token = class extends GameObject {
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
    return vec_default.add(this.position, vec_default.mulS(vec_default(this.width, this.height), 0.5));
  }
  render(dt, t) {
  }
};
var Token_default = Token;
var aToken = (gameObj) => gameObj instanceof Token ? gameObj : null;
var aPrimaryToken = (gameObj) => gameObj instanceof Token && gameObj.isPrimary() ? gameObj : null;

// app/meta/Wire.js
var WirePort = class extends GameObject {
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
};
var Wire = class extends GameObject {
  constructor() {
    super(...arguments);
    this.points = [];
    this.connection = null;
    this.elm = Svg_default.add("polyline", Svg_default.wiresElm, {
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
    Svg_default.update(this.elm, {
      points: Svg_default.points(this.points),
      "is-paused": this.connection?.paused
    });
  }
  isCollapsable() {
    const [p1, p2] = this.points;
    return p1 && p2 && vec_default.dist(p1, p2) < 10;
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
        Svg_default.showStatus("You can't wire those things together silly billy");
        this.remove();
      }
    }
  }
  remove() {
    this.elm.remove();
    this.connection?.remove();
    super.remove();
  }
};
var Wire_default = Wire;
var aWire = (g) => g instanceof Wire ? g : null;

// app/meta/NumberToken.js
var NumberToken = class extends Token_default {
  constructor(arg = 0, source) {
    super(source);
    this.id = generateId();
    this.lastRenderedValue = "";
    this.lastRenderedEditing = false;
    this.editValue = "";
    this.elm = Svg_default.add("g", Svg_default.metaElm, {class: "number-token"});
    this.boxElm = Svg_default.add("rect", this.elm, {
      class: "token-box",
      height: this.height
    });
    this.wholeElm = Svg_default.add("text", this.elm, {
      class: "token-text"
    });
    this.fracElm = Svg_default.add("text", this.elm, {
      class: "token-frac-text"
    });
    this.digitElems = [];
    if (arg instanceof Variable) {
      this.variable = arg;
    } else {
      this.variable = variable(arg, {
        object: this,
        property: "number-token-value"
      });
    }
    this.wirePort = this.adopt(new WirePort(this.position, new MetaNumber(this.variable)));
  }
  isPrimary() {
    return true;
  }
  addChar(char) {
    this.editValue += char;
  }
  updateCharAt(index, char) {
    const array = this.editValue.split("");
    array.splice(index, 1, char);
    this.editValue = array.join("");
  }
  refreshEditValue() {
    this.editValue = this.variable.value.toFixed(0);
  }
  refreshValue() {
    let value = parseFloat(this.editValue);
    if (Number.isNaN(value)) {
      value = 0;
    }
    this.variable.value = value;
  }
  render(dt, t) {
    Svg_default.update(this.elm, {
      transform: Svg_default.positionToTransform(this.position),
      "is-locked": this.getVariable().isLocked,
      "is-embedded": this.embedded,
      "is-editing": this.editing
    });
    this.wirePort.position = this.midPoint();
    const newValue = this.editing ? this.editValue : this.variable.value.toFixed(2);
    if (newValue === this.lastRenderedValue && this.lastRenderedEditing === this.editing) {
      return;
    }
    this.lastRenderedEditing = this.editing;
    this.lastRenderedValue = newValue;
    for (const elem of this.digitElems) {
      elem.remove();
    }
    this.digitElems = [];
    if (this.editing) {
      const chars = this.editValue.split("");
      for (const [i, char] of chars.entries()) {
        this.digitElems.push(Svg_default.add("text", this.elm, {
          class: "token-text",
          content: char,
          style: `translate: ${5 + i * 27}px 24px;`
        }));
      }
      this.width = chars.length * 27 - 3;
      Svg_default.update(this.boxElm, {width: this.width});
      Svg_default.update(this.wholeElm, {visibility: "hidden"});
      Svg_default.update(this.fracElm, {visibility: "hidden"});
    } else {
      this.lastRenderedValue = newValue;
      const [whole, frac] = newValue.split(".");
      Svg_default.update(this.wholeElm, {content: whole, visibility: "visible"});
      Svg_default.update(this.fracElm, {content: frac, visibility: "visible"});
      const wholeWidth = this.wholeElm.getComputedTextLength();
      const fracWidth = this.fracElm.getComputedTextLength();
      this.width = 5 + wholeWidth + 2 + fracWidth + 5;
      Svg_default.update(this.boxElm, {width: this.width});
      Svg_default.update(this.fracElm, {dx: wholeWidth + 2});
    }
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
  getVariable() {
    return this.variable;
  }
  onTap() {
    this.getVariable().toggleLock();
  }
  remove() {
    this.elm.remove();
    super.remove();
  }
};
var NumberToken_default = NumberToken;
var aNumberToken = (gameObj) => gameObj instanceof NumberToken ? gameObj : null;

// app/meta/OpToken.js
var OpToken = class extends Token_default {
  constructor(stringValue, source) {
    super(source);
    this.stringValue = stringValue;
    this.lastRenderedValue = "";
    this.textElement = Svg_default.add("text", Svg_default.metaElm, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      class: "op token"
    });
  }
  isPrimary() {
    return false;
  }
  render() {
    const content = this.stringValue;
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content;
      Svg_default.update(this.textElement, {content});
      this.width = this.textElement.getComputedTextLength() + 10;
    }
    Svg_default.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24
    });
  }
  remove() {
    this.textElement.remove();
    super.remove();
  }
};
var OpToken_default = OpToken;

// app/meta/EmptyToken.js
var EmptyToken = class extends Token_default {
  constructor() {
    super();
    this.width = 24;
    this.height = 30;
    this.value = "";
  }
  isPrimary() {
    return true;
  }
  render(dt, t) {
  }
};
var EmptyToken_default = EmptyToken;
var anEmptyToken = (gameObj) => gameObj instanceof EmptyToken ? gameObj : null;

// lib/qdollar.js
function Point(x, y, id) {
  this.X = x;
  this.Y = y;
  this.ID = id;
  this.IntX = 0;
  this.IntY = 0;
}
function PointCloud(name, points2) {
  this.Name = name;
  this.Points = Resample(points2, NumPoints);
  this.Points = Scale(this.Points);
  this.Points = TranslateTo(this.Points, Origin);
  this.Points = MakeIntCoords(this.Points);
  this.LUT = ComputeLUT(this.Points);
}
function Result(name, score, ms) {
  this.Name = name;
  this.Score = score;
  this.Time = ms;
}
var NumPointClouds = 16;
var NumPoints = 32;
var Origin = new Point(0, 0, 0);
var MaxIntCoord = 1024;
var LUTSize = 64;
var LUTScaleFactor = MaxIntCoord / LUTSize;
function QDollarRecognizer() {
  this.PointClouds = [];
  this.RecognizeStrokes = function(strokes2) {
    let points2 = [];
    for (const [i, stroke] of strokes2.entries()) {
      for (const point of stroke) {
        points2.push(new Point(point.x, point.y, i));
      }
    }
    return this.Recognize(points2);
  };
  this.RecognizeSorted = function(points2) {
    var candidate = new PointCloud("", points2);
    var b = Infinity;
    var matches = this.PointClouds.map((pointCloud) => {
      return {
        score: CloudMatch(candidate, pointCloud, b),
        name: pointCloud.Name
      };
    }).sort((a, b2) => {
      return a.score - b2.score;
    });
    return matches;
  };
  this.Recognize = function(points2) {
    var t0 = Date.now();
    var candidate = new PointCloud("", points2);
    var u = -1;
    var b = Infinity;
    for (var i = 0; i < this.PointClouds.length; i++) {
      var d = CloudMatch(candidate, this.PointClouds[i], b);
      if (d < b) {
        b = d;
        u = i;
      }
    }
    var t1 = Date.now();
    return u == -1 ? new Result("No match.", 0, t1 - t0) : new Result(this.PointClouds[u].Name, b > 1 ? 1 / b : 1, t1 - t0);
  };
  this.AddGestureLoad = function(name, strokes2) {
    let points2 = [];
    for (const [i, stroke] of strokes2.entries()) {
      for (const point of stroke) {
        points2.push(new Point(point.x, point.y, i));
      }
    }
    return this.AddGesture(name, points2);
  };
  this.AddGestureStrokes = function(name, strokes2) {
    let convertedPoints = [];
    for (let i = 0; i < strokes2.length; i++) {
      const points2 = strokes2[i];
      for (const point of points2) {
        convertedPoints.push(new Point(point.x, point.y, i));
      }
    }
    return this.AddGesture(name, convertedPoints);
  };
  this.AddGesture = function(name, points2) {
    this.PointClouds[this.PointClouds.length] = new PointCloud(name, points2);
    var num = 0;
    for (var i = 0; i < this.PointClouds.length; i++) {
      if (this.PointClouds[i].Name == name)
        num++;
    }
    return num;
  };
  this.DeleteUserGestures = function() {
    this.PointClouds.length = NumPointClouds;
    return NumPointClouds;
  };
}
function CloudMatch(candidate, template, minSoFar) {
  var n = candidate.Points.length;
  var step = Math.floor(Math.pow(n, 0.5));
  var LB1 = ComputeLowerBound(candidate.Points, template.Points, step, template.LUT);
  let LB2 = ComputeLowerBound(template.Points, candidate.Points, step, candidate.LUT);
  for (var i = 0, j = 0; i < n; i += step, j++) {
    if (LB1[j] < minSoFar)
      minSoFar = Math.min(minSoFar, CloudDistance(candidate.Points, template.Points, i, minSoFar));
    if (LB2[j] < minSoFar)
      minSoFar = Math.min(minSoFar, CloudDistance(template.Points, candidate.Points, i, minSoFar));
  }
  return minSoFar;
}
function CloudDistance(pts1, pts2, start, minSoFar) {
  var n = pts1.length;
  var unmatched = new Array();
  for (var j = 0; j < n; j++)
    unmatched[j] = j;
  var i = start;
  var weight = n;
  var sum = 0;
  do {
    var u = -1;
    var b = Infinity;
    for (var j = 0; j < unmatched.length; j++) {
      var d = SqrEuclideanDistance(pts1[i], pts2[unmatched[j]]);
      if (d < b) {
        b = d;
        u = j;
      }
    }
    unmatched.splice(u, 1);
    sum += weight * b;
    if (sum >= minSoFar)
      return sum;
    weight--;
    i = (i + 1) % n;
  } while (i != start);
  return sum;
}
function ComputeLowerBound(pts1, pts2, step, LUT) {
  var n = pts1.length;
  var LB = new Array(Math.floor(n / step) + 1);
  var SAT = new Array(n);
  LB[0] = 0;
  for (var i = 0; i < n; i++) {
    var x = Math.round(pts1[i].IntX / LUTScaleFactor);
    var y = Math.round(pts1[i].IntY / LUTScaleFactor);
    var index = LUT[x][y];
    var d = SqrEuclideanDistance(pts1[i], pts2[index]);
    SAT[i] = i == 0 ? d : SAT[i - 1] + d;
    LB[0] += (n - i) * d;
  }
  for (var i = step, j = 1; i < n; i += step, j++)
    LB[j] = LB[0] + i * SAT[n - 1] - n * SAT[i - 1];
  return LB;
}
function Resample(points2, n) {
  var I = PathLength(points2) / (n - 1);
  var D = 0;
  var newpoints = new Array(points2[0]);
  for (var i = 1; i < points2.length; i++) {
    if (points2[i].ID == points2[i - 1].ID) {
      var d = EuclideanDistance(points2[i - 1], points2[i]);
      if (D + d >= I) {
        var qx = points2[i - 1].X + (I - D) / d * (points2[i].X - points2[i - 1].X);
        var qy = points2[i - 1].Y + (I - D) / d * (points2[i].Y - points2[i - 1].Y);
        var q = new Point(qx, qy, points2[i].ID);
        newpoints[newpoints.length] = q;
        points2.splice(i, 0, q);
        D = 0;
      } else
        D += d;
    }
  }
  if (newpoints.length == n - 1)
    newpoints[newpoints.length] = new Point(points2[points2.length - 1].X, points2[points2.length - 1].Y, points2[points2.length - 1].ID);
  return newpoints;
}
function Scale(points2) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0; i < points2.length; i++) {
    minX = Math.min(minX, points2[i].X);
    minY = Math.min(minY, points2[i].Y);
    maxX = Math.max(maxX, points2[i].X);
    maxY = Math.max(maxY, points2[i].Y);
  }
  var size = Math.max(maxX - minX, maxY - minY);
  var newpoints = new Array();
  for (var i = 0; i < points2.length; i++) {
    var qx = (points2[i].X - minX) / size;
    var qy = (points2[i].Y - minY) / size;
    newpoints[newpoints.length] = new Point(qx, qy, points2[i].ID);
  }
  return newpoints;
}
function TranslateTo(points2, pt) {
  var c = Centroid(points2);
  var newpoints = new Array();
  for (var i = 0; i < points2.length; i++) {
    var qx = points2[i].X + pt.X - c.X;
    var qy = points2[i].Y + pt.Y - c.Y;
    newpoints[newpoints.length] = new Point(qx, qy, points2[i].ID);
  }
  return newpoints;
}
function Centroid(points2) {
  var x = 0, y = 0;
  for (var i = 0; i < points2.length; i++) {
    x += points2[i].X;
    y += points2[i].Y;
  }
  x /= points2.length;
  y /= points2.length;
  return new Point(x, y, 0);
}
function PathLength(points2) {
  var d = 0;
  for (var i = 1; i < points2.length; i++) {
    if (points2[i].ID == points2[i - 1].ID)
      d += EuclideanDistance(points2[i - 1], points2[i]);
  }
  return d;
}
function MakeIntCoords(points2) {
  for (var i = 0; i < points2.length; i++) {
    points2[i].IntX = Math.round((points2[i].X + 1) / 2 * (MaxIntCoord - 1));
    points2[i].IntY = Math.round((points2[i].Y + 1) / 2 * (MaxIntCoord - 1));
  }
  return points2;
}
function ComputeLUT(points2) {
  var LUT = new Array();
  for (var i = 0; i < LUTSize; i++)
    LUT[i] = new Array();
  for (var x = 0; x < LUTSize; x++) {
    for (var y = 0; y < LUTSize; y++) {
      var u = -1;
      var b = Infinity;
      for (var i = 0; i < points2.length; i++) {
        var row = Math.round(points2[i].IntX / LUTScaleFactor);
        var col = Math.round(points2[i].IntY / LUTScaleFactor);
        var d = (row - x) * (row - x) + (col - y) * (col - y);
        if (d < b) {
          b = d;
          u = i;
        }
      }
      LUT[x][y] = u;
    }
  }
  return LUT;
}
function SqrEuclideanDistance(pt1, pt2) {
  var dx = pt2.X - pt1.X;
  var dy = pt2.Y - pt1.Y;
  return dx * dx + dy * dy;
}
function EuclideanDistance(pt1, pt2) {
  var s = SqrEuclideanDistance(pt1, pt2);
  return Math.sqrt(s);
}
var qdollar_default = QDollarRecognizer;

// app/recognizers/WritingRecognizerChars.js
var strokes = [
  {
    name: "1",
    strokes: [
      [
        {
          x: -3.7670553029541907,
          y: -0.39642392860730524
        },
        {
          x: -3.7670553029541907,
          y: -0.39642392860730524
        },
        {
          x: -3.7670553029541907,
          y: -0.39642392860730524
        },
        {
          x: -3.7670553029541907,
          y: -0.39642392860730524
        },
        {
          x: -3.7670553029541907,
          y: -0.39642392860730524
        },
        {
          x: -3.8399312795166907,
          y: -0.39642392860730524
        },
        {
          x: -3.8399312795166907,
          y: -0.39642392860730524
        },
        {
          x: -3.9128072560791907,
          y: -0.39642392860730524
        },
        {
          x: -3.9674642385010657,
          y: -0.39642392860730524
        },
        {
          x: -3.9674642385010657,
          y: -0.39642392860730524
        },
        {
          x: -4.040340215063566,
          y: -0.46005307899793024
        },
        {
          x: -4.040340215063566,
          y: -0.5364080594666802
        },
        {
          x: -4.094997197485441,
          y: -0.5364080594666802
        },
        {
          x: -4.167873174047941,
          y: -0.5364080594666802
        },
        {
          x: -4.167873174047941,
          y: -0.6000372098573052
        },
        {
          x: -4.240749150610441,
          y: -0.6000372098573052
        },
        {
          x: -4.240749150610441,
          y: -0.6000372098573052
        },
        {
          x: -4.240749150610441,
          y: -0.6636663602479302
        },
        {
          x: -4.295406133032316,
          y: -0.6636663602479302
        },
        {
          x: -4.295406133032316,
          y: -0.6636663602479302
        },
        {
          x: -4.295406133032316,
          y: -0.7272955106385552
        },
        {
          x: -4.295406133032316,
          y: -0.7272955106385552
        },
        {
          x: -4.295406133032316,
          y: -0.7272955106385552
        },
        {
          x: -4.295406133032316,
          y: -0.7909246610291802
        },
        {
          x: -4.295406133032316,
          y: -0.7909246610291802
        },
        {
          x: -4.295406133032316,
          y: -0.7909246610291802
        },
        {
          x: -4.295406133032316,
          y: -0.8672796414979302
        },
        {
          x: -4.295406133032316,
          y: -0.8672796414979302
        },
        {
          x: -4.295406133032316,
          y: -0.9309087918885552
        },
        {
          x: -4.295406133032316,
          y: -0.9309087918885552
        },
        {
          x: -4.295406133032316,
          y: -0.9945379422791802
        },
        {
          x: -4.295406133032316,
          y: -1.0581670926698052
        },
        {
          x: -4.295406133032316,
          y: -1.1217962430604302
        },
        {
          x: -4.295406133032316,
          y: -1.1217962430604302
        },
        {
          x: -4.295406133032316,
          y: -1.1981512235291802
        },
        {
          x: -4.295406133032316,
          y: -1.2617803739198052
        },
        {
          x: -4.295406133032316,
          y: -1.3254095243104302
        },
        {
          x: -4.240749150610441,
          y: -1.3890386747010552
        },
        {
          x: -4.167873174047941,
          y: -1.5290228055604302
        },
        {
          x: -4.094997197485441,
          y: -1.5926519559510552
        },
        {
          x: -3.9674642385010657,
          y: -1.7199102567323052
        },
        {
          x: -3.8399312795166907,
          y: -1.8598943875916802
        },
        {
          x: -3.7670553029541907,
          y: -1.9235235379823052
        },
        {
          x: -3.6395223439698157,
          y: -2.1144109891541802
        },
        {
          x: -3.5119893849854407,
          y: -2.2543951200135552
        },
        {
          x: -3.3662374318604407,
          y: -2.3180242704041802
        },
        {
          x: -3.3115804494385657,
          y: -2.5216375516541802
        },
        {
          x: -3.1840474904541907,
          y: -2.6488958524354302
        },
        {
          x: -3.0382955373291907,
          y: -2.7761541532166802
        },
        {
          x: -2.9107625783448157,
          y: -2.9161382840760552
        },
        {
          x: -2.7832296193604407,
          y: -3.0433965848573052
        },
        {
          x: -2.6374776662354407,
          y: -3.2470098661073052
        },
        {
          x: -2.5828206838135657,
          y: -3.3742681668885552
        },
        {
          x: -2.4552877248291907,
          y: -3.5142522977479302
        },
        {
          x: -2.3095357717041907,
          y: -3.6415105985291802
        },
        {
          x: -2.1820028127198157,
          y: -3.8451238797791802
        },
        {
          x: -2.0544698537354407,
          y: -3.9723821805604302
        },
        {
          x: -1.9815938771729407,
          y: -4.17599546181043
        },
        {
          x: -1.8540609181885657,
          y: -4.30325376259168
        },
        {
          x: -1.7265279592041907,
          y: -4.50686704384168
        },
        {
          x: -1.5807760060791907,
          y: -4.697754495013555
        },
        {
          x: -1.4532430470948157,
          y: -4.901367776263555
        },
        {
          x: -1.3803670705323157,
          y: -5.028626077044805
        },
        {
          x: -1.2528341115479407,
          y: -5.232239358294805
        },
        {
          x: -1.1253011525635657,
          y: -5.435852639544805
        },
        {
          x: -1.0524251760010657,
          y: -5.563110940326055
        },
        {
          x: -0.9248922170166907,
          y: -5.766724221576055
        },
        {
          x: -0.7973592580323157,
          y: -5.95761167274793
        },
        {
          x: -0.7244832814698157,
          y: -6.16122495399793
        },
        {
          x: -0.6516073049073157,
          y: -6.28848325477918
        },
        {
          x: -0.5969503224854407,
          y: -6.428467385638555
        },
        {
          x: -0.46941736350106567,
          y: -6.555725686419805
        },
        {
          x: -0.39654138693856567,
          y: -6.759338967669805
        },
        {
          x: -0.32366541037606567,
          y: -6.82296811806043
        },
        {
          x: -0.26900842795419067,
          y: -6.95022641884168
        },
        {
          x: -0.19613245139169067,
          y: -7.013855569232305
        },
        {
          x: -0.12325647482919067,
          y: -7.15383970009168
        },
        {
          x: -0.06859949240731567,
          y: -7.217468850482305
        },
        {
          x: -0.06859949240731567,
          y: -7.28109800087293
        },
        {
          x: 0.004276484155184335,
          y: -7.344727151263555
        },
        {
          x: 0.004276484155184335,
          y: -7.421082131732305
        },
        {
          x: 0.07715246071768433,
          y: -7.48471128212293
        },
        {
          x: 0.07715246071768433,
          y: -7.548340432513555
        },
        {
          x: 0.07715246071768433,
          y: -7.61196958290418
        },
        {
          x: 0.13180944313955933,
          y: -7.675598733294805
        },
        {
          x: 0.13180944313955933,
          y: -7.751953713763555
        },
        {
          x: 0.13180944313955933,
          y: -7.751953713763555
        },
        {
          x: 0.20468541970205933,
          y: -7.81558286415418
        },
        {
          x: 0.20468541970205933,
          y: -7.81558286415418
        },
        {
          x: 0.20468541970205933,
          y: -7.879212014544805
        },
        {
          x: 0.25934240212393433,
          y: -7.94284116493543
        },
        {
          x: 0.25934240212393433,
          y: -8.006470315326055
        },
        {
          x: 0.33221837868643433,
          y: -8.006470315326055
        },
        {
          x: 0.33221837868643433,
          y: -8.082825295794805
        },
        {
          x: 0.33221837868643433,
          y: -8.082825295794805
        },
        {
          x: 0.40509435524893433,
          y: -8.082825295794805
        },
        {
          x: 0.40509435524893433,
          y: -8.14645444618543
        },
        {
          x: 0.40509435524893433,
          y: -8.14645444618543
        },
        {
          x: 0.40509435524893433,
          y: -8.14645444618543
        },
        {
          x: 0.40509435524893433,
          y: -8.14645444618543
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.40509435524893433,
          y: -8.210083596576055
        },
        {
          x: 0.45975133767080933,
          y: -8.210083596576055
        },
        {
          x: 0.45975133767080933,
          y: -8.210083596576055
        },
        {
          x: 0.45975133767080933,
          y: -8.210083596576055
        },
        {
          x: 0.5326273142333093,
          y: -8.210083596576055
        },
        {
          x: 0.5326273142333093,
          y: -8.210083596576055
        },
        {
          x: 0.5326273142333093,
          y: -8.210083596576055
        },
        {
          x: 0.6055032907958093,
          y: -8.210083596576055
        },
        {
          x: 0.6055032907958093,
          y: -8.210083596576055
        },
        {
          x: 0.6055032907958093,
          y: -8.210083596576055
        },
        {
          x: 0.6601602732176843,
          y: -8.210083596576055
        },
        {
          x: 0.6601602732176843,
          y: -8.210083596576055
        },
        {
          x: 0.7330362497801843,
          y: -8.210083596576055
        },
        {
          x: 0.7330362497801843,
          y: -8.210083596576055
        },
        {
          x: 0.7330362497801843,
          y: -8.210083596576055
        },
        {
          x: 0.7876932322020593,
          y: -8.210083596576055
        },
        {
          x: 0.7876932322020593,
          y: -8.210083596576055
        },
        {
          x: 0.8605692087645593,
          y: -8.210083596576055
        },
        {
          x: 0.8605692087645593,
          y: -8.210083596576055
        },
        {
          x: 0.8605692087645593,
          y: -8.210083596576055
        },
        {
          x: 0.9334451853270593,
          y: -8.210083596576055
        },
        {
          x: 0.9334451853270593,
          y: -8.210083596576055
        },
        {
          x: 0.9334451853270593,
          y: -8.210083596576055
        },
        {
          x: 0.9881021677489343,
          y: -8.210083596576055
        },
        {
          x: 0.9881021677489343,
          y: -8.210083596576055
        },
        {
          x: 0.9881021677489343,
          y: -8.210083596576055
        },
        {
          x: 1.0609781443114343,
          y: -8.210083596576055
        },
        {
          x: 1.0609781443114343,
          y: -8.210083596576055
        },
        {
          x: 1.0609781443114343,
          y: -8.210083596576055
        },
        {
          x: 1.1338541208739343,
          y: -8.210083596576055
        },
        {
          x: 1.1338541208739343,
          y: -8.210083596576055
        },
        {
          x: 1.1885111032958093,
          y: -8.210083596576055
        },
        {
          x: 1.1885111032958093,
          y: -8.210083596576055
        },
        {
          x: 1.1885111032958093,
          y: -8.27371274696668
        },
        {
          x: 1.2613870798583093,
          y: -8.27371274696668
        },
        {
          x: 1.2613870798583093,
          y: -8.27371274696668
        },
        {
          x: 1.3342630564208093,
          y: -8.27371274696668
        },
        {
          x: 1.3342630564208093,
          y: -8.27371274696668
        },
        {
          x: 1.3342630564208093,
          y: -8.337341897357305
        },
        {
          x: 1.3342630564208093,
          y: -8.337341897357305
        },
        {
          x: 1.3889200388426843,
          y: -8.337341897357305
        },
        {
          x: 1.3889200388426843,
          y: -8.337341897357305
        },
        {
          x: 1.3889200388426843,
          y: -8.337341897357305
        },
        {
          x: 1.4617960154051843,
          y: -8.337341897357305
        },
        {
          x: 1.4617960154051843,
          y: -8.413696877826055
        },
        {
          x: 1.4617960154051843,
          y: -8.413696877826055
        },
        {
          x: 1.4617960154051843,
          y: -8.413696877826055
        },
        {
          x: 1.5164529978270593,
          y: -8.413696877826055
        },
        {
          x: 1.5164529978270593,
          y: -8.413696877826055
        },
        {
          x: 1.5164529978270593,
          y: -8.413696877826055
        },
        {
          x: 1.5164529978270593,
          y: -8.413696877826055
        },
        {
          x: 1.5893289743895593,
          y: -8.413696877826055
        },
        {
          x: 1.5893289743895593,
          y: -8.413696877826055
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.47732602821668
        },
        {
          x: 1.5893289743895593,
          y: -8.413696877826055
        },
        {
          x: 1.5893289743895593,
          y: -8.337341897357305
        },
        {
          x: 1.5893289743895593,
          y: -8.210083596576055
        },
        {
          x: 1.5893289743895593,
          y: -8.082825295794805
        },
        {
          x: 1.5893289743895593,
          y: -7.94284116493543
        },
        {
          x: 1.5893289743895593,
          y: -7.81558286415418
        },
        {
          x: 1.5893289743895593,
          y: -7.61196958290418
        },
        {
          x: 1.5893289743895593,
          y: -7.421082131732305
        },
        {
          x: 1.5893289743895593,
          y: -7.217468850482305
        },
        {
          x: 1.5893289743895593,
          y: -6.95022641884168
        },
        {
          x: 1.5893289743895593,
          y: -6.682983987201055
        },
        {
          x: 1.5893289743895593,
          y: -6.428467385638555
        },
        {
          x: 1.5893289743895593,
          y: -6.097595803607305
        },
        {
          x: 1.5893289743895593,
          y: -5.766724221576055
        },
        {
          x: 1.5893289743895593,
          y: -5.435852639544805
        },
        {
          x: 1.5164529978270593,
          y: -5.028626077044805
        },
        {
          x: 1.4617960154051843,
          y: -4.63412534462293
        },
        {
          x: 1.4617960154051843,
          y: -4.239624612201055
        },
        {
          x: 1.3889200388426843,
          y: -3.7051397489198052
        },
        {
          x: 1.3342630564208093,
          y: -3.3106390164979302
        },
        {
          x: 1.2613870798583093,
          y: -2.8525091336854302
        },
        {
          x: 1.1885111032958093,
          y: -2.3816534207948052
        },
        {
          x: 1.1885111032958093,
          y: -1.9235235379823052
        },
        {
          x: 1.1338541208739343,
          y: -1.5290228055604302
        },
        {
          x: 1.0609781443114343,
          y: -0.9945379422791802
        },
        {
          x: 1.0609781443114343,
          y: -0.6000372098573052
        },
        {
          x: 1.0609781443114343,
          y: -0.20553647743543024
        },
        {
          x: 0.9881021677489343,
          y: 0.20169008506456976
        },
        {
          x: 0.9881021677489343,
          y: 0.5961908174864448
        },
        {
          x: 0.9881021677489343,
          y: 0.9906915499083198
        },
        {
          x: 0.9881021677489343,
          y: 1.4488214327208198
        },
        {
          x: 0.9881021677489343,
          y: 1.7796930147520698
        },
        {
          x: 0.9881021677489343,
          y: 2.1105645967833198
        },
        {
          x: 0.9881021677489343,
          y: 2.4414361788145698
        },
        {
          x: 0.9881021677489343,
          y: 2.7086786104551948
        },
        {
          x: 0.9881021677489343,
          y: 3.0395501924864448
        },
        {
          x: 0.9881021677489343,
          y: 3.3704217745176948
        },
        {
          x: 0.9881021677489343,
          y: 3.7012933565489448
        },
        {
          x: 0.9881021677489343,
          y: 3.9685357881895698
        },
        {
          x: 0.9881021677489343,
          y: 4.17214906943957
        },
        {
          x: 0.9881021677489343,
          y: 4.439391501080195
        },
        {
          x: 0.9881021677489343,
          y: 4.693908102642695
        },
        {
          x: 0.9881021677489343,
          y: 5.024779684673945
        },
        {
          x: 0.9881021677489343,
          y: 5.228392965923945
        },
        {
          x: 0.9881021677489343,
          y: 5.432006247173945
        },
        {
          x: 0.9881021677489343,
          y: 5.686522848736445
        },
        {
          x: 0.9881021677489343,
          y: 5.890136129986445
        },
        {
          x: 0.9881021677489343,
          y: 6.15737856162707
        },
        {
          x: 0.9881021677489343,
          y: 6.424620993267695
        },
        {
          x: 0.9881021677489343,
          y: 6.61550844443957
        },
        {
          x: 0.9881021677489343,
          y: 6.882750876080195
        },
        {
          x: 0.9881021677489343,
          y: 7.086364157330195
        },
        {
          x: 0.9881021677489343,
          y: 7.27725160850207
        },
        {
          x: 0.9881021677489343,
          y: 7.48086488975207
        },
        {
          x: 0.9881021677489343,
          y: 7.748107321392695
        },
        {
          x: 0.9881021677489343,
          y: 7.93899477256457
        },
        {
          x: 0.9881021677489343,
          y: 8.14260805381457
        },
        {
          x: 0.9881021677489343,
          y: 8.333495504986445
        },
        {
          x: 0.9881021677489343,
          y: 8.537108786236445
        },
        {
          x: 0.9881021677489343,
          y: 8.664367087017695
        },
        {
          x: 0.9881021677489343,
          y: 8.867980368267695
        },
        {
          x: 0.9881021677489343,
          y: 9.071593649517695
        },
        {
          x: 0.9881021677489343,
          y: 9.198851950298945
        },
        {
          x: 0.9881021677489343,
          y: 9.402465231548945
        },
        {
          x: 0.9881021677489343,
          y: 9.529723532330195
        },
        {
          x: 0.9881021677489343,
          y: 9.656981833111445
        },
        {
          x: 1.0609781443114343,
          y: 9.860595114361445
        },
        {
          x: 1.0609781443114343,
          y: 9.987853415142695
        },
        {
          x: 1.0609781443114343,
          y: 10.191466696392695
        },
        {
          x: 1.0609781443114343,
          y: 10.318724997173945
        },
        {
          x: 1.0609781443114343,
          y: 10.45870912803332
        },
        {
          x: 1.1338541208739343,
          y: 10.58596742881457
        },
        {
          x: 1.1338541208739343,
          y: 10.78958071006457
        },
        {
          x: 1.1338541208739343,
          y: 10.91683901084582
        },
        {
          x: 1.1338541208739343,
          y: 11.056823141705195
        },
        {
          x: 1.1338541208739343,
          y: 11.184081442486445
        },
        {
          x: 1.1338541208739343,
          y: 11.32406557334582
        },
        {
          x: 1.1338541208739343,
          y: 11.45132387412707
        },
        {
          x: 1.1338541208739343,
          y: 11.65493715537707
        },
        {
          x: 1.1338541208739343,
          y: 11.78219545615832
        },
        {
          x: 1.1338541208739343,
          y: 11.90945375693957
        },
        {
          x: 1.1338541208739343,
          y: 12.049437887798945
        },
        {
          x: 1.1338541208739343,
          y: 12.176696188580195
        },
        {
          x: 1.1338541208739343,
          y: 12.31668031943957
        },
        {
          x: 1.1338541208739343,
          y: 12.507567770611445
        },
        {
          x: 1.1338541208739343,
          y: 12.64755190147082
        },
        {
          x: 1.1338541208739343,
          y: 12.77481020225207
        },
        {
          x: 1.1338541208739343,
          y: 12.90206850303332
        },
        {
          x: 1.1338541208739343,
          y: 13.042052633892695
        },
        {
          x: 1.1338541208739343,
          y: 13.23294008506457
        },
        {
          x: 1.1338541208739343,
          y: 13.372924215923945
        },
        {
          x: 1.1338541208739343,
          y: 13.500182516705195
        },
        {
          x: 1.1338541208739343,
          y: 13.56381166709582
        },
        {
          x: 1.1338541208739343,
          y: 13.703795797955195
        },
        {
          x: 1.1338541208739343,
          y: 13.831054098736445
        },
        {
          x: 1.1338541208739343,
          y: 13.97103822959582
        },
        {
          x: 1.1338541208739343,
          y: 14.09829653037707
        },
        {
          x: 1.1338541208739343,
          y: 14.22555483115832
        },
        {
          x: 1.1338541208739343,
          y: 14.30190981162707
        },
        {
          x: 1.1338541208739343,
          y: 14.42916811240832
        },
        {
          x: 1.1338541208739343,
          y: 14.55642641318957
        },
        {
          x: 1.1338541208739343,
          y: 14.696410544048945
        },
        {
          x: 1.1338541208739343,
          y: 14.823668844830195
        },
        {
          x: 1.1338541208739343,
          y: 14.96365297568957
        },
        {
          x: 1.1338541208739343,
          y: 15.09091127647082
        },
        {
          x: 1.1338541208739343,
          y: 15.21816957725207
        },
        {
          x: 1.1338541208739343,
          y: 15.358153708111445
        },
        {
          x: 1.1338541208739343,
          y: 15.54904115928332
        },
        {
          x: 1.1338541208739343,
          y: 15.689025290142695
        },
        {
          x: 1.1338541208739343,
          y: 15.816283590923945
        },
        {
          x: 1.1338541208739343,
          y: 15.95626772178332
        },
        {
          x: 1.1338541208739343,
          y: 16.08352602256457
        },
        {
          x: 1.1338541208739343,
          y: 16.28713930381457
        },
        {
          x: 1.1338541208739343,
          y: 16.41439760459582
        },
        {
          x: 1.1338541208739343,
          y: 16.54165590537707
        },
        {
          x: 1.1338541208739343,
          y: 16.681640036236445
        },
        {
          x: 1.1338541208739343,
          y: 16.808898337017695
        },
        {
          x: 1.1338541208739343,
          y: 16.94888246787707
        },
        {
          x: 1.1338541208739343,
          y: 17.07614076865832
        },
        {
          x: 1.1338541208739343,
          y: 17.27975404990832
        },
        {
          x: 1.1338541208739343,
          y: 17.343383200298945
        },
        {
          x: 1.1338541208739343,
          y: 17.470641501080195
        },
        {
          x: 1.1338541208739343,
          y: 17.53427065147082
        },
        {
          x: 1.1338541208739343,
          y: 17.674254782330195
        },
        {
          x: 1.1338541208739343,
          y: 17.73788393272082
        },
        {
          x: 1.1338541208739343,
          y: 17.877868063580195
        },
        {
          x: 1.1338541208739343,
          y: 17.94149721397082
        },
        {
          x: 1.1338541208739343,
          y: 18.005126364361445
        },
        {
          x: 1.1338541208739343,
          y: 18.06875551475207
        },
        {
          x: 1.1338541208739343,
          y: 18.06875551475207
        },
        {
          x: 1.1338541208739343,
          y: 18.132384665142695
        },
        {
          x: 1.1338541208739343,
          y: 18.132384665142695
        }
      ]
    ]
  },
  {
    name: "2",
    strokes: [
      [
        {
          x: -5.179803240247168,
          y: -6.499231463436473
        },
        {
          x: -5.179803240247168,
          y: -6.499231463436473
        },
        {
          x: -5.179803240247168,
          y: -6.499231463436473
        },
        {
          x: -5.179803240247168,
          y: -6.499231463436473
        },
        {
          x: -5.179803240247168,
          y: -6.499231463436473
        },
        {
          x: -5.179803240247168,
          y: -6.422876482967723
        },
        {
          x: -5.179803240247168,
          y: -6.422876482967723
        },
        {
          x: -5.179803240247168,
          y: -6.359247332577098
        },
        {
          x: -5.179803240247168,
          y: -6.359247332577098
        },
        {
          x: -5.179803240247168,
          y: -6.295618182186473
        },
        {
          x: -5.179803240247168,
          y: -6.231989031795848
        },
        {
          x: -5.179803240247168,
          y: -6.168359881405223
        },
        {
          x: -5.234460222669043,
          y: -6.168359881405223
        },
        {
          x: -5.234460222669043,
          y: -6.092004900936473
        },
        {
          x: -5.234460222669043,
          y: -6.092004900936473
        },
        {
          x: -5.234460222669043,
          y: -6.028375750545848
        },
        {
          x: -5.307336199231543,
          y: -6.028375750545848
        },
        {
          x: -5.307336199231543,
          y: -5.964746600155223
        },
        {
          x: -5.307336199231543,
          y: -5.901117449764598
        },
        {
          x: -5.307336199231543,
          y: -5.901117449764598
        },
        {
          x: -5.361993181653418,
          y: -5.901117449764598
        },
        {
          x: -5.361993181653418,
          y: -5.837488299373973
        },
        {
          x: -5.361993181653418,
          y: -5.837488299373973
        },
        {
          x: -5.361993181653418,
          y: -5.837488299373973
        },
        {
          x: -5.361993181653418,
          y: -5.761133318905223
        },
        {
          x: -5.434869158215918,
          y: -5.761133318905223
        },
        {
          x: -5.434869158215918,
          y: -5.761133318905223
        },
        {
          x: -5.434869158215918,
          y: -5.761133318905223
        },
        {
          x: -5.434869158215918,
          y: -5.697504168514598
        },
        {
          x: -5.434869158215918,
          y: -5.697504168514598
        },
        {
          x: -5.507745134778418,
          y: -5.697504168514598
        },
        {
          x: -5.507745134778418,
          y: -5.697504168514598
        },
        {
          x: -5.507745134778418,
          y: -5.633875018123973
        },
        {
          x: -5.507745134778418,
          y: -5.633875018123973
        },
        {
          x: -5.562402117200293,
          y: -5.633875018123973
        },
        {
          x: -5.562402117200293,
          y: -5.570245867733348
        },
        {
          x: -5.562402117200293,
          y: -5.570245867733348
        },
        {
          x: -5.562402117200293,
          y: -5.570245867733348
        },
        {
          x: -5.635278093762793,
          y: -5.570245867733348
        },
        {
          x: -5.635278093762793,
          y: -5.506616717342723
        },
        {
          x: -5.635278093762793,
          y: -5.506616717342723
        },
        {
          x: -5.635278093762793,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.506616717342723
        },
        {
          x: -5.708154070325293,
          y: -5.570245867733348
        },
        {
          x: -5.708154070325293,
          y: -5.633875018123973
        },
        {
          x: -5.708154070325293,
          y: -5.697504168514598
        },
        {
          x: -5.708154070325293,
          y: -5.837488299373973
        },
        {
          x: -5.708154070325293,
          y: -5.964746600155223
        },
        {
          x: -5.635278093762793,
          y: -6.092004900936473
        },
        {
          x: -5.562402117200293,
          y: -6.231989031795848
        },
        {
          x: -5.507745134778418,
          y: -6.422876482967723
        },
        {
          x: -5.434869158215918,
          y: -6.562860613827098
        },
        {
          x: -5.307336199231543,
          y: -6.753748064998973
        },
        {
          x: -5.234460222669043,
          y: -6.957361346248973
        },
        {
          x: -5.106927263684668,
          y: -7.160974627498973
        },
        {
          x: -4.979394304700293,
          y: -7.351862078670848
        },
        {
          x: -4.833642351575293,
          y: -7.555475359920848
        },
        {
          x: -4.706109392590918,
          y: -7.746362811092723
        },
        {
          x: -4.633233416028418,
          y: -8.013605242733348
        },
        {
          x: -4.451043474622168,
          y: -8.280847674373973
        },
        {
          x: -4.305291521497168,
          y: -8.484460955623973
        },
        {
          x: -4.177758562512793,
          y: -8.675348406795848
        },
        {
          x: -4.050225603528418,
          y: -8.942590838436473
        },
        {
          x: -3.9044736504034177,
          y: -9.146204119686473
        },
        {
          x: -3.7769406914190427,
          y: -9.400720721248973
        },
        {
          x: -3.6494077324346677,
          y: -9.604334002498973
        },
        {
          x: -3.5218747734502927,
          y: -9.807947283748973
        },
        {
          x: -3.3761228203252927,
          y: -9.998834734920848
        },
        {
          x: -3.2485898613409177,
          y: -10.202448016170848
        },
        {
          x: -3.1210569023565427,
          y: -10.406061297420848
        },
        {
          x: -2.9935239433721677,
          y: -10.533319598202098
        },
        {
          x: -2.8477719902471677,
          y: -10.736932879452098
        },
        {
          x: -2.7202390312627927,
          y: -10.927820330623973
        },
        {
          x: -2.5927060722784177,
          y: -11.067804461483348
        },
        {
          x: -2.4469541191534177,
          y: -11.195062762264598
        },
        {
          x: -2.3194211601690427,
          y: -11.322321063045848
        },
        {
          x: -2.2647641777471677,
          y: -11.462305193905223
        },
        {
          x: -2.0643552422002927,
          y: -11.653192645077098
        },
        {
          x: -1.9914792656377927,
          y: -11.793176775936473
        },
        {
          x: -1.8639463066534177,
          y: -11.856805926327098
        },
        {
          x: -1.7364133476690427,
          y: -11.984064227108348
        },
        {
          x: -1.6635373711065427,
          y: -12.124048357967723
        },
        {
          x: -1.5360044121221677,
          y: -12.187677508358348
        },
        {
          x: -1.4631284355596677,
          y: -12.314935809139598
        },
        {
          x: -1.3355954765752927,
          y: -12.454919939998973
        },
        {
          x: -1.2627195000127927,
          y: -12.518549090389598
        },
        {
          x: -1.1898435234502927,
          y: -12.582178240780223
        },
        {
          x: -1.0623105644659177,
          y: -12.722162371639598
        },
        {
          x: -1.0076535820440427,
          y: -12.785791522030223
        },
        {
          x: -0.9347776054815427,
          y: -12.849420672420848
        },
        {
          x: -0.8072446464971677,
          y: -12.913049822811473
        },
        {
          x: -0.7343686699346677,
          y: -12.976678973202098
        },
        {
          x: -0.6614926933721677,
          y: -13.053033953670848
        },
        {
          x: -0.6068357109502927,
          y: -13.116663104061473
        },
        {
          x: -0.46108375782529265,
          y: -13.180292254452098
        },
        {
          x: -0.40642677540341765,
          y: -13.180292254452098
        },
        {
          x: -0.33355079884091765,
          y: -13.243921404842723
        },
        {
          x: -0.27889381641904265,
          y: -13.243921404842723
        },
        {
          x: -0.20601783985654265,
          y: -13.243921404842723
        },
        {
          x: -0.07848488087216765,
          y: -13.243921404842723
        },
        {
          x: -0.0056089043096676505,
          y: -13.243921404842723
        },
        {
          x: 0.12192405467470735,
          y: -13.243921404842723
        },
        {
          x: 0.19480003123720735,
          y: -13.243921404842723
        },
        {
          x: 0.32233299022158235,
          y: -13.243921404842723
        },
        {
          x: 0.39520896678408235,
          y: -13.243921404842723
        },
        {
          x: 0.5227419257684573,
          y: -13.243921404842723
        },
        {
          x: 0.5956179023309573,
          y: -13.243921404842723
        },
        {
          x: 0.7231508613153323,
          y: -13.243921404842723
        },
        {
          x: 0.7960268378778323,
          y: -13.243921404842723
        },
        {
          x: 0.9235597968622073,
          y: -13.243921404842723
        },
        {
          x: 0.9782167792840823,
          y: -13.243921404842723
        },
        {
          x: 1.1239687324090823,
          y: -13.243921404842723
        },
        {
          x: 1.2515016913934573,
          y: -13.243921404842723
        },
        {
          x: 1.3243776679559573,
          y: -13.243921404842723
        },
        {
          x: 1.4519106269403323,
          y: -13.243921404842723
        },
        {
          x: 1.5247866035028323,
          y: -13.243921404842723
        },
        {
          x: 1.6523195624872073,
          y: -13.243921404842723
        },
        {
          x: 1.7069765449090823,
          y: -13.243921404842723
        },
        {
          x: 1.8527284980340823,
          y: -13.243921404842723
        },
        {
          x: 1.9802614570184573,
          y: -13.243921404842723
        },
        {
          x: 2.0531374335809573,
          y: -13.243921404842723
        },
        {
          x: 2.1806703925653323,
          y: -13.243921404842723
        },
        {
          x: 2.2535463691278323,
          y: -13.243921404842723
        },
        {
          x: 2.3810793281122073,
          y: -13.243921404842723
        },
        {
          x: 2.5086122870965823,
          y: -13.243921404842723
        },
        {
          x: 2.5814882636590823,
          y: -13.243921404842723
        },
        {
          x: 2.6361452460809573,
          y: -13.243921404842723
        },
        {
          x: 2.7818971992059573,
          y: -13.243921404842723
        },
        {
          x: 2.8365541816278323,
          y: -13.243921404842723
        },
        {
          x: 2.9094301581903323,
          y: -13.243921404842723
        },
        {
          x: 3.0369631171747073,
          y: -13.243921404842723
        },
        {
          x: 3.1098390937372073,
          y: -13.243921404842723
        },
        {
          x: 3.2373720527215823,
          y: -13.243921404842723
        },
        {
          x: 3.3102480292840823,
          y: -13.243921404842723
        },
        {
          x: 3.3649050117059573,
          y: -13.243921404842723
        },
        {
          x: 3.5106569648309573,
          y: -13.243921404842723
        },
        {
          x: 3.5653139472528323,
          y: -13.180292254452098
        },
        {
          x: 3.6381899238153323,
          y: -13.116663104061473
        },
        {
          x: 3.7657228827997073,
          y: -13.116663104061473
        },
        {
          x: 3.8385988593622073,
          y: -13.053033953670848
        },
        {
          x: 3.8932558417840823,
          y: -13.053033953670848
        },
        {
          x: 3.9661318183465823,
          y: -12.976678973202098
        },
        {
          x: 4.039007794909082,
          y: -12.913049822811473
        },
        {
          x: 4.166540753893457,
          y: -12.913049822811473
        },
        {
          x: 4.239416730455957,
          y: -12.849420672420848
        },
        {
          x: 4.294073712877832,
          y: -12.785791522030223
        },
        {
          x: 4.366949689440332,
          y: -12.785791522030223
        },
        {
          x: 4.421606671862207,
          y: -12.722162371639598
        },
        {
          x: 4.494482648424707,
          y: -12.645807391170848
        },
        {
          x: 4.567358624987207,
          y: -12.582178240780223
        },
        {
          x: 4.622015607409082,
          y: -12.518549090389598
        },
        {
          x: 4.694891583971582,
          y: -12.518549090389598
        },
        {
          x: 4.767767560534082,
          y: -12.454919939998973
        },
        {
          x: 4.822424542955957,
          y: -12.391290789608348
        },
        {
          x: 4.895300519518457,
          y: -12.314935809139598
        },
        {
          x: 4.968176496080957,
          y: -12.251306658748973
        },
        {
          x: 5.022833478502832,
          y: -12.187677508358348
        },
        {
          x: 5.095709455065332,
          y: -12.124048357967723
        },
        {
          x: 5.095709455065332,
          y: -12.060419207577098
        },
        {
          x: 5.150366437487207,
          y: -11.920435076717723
        },
        {
          x: 5.223242414049707,
          y: -11.856805926327098
        },
        {
          x: 5.223242414049707,
          y: -11.793176775936473
        },
        {
          x: 5.296118390612207,
          y: -11.653192645077098
        },
        {
          x: 5.296118390612207,
          y: -11.589563494686473
        },
        {
          x: 5.296118390612207,
          y: -11.462305193905223
        },
        {
          x: 5.350775373034082,
          y: -11.398676043514598
        },
        {
          x: 5.350775373034082,
          y: -11.258691912655223
        },
        {
          x: 5.350775373034082,
          y: -11.131433611873973
        },
        {
          x: 5.350775373034082,
          y: -10.991449481014598
        },
        {
          x: 5.423651349596582,
          y: -10.864191180233348
        },
        {
          x: 5.423651349596582,
          y: -10.736932879452098
        },
        {
          x: 5.423651349596582,
          y: -10.533319598202098
        },
        {
          x: 5.423651349596582,
          y: -10.406061297420848
        },
        {
          x: 5.423651349596582,
          y: -10.202448016170848
        },
        {
          x: 5.423651349596582,
          y: -9.998834734920848
        },
        {
          x: 5.423651349596582,
          y: -9.807947283748973
        },
        {
          x: 5.423651349596582,
          y: -9.604334002498973
        },
        {
          x: 5.423651349596582,
          y: -9.400720721248973
        },
        {
          x: 5.423651349596582,
          y: -9.209833270077098
        },
        {
          x: 5.423651349596582,
          y: -9.006219988827098
        },
        {
          x: 5.423651349596582,
          y: -8.815332537655223
        },
        {
          x: 5.423651349596582,
          y: -8.611719256405223
        },
        {
          x: 5.496527326159082,
          y: -8.408105975155223
        },
        {
          x: 5.496527326159082,
          y: -8.217218523983348
        },
        {
          x: 5.496527326159082,
          y: -8.013605242733348
        },
        {
          x: 5.551184308580957,
          y: -7.822717791561473
        },
        {
          x: 5.551184308580957,
          y: -7.619104510311473
        },
        {
          x: 5.624060285143457,
          y: -7.491846209530223
        },
        {
          x: 5.624060285143457,
          y: -7.288232928280223
        },
        {
          x: 5.624060285143457,
          y: -7.084619647030223
        },
        {
          x: 5.696936261705957,
          y: -6.893732195858348
        },
        {
          x: 5.696936261705957,
          y: -6.690118914608348
        },
        {
          x: 5.751593244127832,
          y: -6.499231463436473
        },
        {
          x: 5.751593244127832,
          y: -6.295618182186473
        },
        {
          x: 5.751593244127832,
          y: -6.092004900936473
        },
        {
          x: 5.751593244127832,
          y: -5.901117449764598
        },
        {
          x: 5.751593244127832,
          y: -5.697504168514598
        },
        {
          x: 5.751593244127832,
          y: -5.506616717342723
        },
        {
          x: 5.751593244127832,
          y: -5.303003436092723
        },
        {
          x: 5.751593244127832,
          y: -5.099390154842723
        },
        {
          x: 5.751593244127832,
          y: -4.908502703670848
        },
        {
          x: 5.751593244127832,
          y: -4.641260272030223
        },
        {
          x: 5.751593244127832,
          y: -4.437646990780223
        },
        {
          x: 5.751593244127832,
          y: -4.246759539608348
        },
        {
          x: 5.751593244127832,
          y: -4.043146258358348
        },
        {
          x: 5.751593244127832,
          y: -3.915887957577098
        },
        {
          x: 5.751593244127832,
          y: -3.712274676327098
        },
        {
          x: 5.751593244127832,
          y: -3.521387225155223
        },
        {
          x: 5.751593244127832,
          y: -3.317773943905223
        },
        {
          x: 5.696936261705957,
          y: -3.114160662655223
        },
        {
          x: 5.624060285143457,
          y: -2.986902361873973
        },
        {
          x: 5.551184308580957,
          y: -2.783289080623973
        },
        {
          x: 5.496527326159082,
          y: -2.656030779842723
        },
        {
          x: 5.423651349596582,
          y: -2.452417498592723
        },
        {
          x: 5.296118390612207,
          y: -2.325159197811473
        },
        {
          x: 5.223242414049707,
          y: -2.121545916561473
        },
        {
          x: 5.150366437487207,
          y: -1.9942876157802232
        },
        {
          x: 5.022833478502832,
          y: -1.8543034849208482
        },
        {
          x: 4.968176496080957,
          y: -1.7270451841395982
        },
        {
          x: 4.895300519518457,
          y: -1.5234319028895982
        },
        {
          x: 4.767767560534082,
          y: -1.3961736021083482
        },
        {
          x: 4.694891583971582,
          y: -1.2689153013270982
        },
        {
          x: 4.567358624987207,
          y: -1.1289311704677232
        },
        {
          x: 4.421606671862207,
          y: -1.0016728696864732
        },
        {
          x: 4.294073712877832,
          y: -0.8616887388270982
        },
        {
          x: 4.166540753893457,
          y: -0.6708012876552232
        },
        {
          x: 4.039007794909082,
          y: -0.5308171567958482
        },
        {
          x: 3.8932558417840823,
          y: -0.4035588560145982
        },
        {
          x: 3.7657228827997073,
          y: -0.2763005552333482
        },
        {
          x: 3.6381899238153323,
          y: -0.13631642437397318
        },
        {
          x: 3.5106569648309573,
          y: 0.05457102679790182
        },
        {
          x: 3.3649050117059573,
          y: 0.2581843080479018
        },
        {
          x: 3.1644960761590823,
          y: 0.3854426088291518
        },
        {
          x: 3.0369631171747073,
          y: 0.5254267396885268
        },
        {
          x: 2.9094301581903323,
          y: 0.6526850404697768
        },
        {
          x: 2.7818971992059573,
          y: 0.8562983217197768
        },
        {
          x: 2.5814882636590823,
          y: 0.9835566225010268
        },
        {
          x: 2.4357363105340823,
          y: 1.1871699037510268
        },
        {
          x: 2.3082033515497073,
          y: 1.3144282045322768
        },
        {
          x: 2.1806703925653323,
          y: 1.4544123353916518
        },
        {
          x: 2.0531374335809573,
          y: 1.5816706361729018
        },
        {
          x: 1.9073854804559573,
          y: 1.7089289369541518
        },
        {
          x: 1.7798525214715823,
          y: 1.8489130678135268
        },
        {
          x: 1.6523195624872073,
          y: 2.039800518985402
        },
        {
          x: 1.5247866035028323,
          y: 2.116155499454152
        },
        {
          x: 1.3790346503778323,
          y: 2.243413800235402
        },
        {
          x: 1.2515016913934573,
          y: 2.370672101016652
        },
        {
          x: 1.1239687324090823,
          y: 2.510656231876027
        },
        {
          x: 1.0510927558465823,
          y: 2.637914532657277
        },
        {
          x: 0.8506838202997073,
          y: 2.841527813907277
        },
        {
          x: 0.7960268378778323,
          y: 2.968786114688527
        },
        {
          x: 0.6502748847528323,
          y: 3.108770245547902
        },
        {
          x: 0.5227419257684573,
          y: 3.236028546329152
        },
        {
          x: 0.39520896678408235,
          y: 3.363286847110402
        },
        {
          x: 0.26767600779970735,
          y: 3.503270977969777
        },
        {
          x: 0.12192405467470735,
          y: 3.630529278751027
        },
        {
          x: -0.0056089043096676505,
          y: 3.834142560001027
        },
        {
          x: -0.13314186329404265,
          y: 3.961400860782277
        },
        {
          x: -0.27889381641904265,
          y: 4.101384991641652
        },
        {
          x: -0.33355079884091765,
          y: 4.228643292422902
        },
        {
          x: -0.46108375782529265,
          y: 4.355901593204152
        },
        {
          x: -0.6068357109502927,
          y: 4.495885724063527
        },
        {
          x: -0.7343686699346677,
          y: 4.623144024844777
        },
        {
          x: -0.8619016289190427,
          y: 4.763128155704152
        },
        {
          x: -1.0076535820440427,
          y: 4.954015606876027
        },
        {
          x: -1.0623105644659177,
          y: 5.093999737735402
        },
        {
          x: -1.1898435234502927,
          y: 5.221258038516652
        },
        {
          x: -1.3355954765752927,
          y: 5.361242169376027
        },
        {
          x: -1.4631284355596677,
          y: 5.488500470157277
        },
        {
          x: -1.5906613945440427,
          y: 5.615758770938527
        },
        {
          x: -1.7364133476690427,
          y: 5.819372052188527
        },
        {
          x: -1.7910703300909177,
          y: 5.946630352969777
        },
        {
          x: -1.9186032890752927,
          y: 6.086614483829152
        },
        {
          x: -2.0643552422002927,
          y: 6.277501935001027
        },
        {
          x: -2.1918882011846677,
          y: 6.417486065860402
        },
        {
          x: -2.3194211601690427,
          y: 6.544744366641652
        },
        {
          x: -2.3922971367315427,
          y: 6.684728497501027
        },
        {
          x: -2.5198300957159177,
          y: 6.811986798282277
        },
        {
          x: -2.6473630547002927,
          y: 6.939245099063527
        },
        {
          x: -2.7931150078252927,
          y: 7.142858380313527
        },
        {
          x: -2.8477719902471677,
          y: 7.270116681094777
        },
        {
          x: -2.9935239433721677,
          y: 7.410100811954152
        },
        {
          x: -3.0481809257940427,
          y: 7.537359112735402
        },
        {
          x: -3.1757138847784177,
          y: 7.677343243594777
        },
        {
          x: -3.2485898613409177,
          y: 7.868230694766652
        },
        {
          x: -3.3761228203252927,
          y: 8.008214825626027
        },
        {
          x: -3.5218747734502927,
          y: 8.199102276797902
        },
        {
          x: -3.5765317558721677,
          y: 8.339086407657277
        },
        {
          x: -3.7222837089971677,
          y: 8.466344708438527
        },
        {
          x: -3.7769406914190427,
          y: 8.593603009219777
        },
        {
          x: -3.8498166679815427,
          y: 8.797216290469777
        },
        {
          x: -3.9773496269659177,
          y: 8.924474591251027
        },
        {
          x: -4.050225603528418,
          y: 9.064458722110402
        },
        {
          x: -4.104882585950293,
          y: 9.191717022891652
        },
        {
          x: -4.250634539075293,
          y: 9.331701153751027
        },
        {
          x: -4.305291521497168,
          y: 9.458959454532277
        },
        {
          x: -4.378167498059668,
          y: 9.662572735782277
        },
        {
          x: -4.451043474622168,
          y: 9.789831036563527
        },
        {
          x: -4.505700457044043,
          y: 9.917089337344777
        },
        {
          x: -4.578576433606543,
          y: 9.993444317813527
        },
        {
          x: -4.633233416028418,
          y: 10.120702618594777
        },
        {
          x: -4.706109392590918,
          y: 10.184331768985402
        },
        {
          x: -4.778985369153418,
          y: 10.324315899844777
        },
        {
          x: -4.778985369153418,
          y: 10.387945050235402
        },
        {
          x: -4.833642351575293,
          y: 10.451574200626027
        },
        {
          x: -4.833642351575293,
          y: 10.515203351016652
        },
        {
          x: -4.833642351575293,
          y: 10.578832501407277
        },
        {
          x: -4.906518328137793,
          y: 10.655187481876027
        },
        {
          x: -4.906518328137793,
          y: 10.655187481876027
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.718816632266652
        },
        {
          x: -4.906518328137793,
          y: 10.782445782657277
        },
        {
          x: -4.906518328137793,
          y: 10.782445782657277
        },
        {
          x: -4.906518328137793,
          y: 10.846074933047902
        },
        {
          x: -4.906518328137793,
          y: 10.846074933047902
        },
        {
          x: -4.906518328137793,
          y: 10.909704083438527
        },
        {
          x: -4.906518328137793,
          y: 10.986059063907277
        },
        {
          x: -4.906518328137793,
          y: 11.049688214297902
        },
        {
          x: -4.979394304700293,
          y: 11.113317364688527
        },
        {
          x: -4.979394304700293,
          y: 11.176946515079152
        },
        {
          x: -4.979394304700293,
          y: 11.176946515079152
        },
        {
          x: -4.979394304700293,
          y: 11.240575665469777
        },
        {
          x: -5.034051287122168,
          y: 11.316930645938527
        },
        {
          x: -5.034051287122168,
          y: 11.380559796329152
        },
        {
          x: -5.034051287122168,
          y: 11.444188946719777
        },
        {
          x: -5.034051287122168,
          y: 11.507818097110402
        },
        {
          x: -5.034051287122168,
          y: 11.584173077579152
        },
        {
          x: -5.034051287122168,
          y: 11.647802227969777
        },
        {
          x: -5.034051287122168,
          y: 11.711431378360402
        },
        {
          x: -5.106927263684668,
          y: 11.711431378360402
        },
        {
          x: -5.106927263684668,
          y: 11.775060528751027
        },
        {
          x: -5.106927263684668,
          y: 11.838689679141652
        },
        {
          x: -5.106927263684668,
          y: 11.838689679141652
        },
        {
          x: -5.106927263684668,
          y: 11.915044659610402
        },
        {
          x: -5.106927263684668,
          y: 11.915044659610402
        },
        {
          x: -5.106927263684668,
          y: 11.978673810001027
        },
        {
          x: -5.106927263684668,
          y: 11.978673810001027
        },
        {
          x: -5.106927263684668,
          y: 12.042302960391652
        },
        {
          x: -5.106927263684668,
          y: 12.042302960391652
        },
        {
          x: -5.106927263684668,
          y: 12.042302960391652
        },
        {
          x: -5.106927263684668,
          y: 12.105932110782277
        },
        {
          x: -5.106927263684668,
          y: 12.105932110782277
        },
        {
          x: -5.106927263684668,
          y: 12.105932110782277
        },
        {
          x: -5.106927263684668,
          y: 12.105932110782277
        },
        {
          x: -5.106927263684668,
          y: 12.169561261172902
        },
        {
          x: -5.106927263684668,
          y: 12.169561261172902
        },
        {
          x: -5.106927263684668,
          y: 12.169561261172902
        },
        {
          x: -5.034051287122168,
          y: 12.169561261172902
        },
        {
          x: -4.979394304700293,
          y: 12.169561261172902
        },
        {
          x: -4.906518328137793,
          y: 12.169561261172902
        },
        {
          x: -4.833642351575293,
          y: 12.169561261172902
        },
        {
          x: -4.778985369153418,
          y: 12.169561261172902
        },
        {
          x: -4.633233416028418,
          y: 12.169561261172902
        },
        {
          x: -4.505700457044043,
          y: 12.169561261172902
        },
        {
          x: -4.378167498059668,
          y: 12.169561261172902
        },
        {
          x: -4.305291521497168,
          y: 12.169561261172902
        },
        {
          x: -4.104882585950293,
          y: 12.169561261172902
        },
        {
          x: -3.9773496269659177,
          y: 12.169561261172902
        },
        {
          x: -3.8498166679815427,
          y: 12.169561261172902
        },
        {
          x: -3.6494077324346677,
          y: 12.169561261172902
        },
        {
          x: -3.4489987968877927,
          y: 12.169561261172902
        },
        {
          x: -3.2485898613409177,
          y: 12.105932110782277
        },
        {
          x: -3.0481809257940427,
          y: 12.042302960391652
        },
        {
          x: -2.8477719902471677,
          y: 11.978673810001027
        },
        {
          x: -2.6473630547002927,
          y: 11.915044659610402
        },
        {
          x: -2.4469541191534177,
          y: 11.838689679141652
        },
        {
          x: -2.1918882011846677,
          y: 11.775060528751027
        },
        {
          x: -1.9914792656377927,
          y: 11.711431378360402
        },
        {
          x: -1.7364133476690427,
          y: 11.647802227969777
        },
        {
          x: -1.5360044121221677,
          y: 11.584173077579152
        },
        {
          x: -1.2627195000127927,
          y: 11.507818097110402
        },
        {
          x: -1.0076535820440427,
          y: 11.444188946719777
        },
        {
          x: -0.7343686699346677,
          y: 11.380559796329152
        },
        {
          x: -0.5339597343877927,
          y: 11.380559796329152
        },
        {
          x: -0.33355079884091765,
          y: 11.380559796329152
        },
        {
          x: -0.07848488087216765,
          y: 11.316930645938527
        },
        {
          x: 0.12192405467470735,
          y: 11.316930645938527
        },
        {
          x: 0.39520896678408235,
          y: 11.316930645938527
        },
        {
          x: 0.6502748847528323,
          y: 11.316930645938527
        },
        {
          x: 0.8506838202997073,
          y: 11.316930645938527
        },
        {
          x: 1.0510927558465823,
          y: 11.316930645938527
        },
        {
          x: 1.2515016913934573,
          y: 11.316930645938527
        },
        {
          x: 1.4519106269403323,
          y: 11.316930645938527
        },
        {
          x: 1.7069765449090823,
          y: 11.316930645938527
        },
        {
          x: 1.9073854804559573,
          y: 11.316930645938527
        },
        {
          x: 2.1077944160028323,
          y: 11.316930645938527
        },
        {
          x: 2.3082033515497073,
          y: 11.316930645938527
        },
        {
          x: 2.5086122870965823,
          y: 11.316930645938527
        },
        {
          x: 2.6361452460809573,
          y: 11.316930645938527
        },
        {
          x: 2.9094301581903323,
          y: 11.316930645938527
        },
        {
          x: 3.0369631171747073,
          y: 11.380559796329152
        },
        {
          x: 3.2373720527215823,
          y: 11.444188946719777
        },
        {
          x: 3.4377809882684573,
          y: 11.507818097110402
        },
        {
          x: 3.5653139472528323,
          y: 11.584173077579152
        },
        {
          x: 3.7657228827997073,
          y: 11.711431378360402
        },
        {
          x: 3.9661318183465823,
          y: 11.775060528751027
        },
        {
          x: 4.166540753893457,
          y: 11.838689679141652
        },
        {
          x: 4.294073712877832,
          y: 11.978673810001027
        },
        {
          x: 4.494482648424707,
          y: 12.042302960391652
        },
        {
          x: 4.622015607409082,
          y: 12.105932110782277
        },
        {
          x: 4.822424542955957,
          y: 12.245916241641652
        },
        {
          x: 5.022833478502832,
          y: 12.309545392032277
        },
        {
          x: 5.150366437487207,
          y: 12.436803692813527
        },
        {
          x: 5.350775373034082,
          y: 12.500432843204152
        },
        {
          x: 5.496527326159082,
          y: 12.640416974063527
        },
        {
          x: 5.696936261705957,
          y: 12.704046124454152
        },
        {
          x: 5.824469220690332,
          y: 12.831304425235402
        },
        {
          x: 6.079535138659082,
          y: 12.907659405704152
        },
        {
          x: 6.225287091784082,
          y: 12.971288556094777
        },
        {
          x: 6.352820050768457,
          y: 13.098546856876027
        },
        {
          x: 6.553228986315332,
          y: 13.162176007266652
        },
        {
          x: 6.680761945299707,
          y: 13.238530987735402
        },
        {
          x: 6.808294904284082,
          y: 13.302160138126027
        },
        {
          x: 7.008703839830957,
          y: 13.365789288516652
        },
        {
          x: 7.209112775377832,
          y: 13.429418438907277
        },
        {
          x: 7.336645734362207,
          y: 13.493047589297902
        },
        {
          x: 7.482397687487207,
          y: 13.569402569766652
        },
        {
          x: 7.609930646471582,
          y: 13.569402569766652
        },
        {
          x: 7.737463605455957,
          y: 13.633031720157277
        },
        {
          x: 7.937872541002832,
          y: 13.696660870547902
        },
        {
          x: 8.065405499987207,
          y: 13.696660870547902
        },
        {
          x: 8.211157453112207,
          y: 13.696660870547902
        },
        {
          x: 8.265814435534082,
          y: 13.696660870547902
        },
        {
          x: 8.411566388659082,
          y: 13.696660870547902
        },
        {
          x: 8.539099347643457,
          y: 13.696660870547902
        },
        {
          x: 8.666632306627832,
          y: 13.696660870547902
        },
        {
          x: 8.739508283190332,
          y: 13.696660870547902
        },
        {
          x: 8.867041242174707,
          y: 13.696660870547902
        },
        {
          x: 8.939917218737207,
          y: 13.696660870547902
        },
        {
          x: 9.067450177721582,
          y: 13.696660870547902
        },
        {
          x: 9.140326154284082,
          y: 13.696660870547902
        },
        {
          x: 9.194983136705957,
          y: 13.696660870547902
        },
        {
          x: 9.267859113268457,
          y: 13.696660870547902
        },
        {
          x: 9.322516095690332,
          y: 13.696660870547902
        },
        {
          x: 9.395392072252832,
          y: 13.696660870547902
        },
        {
          x: 9.468268048815332,
          y: 13.696660870547902
        },
        {
          x: 9.522925031237207,
          y: 13.633031720157277
        },
        {
          x: 9.668676984362207,
          y: 13.569402569766652
        }
      ]
    ]
  },
  {
    name: "3",
    strokes: [
      [
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2862365205409105
        },
        {
          x: -7.975055888547729,
          y: -6.2226073701502855
        },
        {
          x: -7.975055888547729,
          y: -6.2226073701502855
        },
        {
          x: -7.902179911985229,
          y: -6.2226073701502855
        },
        {
          x: -7.902179911985229,
          y: -6.1462523896815355
        },
        {
          x: -7.902179911985229,
          y: -6.1462523896815355
        },
        {
          x: -7.902179911985229,
          y: -6.1462523896815355
        },
        {
          x: -7.829303935422729,
          y: -6.0826232392909105
        },
        {
          x: -7.829303935422729,
          y: -6.0826232392909105
        },
        {
          x: -7.829303935422729,
          y: -6.0826232392909105
        },
        {
          x: -7.829303935422729,
          y: -6.0189940889002855
        },
        {
          x: -7.829303935422729,
          y: -6.0189940889002855
        },
        {
          x: -7.829303935422729,
          y: -6.0189940889002855
        },
        {
          x: -7.829303935422729,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.774646953000854,
          y: -6.0189940889002855
        },
        {
          x: -7.701770976438354,
          y: -6.0826232392909105
        },
        {
          x: -7.701770976438354,
          y: -6.1462523896815355
        },
        {
          x: -7.701770976438354,
          y: -6.2226073701502855
        },
        {
          x: -7.628894999875854,
          y: -6.3498656709315355
        },
        {
          x: -7.628894999875854,
          y: -6.4771239717127855
        },
        {
          x: -7.574238017453979,
          y: -6.6171081025721605
        },
        {
          x: -7.501362040891479,
          y: -6.7443664033534105
        },
        {
          x: -7.501362040891479,
          y: -6.8843505342127855
        },
        {
          x: -7.446705058469604,
          y: -7.0752379853846605
        },
        {
          x: -7.373829081907104,
          y: -7.2152221162440355
        },
        {
          x: -7.300953105344604,
          y: -7.4061095674159105
        },
        {
          x: -7.246296122922729,
          y: -7.6097228486659105
        },
        {
          x: -7.173420146360229,
          y: -7.7369811494471605
        },
        {
          x: -7.100544169797729,
          y: -7.9405944306971605
        },
        {
          x: -7.045887187375854,
          y: -8.06785273147841
        },
        {
          x: -6.973011210813354,
          y: -8.27146601272841
        },
        {
          x: -6.900135234250854,
          y: -8.462353463900286
        },
        {
          x: -6.772602275266479,
          y: -8.60233759475966
        },
        {
          x: -6.645069316282104,
          y: -8.80595087600966
        },
        {
          x: -6.572193339719604,
          y: -8.93320917679091
        },
        {
          x: -6.444660380735229,
          y: -9.13682245804091
        },
        {
          x: -6.317127421750854,
          y: -9.26408075882216
        },
        {
          x: -6.171375468625854,
          y: -9.46769404007216
        },
        {
          x: -6.043842509641479,
          y: -9.59495234085341
        },
        {
          x: -5.916309550657104,
          y: -9.72221064163466
        },
        {
          x: -5.788776591672729,
          y: -9.92582392288466
        },
        {
          x: -5.643024638547729,
          y: -10.05308222366591
        },
        {
          x: -5.515491679563354,
          y: -10.193066354525286
        },
        {
          x: -5.387958720578979,
          y: -10.320324655306536
        },
        {
          x: -5.260425761594604,
          y: -10.38395380569716
        },
        {
          x: -5.114673808469604,
          y: -10.58756708694716
        },
        {
          x: -4.987140849485229,
          y: -10.651196237337786
        },
        {
          x: -4.859607890500854,
          y: -10.79118036819716
        },
        {
          x: -4.732074931516479,
          y: -10.854809518587786
        },
        {
          x: -4.586322978391479,
          y: -10.982067819369036
        },
        {
          x: -4.458790019407104,
          y: -11.12205195022841
        },
        {
          x: -4.331257060422729,
          y: -11.24931025100966
        },
        {
          x: -4.185505107297729,
          y: -11.312939401400286
        },
        {
          x: -4.057972148313354,
          y: -11.37656855179091
        },
        {
          x: -3.930439189328979,
          y: -11.516552682650286
        },
        {
          x: -3.802906230344604,
          y: -11.58018183304091
        },
        {
          x: -3.657154277219604,
          y: -11.643810983431536
        },
        {
          x: -3.529621318235229,
          y: -11.78379511429091
        },
        {
          x: -3.402088359250854,
          y: -11.847424264681536
        },
        {
          x: -3.274555400266479,
          y: -11.91105341507216
        },
        {
          x: -3.128803447141479,
          y: -11.974682565462786
        },
        {
          x: -3.074146464719604,
          y: -12.03831171585341
        },
        {
          x: -2.928394511594604,
          y: -12.11466669632216
        },
        {
          x: -2.800861552610229,
          y: -12.11466669632216
        },
        {
          x: -2.673328593625854,
          y: -12.11466669632216
        },
        {
          x: -2.545795634641479,
          y: -12.11466669632216
        },
        {
          x: -2.472919658078979,
          y: -12.11466669632216
        },
        {
          x: -2.345386699094604,
          y: -12.11466669632216
        },
        {
          x: -2.199634745969604,
          y: -12.11466669632216
        },
        {
          x: -2.072101786985229,
          y: -12.11466669632216
        },
        {
          x: -1.944568828000854,
          y: -12.11466669632216
        },
        {
          x: -1.871692851438354,
          y: -12.11466669632216
        },
        {
          x: -1.744159892453979,
          y: -12.11466669632216
        },
        {
          x: -1.616626933469604,
          y: -12.11466669632216
        },
        {
          x: -1.470874980344604,
          y: -12.11466669632216
        },
        {
          x: -1.343342021360229,
          y: -12.11466669632216
        },
        {
          x: -1.215809062375854,
          y: -12.11466669632216
        },
        {
          x: -1.088276103391479,
          y: -12.11466669632216
        },
        {
          x: -0.942524150266479,
          y: -12.03831171585341
        },
        {
          x: -0.814991191282104,
          y: -12.03831171585341
        },
        {
          x: -0.687458232297729,
          y: -11.974682565462786
        },
        {
          x: -0.559925273313354,
          y: -11.974682565462786
        },
        {
          x: -0.35951633776647896,
          y: -11.91105341507216
        },
        {
          x: -0.21376438464147896,
          y: -11.91105341507216
        },
        {
          x: -0.08623142565710396,
          y: -11.91105341507216
        },
        {
          x: 0.041301533327271045,
          y: -11.91105341507216
        },
        {
          x: 0.24171046887414604,
          y: -11.847424264681536
        },
        {
          x: 0.36924342785852104,
          y: -11.847424264681536
        },
        {
          x: 0.569652363405396,
          y: -11.847424264681536
        },
        {
          x: 0.715404316530396,
          y: -11.78379511429091
        },
        {
          x: 0.842937275514771,
          y: -11.78379511429091
        },
        {
          x: 0.970470234499146,
          y: -11.70744013382216
        },
        {
          x: 1.170879170046021,
          y: -11.643810983431536
        },
        {
          x: 1.298412129030396,
          y: -11.58018183304091
        },
        {
          x: 1.425945088014771,
          y: -11.516552682650286
        },
        {
          x: 1.571697041139771,
          y: -11.45292353225966
        },
        {
          x: 1.699230000124146,
          y: -11.37656855179091
        },
        {
          x: 1.826762959108521,
          y: -11.312939401400286
        },
        {
          x: 1.972514912233521,
          y: -11.24931025100966
        },
        {
          x: 2.100047871217896,
          y: -11.12205195022841
        },
        {
          x: 2.154704853639771,
          y: -11.04569696975966
        },
        {
          x: 2.300456806764771,
          y: -10.91843866897841
        },
        {
          x: 2.427989765749146,
          y: -10.854809518587786
        },
        {
          x: 2.500865742311646,
          y: -10.71482538772841
        },
        {
          x: 2.628398701296021,
          y: -10.651196237337786
        },
        {
          x: 2.755931660280396,
          y: -10.523937936556536
        },
        {
          x: 2.828807636842896,
          y: -10.46030878616591
        },
        {
          x: 2.883464619264771,
          y: -10.320324655306536
        },
        {
          x: 2.956340595827271,
          y: -10.25669550491591
        },
        {
          x: 3.029216572389771,
          y: -10.12943720413466
        },
        {
          x: 3.156749531374146,
          y: -9.989453073275286
        },
        {
          x: 3.229625507936646,
          y: -9.862194772494036
        },
        {
          x: 3.284282490358521,
          y: -9.79856562210341
        },
        {
          x: 3.357158466921021,
          y: -9.658581491244036
        },
        {
          x: 3.430034443483521,
          y: -9.531323190462786
        },
        {
          x: 3.484691425905396,
          y: -9.39133905960341
        },
        {
          x: 3.557567402467896,
          y: -9.26408075882216
        },
        {
          x: 3.557567402467896,
          y: -9.13682245804091
        },
        {
          x: 3.612224384889771,
          y: -8.996838327181536
        },
        {
          x: 3.612224384889771,
          y: -8.80595087600966
        },
        {
          x: 3.612224384889771,
          y: -8.665966745150286
        },
        {
          x: 3.685100361452271,
          y: -8.538708444369036
        },
        {
          x: 3.685100361452271,
          y: -8.335095163119036
        },
        {
          x: 3.685100361452271,
          y: -8.131481881869036
        },
        {
          x: 3.685100361452271,
          y: -8.004223581087786
        },
        {
          x: 3.685100361452271,
          y: -7.8006102998377855
        },
        {
          x: 3.685100361452271,
          y: -7.6733519990565355
        },
        {
          x: 3.685100361452271,
          y: -7.4697387178065355
        },
        {
          x: 3.685100361452271,
          y: -7.2788512666346605
        },
        {
          x: 3.685100361452271,
          y: -7.1388671357752855
        },
        {
          x: 3.685100361452271,
          y: -6.9479796846034105
        },
        {
          x: 3.685100361452271,
          y: -6.7443664033534105
        },
        {
          x: 3.685100361452271,
          y: -6.6171081025721605
        },
        {
          x: 3.685100361452271,
          y: -6.4771239717127855
        },
        {
          x: 3.685100361452271,
          y: -6.2862365205409105
        },
        {
          x: 3.685100361452271,
          y: -6.0826232392909105
        },
        {
          x: 3.685100361452271,
          y: -5.9553649385096605
        },
        {
          x: 3.685100361452271,
          y: -5.8153808076502855
        },
        {
          x: 3.685100361452271,
          y: -5.6881225068690355
        },
        {
          x: 3.685100361452271,
          y: -5.5608642060877855
        },
        {
          x: 3.685100361452271,
          y: -5.4208800752284105
        },
        {
          x: 3.685100361452271,
          y: -5.2936217744471605
        },
        {
          x: 3.685100361452271,
          y: -5.1536376435877855
        },
        {
          x: 3.612224384889771,
          y: -5.0263793428065355
        },
        {
          x: 3.557567402467896,
          y: -4.8991210420252855
        },
        {
          x: 3.484691425905396,
          y: -4.8227660615565355
        },
        {
          x: 3.430034443483521,
          y: -4.6318786103846605
        },
        {
          x: 3.430034443483521,
          y: -4.5682494599940355
        },
        {
          x: 3.357158466921021,
          y: -4.4282653291346605
        },
        {
          x: 3.284282490358521,
          y: -4.3646361787440355
        },
        {
          x: 3.229625507936646,
          y: -4.2373778779627855
        },
        {
          x: 3.156749531374146,
          y: -4.1610228974940355
        },
        {
          x: 3.083873554811646,
          y: -4.0337645967127855
        },
        {
          x: 3.029216572389771,
          y: -3.9065062959315355
        },
        {
          x: 2.956340595827271,
          y: -3.8301513154627855
        },
        {
          x: 2.883464619264771,
          y: -3.7665221650721605
        },
        {
          x: 2.828807636842896,
          y: -3.6392638642909105
        },
        {
          x: 2.755931660280396,
          y: -3.5756347139002855
        },
        {
          x: 2.701274677858521,
          y: -3.4356505830409105
        },
        {
          x: 2.628398701296021,
          y: -3.3720214326502855
        },
        {
          x: 2.555522724733521,
          y: -3.3083922822596605
        },
        {
          x: 2.500865742311646,
          y: -3.2447631318690355
        },
        {
          x: 2.355113789186646,
          y: -3.1047790010096605
        },
        {
          x: 2.300456806764771,
          y: -3.0411498506190355
        },
        {
          x: 2.227580830202271,
          y: -2.9775207002284105
        },
        {
          x: 2.100047871217896,
          y: -2.9138915498377855
        },
        {
          x: 2.027171894655396,
          y: -2.8375365693690355
        },
        {
          x: 1.972514912233521,
          y: -2.7739074189784105
        },
        {
          x: 1.826762959108521,
          y: -2.7102782685877855
        },
        {
          x: 1.772105976686646,
          y: -2.6466491181971605
        },
        {
          x: 1.699230000124146,
          y: -2.6466491181971605
        },
        {
          x: 1.571697041139771,
          y: -2.5830199678065355
        },
        {
          x: 1.498821064577271,
          y: -2.5830199678065355
        },
        {
          x: 1.371288105592896,
          y: -2.5830199678065355
        },
        {
          x: 1.298412129030396,
          y: -2.5066649873377855
        },
        {
          x: 1.170879170046021,
          y: -2.5066649873377855
        },
        {
          x: 1.098003193483521,
          y: -2.5066649873377855
        },
        {
          x: 0.970470234499146,
          y: -2.4430358369471605
        },
        {
          x: 0.897594257936646,
          y: -2.4430358369471605
        },
        {
          x: 0.770061298952271,
          y: -2.4430358369471605
        },
        {
          x: 0.715404316530396,
          y: -2.4430358369471605
        },
        {
          x: 0.569652363405396,
          y: -2.4430358369471605
        },
        {
          x: 0.44211940442102104,
          y: -2.4430358369471605
        },
        {
          x: 0.36924342785852104,
          y: -2.4430358369471605
        },
        {
          x: 0.24171046887414604,
          y: -2.4430358369471605
        },
        {
          x: 0.16883449231164604,
          y: -2.4430358369471605
        },
        {
          x: 0.041301533327271045,
          y: -2.3794066865565355
        },
        {
          x: -0.08623142565710396,
          y: -2.3794066865565355
        },
        {
          x: -0.15910740221960396,
          y: -2.3794066865565355
        },
        {
          x: -0.28664036120397896,
          y: -2.3794066865565355
        },
        {
          x: -0.35951633776647896,
          y: -2.3157775361659105
        },
        {
          x: -0.48704929675085396,
          y: -2.3157775361659105
        },
        {
          x: -0.559925273313354,
          y: -2.3157775361659105
        },
        {
          x: -0.687458232297729,
          y: -2.2521483857752855
        },
        {
          x: -0.742115214719604,
          y: -2.2521483857752855
        },
        {
          x: -0.887867167844604,
          y: -2.2521483857752855
        },
        {
          x: -0.942524150266479,
          y: -2.2521483857752855
        },
        {
          x: -1.015400126828979,
          y: -2.1757934053065355
        },
        {
          x: -1.088276103391479,
          y: -2.1757934053065355
        },
        {
          x: -1.142933085813354,
          y: -2.1121642549159105
        },
        {
          x: -1.215809062375854,
          y: -2.1121642549159105
        },
        {
          x: -1.288685038938354,
          y: -2.1121642549159105
        },
        {
          x: -1.343342021360229,
          y: -2.0485351045252855
        },
        {
          x: -1.416217997922729,
          y: -2.0485351045252855
        },
        {
          x: -1.416217997922729,
          y: -2.0485351045252855
        },
        {
          x: -1.470874980344604,
          y: -1.9849059541346605
        },
        {
          x: -1.543750956907104,
          y: -1.9849059541346605
        },
        {
          x: -1.543750956907104,
          y: -1.9849059541346605
        },
        {
          x: -1.616626933469604,
          y: -1.9849059541346605
        },
        {
          x: -1.616626933469604,
          y: -1.9849059541346605
        },
        {
          x: -1.616626933469604,
          y: -1.9849059541346605
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.9212768037440355
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.671283915891479,
          y: -1.8449218232752855
        },
        {
          x: -1.616626933469604,
          y: -1.8449218232752855
        },
        {
          x: -1.543750956907104,
          y: -1.8449218232752855
        },
        {
          x: -1.470874980344604,
          y: -1.8449218232752855
        },
        {
          x: -1.416217997922729,
          y: -1.8449218232752855
        },
        {
          x: -1.288685038938354,
          y: -1.8449218232752855
        },
        {
          x: -1.142933085813354,
          y: -1.8449218232752855
        },
        {
          x: -1.088276103391479,
          y: -1.8449218232752855
        },
        {
          x: -0.942524150266479,
          y: -1.8449218232752855
        },
        {
          x: -0.814991191282104,
          y: -1.8449218232752855
        },
        {
          x: -0.687458232297729,
          y: -1.8449218232752855
        },
        {
          x: -0.559925273313354,
          y: -1.8449218232752855
        },
        {
          x: -0.41417332018835396,
          y: -1.8449218232752855
        },
        {
          x: -0.28664036120397896,
          y: -1.8449218232752855
        },
        {
          x: -0.15910740221960396,
          y: -1.8449218232752855
        },
        {
          x: 0.041301533327271045,
          y: -1.8449218232752855
        },
        {
          x: 0.16883449231164604,
          y: -1.8449218232752855
        },
        {
          x: 0.31458644543664604,
          y: -1.8449218232752855
        },
        {
          x: 0.44211940442102104,
          y: -1.8449218232752855
        },
        {
          x: 0.642528339967896,
          y: -1.8449218232752855
        },
        {
          x: 0.770061298952271,
          y: -1.8449218232752855
        },
        {
          x: 0.897594257936646,
          y: -1.8449218232752855
        },
        {
          x: 1.098003193483521,
          y: -1.8449218232752855
        },
        {
          x: 1.243755146608521,
          y: -1.8449218232752855
        },
        {
          x: 1.371288105592896,
          y: -1.8449218232752855
        },
        {
          x: 1.571697041139771,
          y: -1.8449218232752855
        },
        {
          x: 1.699230000124146,
          y: -1.8449218232752855
        },
        {
          x: 1.899638935671021,
          y: -1.8449218232752855
        },
        {
          x: 2.027171894655396,
          y: -1.8449218232752855
        },
        {
          x: 2.154704853639771,
          y: -1.7812926728846605
        },
        {
          x: 2.355113789186646,
          y: -1.7176635224940355
        },
        {
          x: 2.500865742311646,
          y: -1.6540343721034105
        },
        {
          x: 2.628398701296021,
          y: -1.5776793916346605
        },
        {
          x: 2.755931660280396,
          y: -1.4504210908534105
        },
        {
          x: 2.883464619264771,
          y: -1.3867919404627855
        },
        {
          x: 3.083873554811646,
          y: -1.3231627900721605
        },
        {
          x: 3.229625507936646,
          y: -1.1831786592127855
        },
        {
          x: 3.357158466921021,
          y: -1.0559203584315355
        },
        {
          x: 3.557567402467896,
          y: -0.9922912080409105
        },
        {
          x: 3.685100361452271,
          y: -0.8523070771815355
        },
        {
          x: 3.812633320436646,
          y: -0.7886779267909105
        },
        {
          x: 3.958385273561646,
          y: -0.6614196260096605
        },
        {
          x: 4.158794209108521,
          y: -0.5214354951502855
        },
        {
          x: 4.286327168092896,
          y: -0.33054804397841053
        },
        {
          x: 4.413860127077271,
          y: -0.19056391311903553
        },
        {
          x: 4.541393086061646,
          y: -0.06330561233778553
        },
        {
          x: 4.687145039186646,
          y: 0.07667851852158947
        },
        {
          x: 4.814677998171021,
          y: 0.20393681930283947
        },
        {
          x: 4.942210957155396,
          y: 0.40755010055283947
        },
        {
          x: 5.069743916139771,
          y: 0.5348084013340895
        },
        {
          x: 5.142619892702271,
          y: 0.7384216825840895
        },
        {
          x: 5.270152851686646,
          y: 0.8656799833653395
        },
        {
          x: 5.343028828249146,
          y: 1.0692932646153395
        },
        {
          x: 5.470561787233521,
          y: 1.1965515653965895
        },
        {
          x: 5.543437763796021,
          y: 1.4001648466465895
        },
        {
          x: 5.670970722780396,
          y: 1.5910522978184645
        },
        {
          x: 5.743846699342896,
          y: 1.7310364286778395
        },
        {
          x: 5.798503681764771,
          y: 1.9219238798497145
        },
        {
          x: 5.871379658327271,
          y: 2.1255371610997145
        },
        {
          x: 5.944255634889771,
          y: 2.2527954618809645
        },
        {
          x: 6.071788593874146,
          y: 2.5200378935215895
        },
        {
          x: 6.144664570436646,
          y: 2.6472961943028395
        },
        {
          x: 6.199321552858521,
          y: 2.8509094755528395
        },
        {
          x: 6.272197529421021,
          y: 3.0545227568028395
        },
        {
          x: 6.326854511842896,
          y: 3.2454102079747145
        },
        {
          x: 6.399730488405396,
          y: 3.3853943388340895
        },
        {
          x: 6.472606464967896,
          y: 3.5762817900059645
        },
        {
          x: 6.527263447389771,
          y: 3.7798950712559645
        },
        {
          x: 6.600139423952271,
          y: 3.9707825224278395
        },
        {
          x: 6.673015400514771,
          y: 4.1107666532872145
        },
        {
          x: 6.727672382936646,
          y: 4.3016541044590895
        },
        {
          x: 6.800548359499146,
          y: 4.4416382353184645
        },
        {
          x: 6.873424336061646,
          y: 4.6325256864903395
        },
        {
          x: 6.873424336061646,
          y: 4.8361389677403395
        },
        {
          x: 6.873424336061646,
          y: 4.9633972685215895
        },
        {
          x: 6.928081318483521,
          y: 5.1670105497715895
        },
        {
          x: 6.928081318483521,
          y: 5.2942688505528395
        },
        {
          x: 6.928081318483521,
          y: 5.4342529814122145
        },
        {
          x: 6.928081318483521,
          y: 5.6378662626622145
        },
        {
          x: 6.928081318483521,
          y: 5.8287537138340895
        },
        {
          x: 6.928081318483521,
          y: 5.9687378446934645
        },
        {
          x: 6.928081318483521,
          y: 6.0959961454747145
        },
        {
          x: 6.928081318483521,
          y: 6.2232544462559645
        },
        {
          x: 6.928081318483521,
          y: 6.4268677275059645
        },
        {
          x: 6.928081318483521,
          y: 6.5541260282872145
        },
        {
          x: 6.928081318483521,
          y: 6.7577393095372145
        },
        {
          x: 6.928081318483521,
          y: 6.8849976103184645
        },
        {
          x: 6.928081318483521,
          y: 7.0249817411778395
        },
        {
          x: 6.928081318483521,
          y: 7.2158691923497145
        },
        {
          x: 6.928081318483521,
          y: 7.3558533232090895
        },
        {
          x: 6.928081318483521,
          y: 7.5467407743809645
        },
        {
          x: 6.928081318483521,
          y: 7.6867249052403395
        },
        {
          x: 6.928081318483521,
          y: 7.8139832060215895
        },
        {
          x: 6.928081318483521,
          y: 7.9539673368809645
        },
        {
          x: 6.928081318483521,
          y: 8.14485478805284
        },
        {
          x: 6.928081318483521,
          y: 8.284838918912214
        },
        {
          x: 6.873424336061646,
          y: 8.412097219693464
        },
        {
          x: 6.800548359499146,
          y: 8.539355520474714
        },
        {
          x: 6.727672382936646,
          y: 8.67933965133409
        },
        {
          x: 6.673015400514771,
          y: 8.80659795211534
        },
        {
          x: 6.600139423952271,
          y: 8.946582082974714
        },
        {
          x: 6.527263447389771,
          y: 9.073840383755964
        },
        {
          x: 6.472606464967896,
          y: 9.201098684537214
        },
        {
          x: 6.399730488405396,
          y: 9.34108281539659
        },
        {
          x: 6.326854511842896,
          y: 9.404711965787214
        },
        {
          x: 6.272197529421021,
          y: 9.531970266568464
        },
        {
          x: 6.199321552858521,
          y: 9.67195439742784
        },
        {
          x: 6.144664570436646,
          y: 9.735583547818464
        },
        {
          x: 5.998912617311646,
          y: 9.862841848599714
        },
        {
          x: 5.944255634889771,
          y: 10.00282597945909
        },
        {
          x: 5.871379658327271,
          y: 10.066455129849714
        },
        {
          x: 5.798503681764771,
          y: 10.193713430630964
        },
        {
          x: 5.670970722780396,
          y: 10.270068411099714
        },
        {
          x: 5.598094746217896,
          y: 10.397326711880964
        },
        {
          x: 5.470561787233521,
          y: 10.524585012662214
        },
        {
          x: 5.415904804811646,
          y: 10.600939993130964
        },
        {
          x: 5.343028828249146,
          y: 10.66456914352159
        },
        {
          x: 5.215495869264771,
          y: 10.728198293912214
        },
        {
          x: 5.142619892702271,
          y: 10.855456594693464
        },
        {
          x: 5.069743916139771,
          y: 10.931811575162214
        },
        {
          x: 4.942210957155396,
          y: 10.99544072555284
        },
        {
          x: 4.814677998171021,
          y: 11.12269902633409
        },
        {
          x: 4.741802021608521,
          y: 11.186328176724714
        },
        {
          x: 4.614269062624146,
          y: 11.262683157193464
        },
        {
          x: 4.541393086061646,
          y: 11.32631230758409
        },
        {
          x: 4.413860127077271,
          y: 11.389941457974714
        },
        {
          x: 4.286327168092896,
          y: 11.517199758755964
        },
        {
          x: 4.213451191530396,
          y: 11.593554739224714
        },
        {
          x: 4.085918232546021,
          y: 11.65718388961534
        },
        {
          x: 3.958385273561646,
          y: 11.720813040005964
        },
        {
          x: 3.885509296999146,
          y: 11.78444219039659
        },
        {
          x: 3.757976338014771,
          y: 11.924426321255964
        },
        {
          x: 3.612224384889771,
          y: 11.98805547164659
        },
        {
          x: 3.484691425905396,
          y: 12.051684622037214
        },
        {
          x: 3.357158466921021,
          y: 12.051684622037214
        },
        {
          x: 3.284282490358521,
          y: 12.11531377242784
        },
        {
          x: 3.156749531374146,
          y: 12.178942922818464
        },
        {
          x: 3.029216572389771,
          y: 12.255297903287214
        },
        {
          x: 2.883464619264771,
          y: 12.31892705367784
        },
        {
          x: 2.755931660280396,
          y: 12.382556204068464
        },
        {
          x: 2.701274677858521,
          y: 12.382556204068464
        },
        {
          x: 2.555522724733521,
          y: 12.44618535445909
        },
        {
          x: 2.427989765749146,
          y: 12.52254033492784
        },
        {
          x: 2.300456806764771,
          y: 12.52254033492784
        },
        {
          x: 2.154704853639771,
          y: 12.586169485318464
        },
        {
          x: 2.100047871217896,
          y: 12.586169485318464
        },
        {
          x: 1.972514912233521,
          y: 12.64979863570909
        },
        {
          x: 1.826762959108521,
          y: 12.64979863570909
        },
        {
          x: 1.699230000124146,
          y: 12.713427786099714
        },
        {
          x: 1.571697041139771,
          y: 12.713427786099714
        },
        {
          x: 1.425945088014771,
          y: 12.713427786099714
        },
        {
          x: 1.371288105592896,
          y: 12.713427786099714
        },
        {
          x: 1.243755146608521,
          y: 12.77705693649034
        },
        {
          x: 1.098003193483521,
          y: 12.77705693649034
        },
        {
          x: 0.970470234499146,
          y: 12.77705693649034
        },
        {
          x: 0.842937275514771,
          y: 12.77705693649034
        },
        {
          x: 0.715404316530396,
          y: 12.77705693649034
        },
        {
          x: 0.569652363405396,
          y: 12.77705693649034
        },
        {
          x: 0.44211940442102104,
          y: 12.77705693649034
        },
        {
          x: 0.31458644543664604,
          y: 12.77705693649034
        },
        {
          x: 0.16883449231164604,
          y: 12.77705693649034
        },
        {
          x: 0.041301533327271045,
          y: 12.77705693649034
        },
        {
          x: -0.08623142565710396,
          y: 12.77705693649034
        },
        {
          x: -0.21376438464147896,
          y: 12.77705693649034
        },
        {
          x: -0.35951633776647896,
          y: 12.77705693649034
        },
        {
          x: -0.48704929675085396,
          y: 12.77705693649034
        },
        {
          x: -0.614582255735229,
          y: 12.77705693649034
        },
        {
          x: -0.742115214719604,
          y: 12.77705693649034
        },
        {
          x: -0.887867167844604,
          y: 12.77705693649034
        },
        {
          x: -0.942524150266479,
          y: 12.77705693649034
        },
        {
          x: -1.088276103391479,
          y: 12.77705693649034
        },
        {
          x: -1.215809062375854,
          y: 12.77705693649034
        },
        {
          x: -1.343342021360229,
          y: 12.77705693649034
        },
        {
          x: -1.470874980344604,
          y: 12.77705693649034
        },
        {
          x: -1.616626933469604,
          y: 12.77705693649034
        },
        {
          x: -1.744159892453979,
          y: 12.77705693649034
        },
        {
          x: -1.871692851438354,
          y: 12.77705693649034
        },
        {
          x: -2.017444804563354,
          y: 12.77705693649034
        },
        {
          x: -2.144977763547729,
          y: 12.77705693649034
        },
        {
          x: -2.345386699094604,
          y: 12.77705693649034
        },
        {
          x: -2.472919658078979,
          y: 12.77705693649034
        },
        {
          x: -2.600452617063354,
          y: 12.77705693649034
        },
        {
          x: -2.727985576047729,
          y: 12.713427786099714
        },
        {
          x: -2.873737529172729,
          y: 12.713427786099714
        },
        {
          x: -3.001270488157104,
          y: 12.64979863570909
        },
        {
          x: -3.128803447141479,
          y: 12.64979863570909
        },
        {
          x: -3.274555400266479,
          y: 12.64979863570909
        },
        {
          x: -3.402088359250854,
          y: 12.586169485318464
        },
        {
          x: -3.529621318235229,
          y: 12.586169485318464
        },
        {
          x: -3.602497294797729,
          y: 12.52254033492784
        },
        {
          x: -3.730030253782104,
          y: 12.52254033492784
        },
        {
          x: -3.857563212766479,
          y: 12.52254033492784
        },
        {
          x: -4.003315165891479,
          y: 12.44618535445909
        },
        {
          x: -4.130848124875854,
          y: 12.44618535445909
        },
        {
          x: -4.258381083860229,
          y: 12.44618535445909
        },
        {
          x: -4.331257060422729,
          y: 12.382556204068464
        },
        {
          x: -4.458790019407104,
          y: 12.382556204068464
        },
        {
          x: -4.586322978391479,
          y: 12.31892705367784
        },
        {
          x: -4.732074931516479,
          y: 12.31892705367784
        },
        {
          x: -4.859607890500854,
          y: 12.255297903287214
        },
        {
          x: -4.987140849485229,
          y: 12.255297903287214
        },
        {
          x: -5.060016826047729,
          y: 12.178942922818464
        },
        {
          x: -5.187549785032104,
          y: 12.178942922818464
        },
        {
          x: -5.315082744016479,
          y: 12.11531377242784
        },
        {
          x: -5.442615703000854,
          y: 12.11531377242784
        },
        {
          x: -5.588367656125854,
          y: 12.051684622037214
        },
        {
          x: -5.715900615110229,
          y: 12.051684622037214
        },
        {
          x: -5.788776591672729,
          y: 11.98805547164659
        },
        {
          x: -5.916309550657104,
          y: 11.98805547164659
        },
        {
          x: -6.043842509641479,
          y: 11.924426321255964
        },
        {
          x: -6.171375468625854,
          y: 11.924426321255964
        },
        {
          x: -6.244251445188354,
          y: 11.848071340787214
        },
        {
          x: -6.371784404172729,
          y: 11.848071340787214
        },
        {
          x: -6.444660380735229,
          y: 11.78444219039659
        },
        {
          x: -6.572193339719604,
          y: 11.720813040005964
        },
        {
          x: -6.717945292844604,
          y: 11.65718388961534
        },
        {
          x: -6.772602275266479,
          y: 11.65718388961534
        },
        {
          x: -6.845478251828979,
          y: 11.593554739224714
        },
        {
          x: -6.973011210813354,
          y: 11.517199758755964
        },
        {
          x: -7.045887187375854,
          y: 11.45357060836534
        },
        {
          x: -7.045887187375854,
          y: 11.389941457974714
        },
        {
          x: -7.173420146360229,
          y: 11.32631230758409
        },
        {
          x: -7.173420146360229,
          y: 11.186328176724714
        },
        {
          x: -7.173420146360229,
          y: 11.059069875943464
        },
        {
          x: -7.173420146360229,
          y: 10.855456594693464
        },
        {
          x: -7.173420146360229,
          y: 10.600939993130964
        }
      ]
    ]
  },
  {
    name: "5",
    strokes: [
      [
        {
          x: 4.999032360329977,
          y: -7.099137139847585
        },
        {
          x: 4.999032360329977,
          y: -7.099137139847585
        },
        {
          x: 4.944375377908102,
          y: -7.099137139847585
        },
        {
          x: 4.944375377908102,
          y: -7.099137139847585
        },
        {
          x: 4.816842418923727,
          y: -7.099137139847585
        },
        {
          x: 4.743966442361227,
          y: -7.099137139847585
        },
        {
          x: 4.671090465798727,
          y: -7.099137139847585
        },
        {
          x: 4.616433483376852,
          y: -7.099137139847585
        },
        {
          x: 4.543557506814352,
          y: -7.099137139847585
        },
        {
          x: 4.470681530251852,
          y: -7.099137139847585
        },
        {
          x: 4.416024547829977,
          y: -7.099137139847585
        },
        {
          x: 4.343148571267477,
          y: -7.16276629023821
        },
        {
          x: 4.270272594704977,
          y: -7.16276629023821
        },
        {
          x: 4.270272594704977,
          y: -7.226395440628835
        },
        {
          x: 4.215615612283102,
          y: -7.226395440628835
        },
        {
          x: 4.142739635720602,
          y: -7.226395440628835
        },
        {
          x: 4.142739635720602,
          y: -7.302750421097585
        },
        {
          x: 4.088082653298727,
          y: -7.302750421097585
        },
        {
          x: 4.015206676736227,
          y: -7.302750421097585
        },
        {
          x: 4.015206676736227,
          y: -7.302750421097585
        },
        {
          x: 3.942330700173727,
          y: -7.302750421097585
        },
        {
          x: 3.942330700173727,
          y: -7.302750421097585
        },
        {
          x: 3.887673717751852,
          y: -7.302750421097585
        },
        {
          x: 3.814797741189352,
          y: -7.302750421097585
        },
        {
          x: 3.814797741189352,
          y: -7.302750421097585
        },
        {
          x: 3.741921764626852,
          y: -7.302750421097585
        },
        {
          x: 3.741921764626852,
          y: -7.302750421097585
        },
        {
          x: 3.687264782204977,
          y: -7.302750421097585
        },
        {
          x: 3.614388805642477,
          y: -7.302750421097585
        },
        {
          x: 3.614388805642477,
          y: -7.302750421097585
        },
        {
          x: 3.541512829079977,
          y: -7.302750421097585
        },
        {
          x: 3.486855846658102,
          y: -7.302750421097585
        },
        {
          x: 3.486855846658102,
          y: -7.302750421097585
        },
        {
          x: 3.413979870095602,
          y: -7.302750421097585
        },
        {
          x: 3.359322887673727,
          y: -7.302750421097585
        },
        {
          x: 3.286446911111227,
          y: -7.302750421097585
        },
        {
          x: 3.213570934548727,
          y: -7.302750421097585
        },
        {
          x: 3.213570934548727,
          y: -7.302750421097585
        },
        {
          x: 3.158913952126852,
          y: -7.302750421097585
        },
        {
          x: 3.086037975564352,
          y: -7.302750421097585
        },
        {
          x: 3.013161999001852,
          y: -7.302750421097585
        },
        {
          x: 2.958505016579977,
          y: -7.302750421097585
        },
        {
          x: 2.958505016579977,
          y: -7.302750421097585
        },
        {
          x: 2.885629040017477,
          y: -7.302750421097585
        },
        {
          x: 2.812753063454977,
          y: -7.302750421097585
        },
        {
          x: 2.758096081033102,
          y: -7.302750421097585
        },
        {
          x: 2.685220104470602,
          y: -7.302750421097585
        },
        {
          x: 2.630563122048727,
          y: -7.302750421097585
        },
        {
          x: 2.557687145486227,
          y: -7.302750421097585
        },
        {
          x: 2.484811168923727,
          y: -7.302750421097585
        },
        {
          x: 2.430154186501852,
          y: -7.302750421097585
        },
        {
          x: 2.357278209939352,
          y: -7.302750421097585
        },
        {
          x: 2.284402233376852,
          y: -7.302750421097585
        },
        {
          x: 2.156869274392477,
          y: -7.302750421097585
        },
        {
          x: 2.083993297829977,
          y: -7.302750421097585
        },
        {
          x: 1.956460338845602,
          y: -7.302750421097585
        },
        {
          x: 1.901803356423727,
          y: -7.302750421097585
        },
        {
          x: 1.828927379861227,
          y: -7.302750421097585
        },
        {
          x: 1.701394420876852,
          y: -7.302750421097585
        },
        {
          x: 1.628518444314352,
          y: -7.302750421097585
        },
        {
          x: 1.500985485329977,
          y: -7.302750421097585
        },
        {
          x: 1.373452526345602,
          y: -7.302750421097585
        },
        {
          x: 1.300576549783102,
          y: -7.302750421097585
        },
        {
          x: 1.173043590798727,
          y: -7.302750421097585
        },
        {
          x: 1.027291637673727,
          y: -7.302750421097585
        },
        {
          x: 0.8997586786893521,
          y: -7.302750421097585
        },
        {
          x: 0.8268827021268521,
          y: -7.302750421097585
        },
        {
          x: 0.6993497431424771,
          y: -7.302750421097585
        },
        {
          x: 0.5718167841581021,
          y: -7.302750421097585
        },
        {
          x: 0.4442838251737271,
          y: -7.302750421097585
        },
        {
          x: 0.2985318720487271,
          y: -7.302750421097585
        },
        {
          x: 0.1709989130643521,
          y: -7.302750421097585
        },
        {
          x: 0.04346595407997711,
          y: -7.302750421097585
        },
        {
          x: -0.08406700490439789,
          y: -7.302750421097585
        },
        {
          x: -0.2298189580293979,
          y: -7.302750421097585
        },
        {
          x: -0.3573519170137729,
          y: -7.302750421097585
        },
        {
          x: -0.4848848759981479,
          y: -7.302750421097585
        },
        {
          x: -0.6306368291231479,
          y: -7.302750421097585
        },
        {
          x: -0.7581697881075229,
          y: -7.302750421097585
        },
        {
          x: -0.8857027470918979,
          y: -7.302750421097585
        },
        {
          x: -1.013235706076273,
          y: -7.302750421097585
        },
        {
          x: -1.086111682638773,
          y: -7.302750421097585
        },
        {
          x: -1.213644641623148,
          y: -7.302750421097585
        },
        {
          x: -1.359396594748148,
          y: -7.302750421097585
        },
        {
          x: -1.414053577170023,
          y: -7.302750421097585
        },
        {
          x: -1.541586536154398,
          y: -7.302750421097585
        },
        {
          x: -1.614462512716898,
          y: -7.226395440628835
        },
        {
          x: -1.741995471701273,
          y: -7.226395440628835
        },
        {
          x: -1.814871448263773,
          y: -7.16276629023821
        },
        {
          x: -1.887747424826273,
          y: -7.16276629023821
        },
        {
          x: -1.942404407248148,
          y: -7.16276629023821
        },
        {
          x: -2.069937366232523,
          y: -7.16276629023821
        },
        {
          x: -2.142813342795023,
          y: -7.099137139847585
        },
        {
          x: -2.215689319357523,
          y: -7.099137139847585
        },
        {
          x: -2.270346301779398,
          y: -7.099137139847585
        },
        {
          x: -2.343222278341898,
          y: -7.099137139847585
        },
        {
          x: -2.343222278341898,
          y: -7.099137139847585
        },
        {
          x: -2.416098254904398,
          y: -7.099137139847585
        },
        {
          x: -2.470755237326273,
          y: -7.099137139847585
        },
        {
          x: -2.543631213888773,
          y: -7.099137139847585
        },
        {
          x: -2.616507190451273,
          y: -7.099137139847585
        },
        {
          x: -2.616507190451273,
          y: -7.099137139847585
        },
        {
          x: -2.671164172873148,
          y: -7.099137139847585
        },
        {
          x: -2.671164172873148,
          y: -7.099137139847585
        },
        {
          x: -2.744040149435648,
          y: -7.099137139847585
        },
        {
          x: -2.744040149435648,
          y: -7.099137139847585
        },
        {
          x: -2.798697131857523,
          y: -7.099137139847585
        },
        {
          x: -2.871573108420023,
          y: -7.099137139847585
        },
        {
          x: -2.871573108420023,
          y: -7.099137139847585
        },
        {
          x: -2.944449084982523,
          y: -7.099137139847585
        },
        {
          x: -2.944449084982523,
          y: -7.099137139847585
        },
        {
          x: -2.999106067404398,
          y: -7.099137139847585
        },
        {
          x: -2.999106067404398,
          y: -7.099137139847585
        },
        {
          x: -3.071982043966898,
          y: -7.099137139847585
        },
        {
          x: -3.071982043966898,
          y: -7.099137139847585
        },
        {
          x: -3.144858020529398,
          y: -7.099137139847585
        },
        {
          x: -3.144858020529398,
          y: -7.099137139847585
        },
        {
          x: -3.199515002951273,
          y: -7.099137139847585
        },
        {
          x: -3.199515002951273,
          y: -7.099137139847585
        },
        {
          x: -3.272390979513773,
          y: -7.03550798945696
        },
        {
          x: -3.272390979513773,
          y: -7.03550798945696
        },
        {
          x: -3.345266956076273,
          y: -7.03550798945696
        },
        {
          x: -3.345266956076273,
          y: -7.03550798945696
        },
        {
          x: -3.345266956076273,
          y: -6.971878839066335
        },
        {
          x: -3.399923938498148,
          y: -6.971878839066335
        },
        {
          x: -3.399923938498148,
          y: -6.971878839066335
        },
        {
          x: -3.472799915060648,
          y: -6.971878839066335
        },
        {
          x: -3.472799915060648,
          y: -6.895523858597585
        },
        {
          x: -3.527456897482523,
          y: -6.895523858597585
        },
        {
          x: -3.527456897482523,
          y: -6.895523858597585
        },
        {
          x: -3.527456897482523,
          y: -6.895523858597585
        },
        {
          x: -3.600332874045023,
          y: -6.83189470820696
        },
        {
          x: -3.600332874045023,
          y: -6.83189470820696
        },
        {
          x: -3.673208850607523,
          y: -6.83189470820696
        },
        {
          x: -3.673208850607523,
          y: -6.83189470820696
        },
        {
          x: -3.673208850607523,
          y: -6.768265557816335
        },
        {
          x: -3.727865833029398,
          y: -6.768265557816335
        },
        {
          x: -3.727865833029398,
          y: -6.768265557816335
        },
        {
          x: -3.800741809591898,
          y: -6.70463640742571
        },
        {
          x: -3.800741809591898,
          y: -6.70463640742571
        },
        {
          x: -3.873617786154398,
          y: -6.70463640742571
        },
        {
          x: -3.873617786154398,
          y: -6.70463640742571
        },
        {
          x: -3.928274768576273,
          y: -6.641007257035085
        },
        {
          x: -3.928274768576273,
          y: -6.641007257035085
        },
        {
          x: -4.001150745138773,
          y: -6.641007257035085
        },
        {
          x: -4.001150745138773,
          y: -6.641007257035085
        },
        {
          x: -4.001150745138773,
          y: -6.641007257035085
        },
        {
          x: -4.001150745138773,
          y: -6.564652276566335
        },
        {
          x: -4.074026721701273,
          y: -6.564652276566335
        },
        {
          x: -4.074026721701273,
          y: -6.564652276566335
        },
        {
          x: -4.074026721701273,
          y: -6.564652276566335
        },
        {
          x: -4.074026721701273,
          y: -6.564652276566335
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.50102312617571
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.437393975785085
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.128683704123148,
          y: -6.37376482539446
        },
        {
          x: -4.074026721701273,
          y: -6.37376482539446
        },
        {
          x: -4.074026721701273,
          y: -6.37376482539446
        },
        {
          x: -4.001150745138773,
          y: -6.37376482539446
        },
        {
          x: -4.001150745138773,
          y: -6.37376482539446
        },
        {
          x: -3.928274768576273,
          y: -6.37376482539446
        },
        {
          x: -3.928274768576273,
          y: -6.37376482539446
        },
        {
          x: -3.873617786154398,
          y: -6.37376482539446
        },
        {
          x: -3.873617786154398,
          y: -6.37376482539446
        },
        {
          x: -3.800741809591898,
          y: -6.37376482539446
        },
        {
          x: -3.800741809591898,
          y: -6.310135675003835
        },
        {
          x: -3.727865833029398,
          y: -6.310135675003835
        },
        {
          x: -3.727865833029398,
          y: -6.233780694535085
        },
        {
          x: -3.673208850607523,
          y: -6.17015154414446
        },
        {
          x: -3.600332874045023,
          y: -6.04289324336321
        },
        {
          x: -3.527456897482523,
          y: -5.979264092972585
        },
        {
          x: -3.527456897482523,
          y: -5.83927996211321
        },
        {
          x: -3.472799915060648,
          y: -5.71202166133196
        },
        {
          x: -3.399923938498148,
          y: -5.50840838008196
        },
        {
          x: -3.345266956076273,
          y: -5.317520928910085
        },
        {
          x: -3.272390979513773,
          y: -5.113907647660085
        },
        {
          x: -3.272390979513773,
          y: -4.910294366410085
        },
        {
          x: -3.199515002951273,
          y: -4.655777764847585
        },
        {
          x: -3.144858020529398,
          y: -4.38853533320696
        },
        {
          x: -3.071982043966898,
          y: -4.121292901566335
        },
        {
          x: -3.071982043966898,
          y: -3.85405046992571
        },
        {
          x: -2.999106067404398,
          y: -3.586808038285085
        },
        {
          x: -2.944449084982523,
          y: -3.255936456253835
        },
        {
          x: -2.944449084982523,
          y: -2.98869402461321
        },
        {
          x: -2.944449084982523,
          y: -2.594193292191335
        },
        {
          x: -2.871573108420023,
          y: -2.32695086055071
        },
        {
          x: -2.871573108420023,
          y: -1.9960792785194599
        },
        {
          x: -2.871573108420023,
          y: -1.6652076964882099
        },
        {
          x: -2.871573108420023,
          y: -1.4106910949257099
        },
        {
          x: -2.871573108420023,
          y: -1.0798195128944599
        },
        {
          x: -2.871573108420023,
          y: -0.6725929503944599
        },
        {
          x: -2.871573108420023,
          y: -0.4180763488319599
        },
        {
          x: -2.871573108420023,
          y: -0.15083391719133488
        },
        {
          x: -2.871573108420023,
          y: 0.11640851444929012
        },
        {
          x: -2.871573108420023,
          y: 0.3836509460899151
        },
        {
          x: -2.871573108420023,
          y: 0.6508933777305401
        },
        {
          x: -2.871573108420023,
          y: 0.9054099792930401
        },
        {
          x: -2.871573108420023,
          y: 1.1090232605430401
        },
        {
          x: -2.871573108420023,
          y: 1.3126365417930401
        },
        {
          x: -2.871573108420023,
          y: 1.5035239929649151
        },
        {
          x: -2.871573108420023,
          y: 1.6435081238242901
        },
        {
          x: -2.871573108420023,
          y: 1.7707664246055401
        },
        {
          x: -2.871573108420023,
          y: 1.9743797058555401
        },
        {
          x: -2.871573108420023,
          y: 2.038008856246165
        },
        {
          x: -2.871573108420023,
          y: 2.165267157027415
        },
        {
          x: -2.871573108420023,
          y: 2.22889630741804
        },
        {
          x: -2.871573108420023,
          y: 2.30525128788679
        },
        {
          x: -2.944449084982523,
          y: 2.43250958866804
        },
        {
          x: -2.944449084982523,
          y: 2.496138739058665
        },
        {
          x: -2.944449084982523,
          y: 2.55976788944929
        },
        {
          x: -2.944449084982523,
          y: 2.63612286991804
        },
        {
          x: -2.944449084982523,
          y: 2.699752020308665
        },
        {
          x: -2.999106067404398,
          y: 2.699752020308665
        },
        {
          x: -2.999106067404398,
          y: 2.699752020308665
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.76338117069929
        },
        {
          x: -2.999106067404398,
          y: 2.699752020308665
        },
        {
          x: -2.999106067404398,
          y: 2.699752020308665
        },
        {
          x: -2.999106067404398,
          y: 2.63612286991804
        },
        {
          x: -2.999106067404398,
          y: 2.63612286991804
        },
        {
          x: -2.999106067404398,
          y: 2.55976788944929
        },
        {
          x: -2.999106067404398,
          y: 2.496138739058665
        },
        {
          x: -2.999106067404398,
          y: 2.43250958866804
        },
        {
          x: -2.999106067404398,
          y: 2.43250958866804
        },
        {
          x: -2.999106067404398,
          y: 2.368880438277415
        },
        {
          x: -2.944449084982523,
          y: 2.30525128788679
        },
        {
          x: -2.871573108420023,
          y: 2.22889630741804
        },
        {
          x: -2.798697131857523,
          y: 2.165267157027415
        },
        {
          x: -2.744040149435648,
          y: 2.10163800663679
        },
        {
          x: -2.671164172873148,
          y: 2.10163800663679
        },
        {
          x: -2.616507190451273,
          y: 2.038008856246165
        },
        {
          x: -2.543631213888773,
          y: 1.9743797058555401
        },
        {
          x: -2.416098254904398,
          y: 1.8980247253867901
        },
        {
          x: -2.343222278341898,
          y: 1.8343955749961651
        },
        {
          x: -2.215689319357523,
          y: 1.7707664246055401
        },
        {
          x: -2.069937366232523,
          y: 1.7707664246055401
        },
        {
          x: -1.887747424826273,
          y: 1.7071372742149151
        },
        {
          x: -1.741995471701273,
          y: 1.7071372742149151
        },
        {
          x: -1.541586536154398,
          y: 1.6435081238242901
        },
        {
          x: -1.359396594748148,
          y: 1.6435081238242901
        },
        {
          x: -1.158987659201273,
          y: 1.6435081238242901
        },
        {
          x: -0.8857027470918979,
          y: 1.6435081238242901
        },
        {
          x: -0.6852938115450229,
          y: 1.6435081238242901
        },
        {
          x: -0.4848848759981479,
          y: 1.6435081238242901
        },
        {
          x: -0.2298189580293979,
          y: 1.6435081238242901
        },
        {
          x: 0.04346595407997711,
          y: 1.6435081238242901
        },
        {
          x: 0.2985318720487271,
          y: 1.6435081238242901
        },
        {
          x: 0.5718167841581021,
          y: 1.6435081238242901
        },
        {
          x: 0.7722257197049771,
          y: 1.6435081238242901
        },
        {
          x: 1.027291637673727,
          y: 1.6435081238242901
        },
        {
          x: 1.300576549783102,
          y: 1.6435081238242901
        },
        {
          x: 1.555642467751852,
          y: 1.6435081238242901
        },
        {
          x: 1.828927379861227,
          y: 1.6435081238242901
        },
        {
          x: 2.029336315408102,
          y: 1.6435081238242901
        },
        {
          x: 2.284402233376852,
          y: 1.7707664246055401
        },
        {
          x: 2.484811168923727,
          y: 1.8980247253867901
        },
        {
          x: 2.685220104470602,
          y: 2.038008856246165
        },
        {
          x: 2.885629040017477,
          y: 2.22889630741804
        },
        {
          x: 3.158913952126852,
          y: 2.368880438277415
        },
        {
          x: 3.359322887673727,
          y: 2.55976788944929
        },
        {
          x: 3.486855846658102,
          y: 2.76338117069929
        },
        {
          x: 3.687264782204977,
          y: 2.96699445194929
        },
        {
          x: 3.887673717751852,
          y: 3.157881903121165
        },
        {
          x: 4.015206676736227,
          y: 3.361495184371165
        },
        {
          x: 4.215615612283102,
          y: 3.62873761601179
        },
        {
          x: 4.343148571267477,
          y: 3.819625067183665
        },
        {
          x: 4.470681530251852,
          y: 4.023238348433665
        },
        {
          x: 4.671090465798727,
          y: 4.29048078007429
        },
        {
          x: 4.816842418923727,
          y: 4.481368231246165
        },
        {
          x: 4.871499401345602,
          y: 4.684981512496165
        },
        {
          x: 5.071908336892477,
          y: 4.95222394413679
        },
        {
          x: 5.199441295876852,
          y: 5.143111395308665
        },
        {
          x: 5.272317272439352,
          y: 5.41035382694929
        },
        {
          x: 5.399850231423727,
          y: 5.61396710819929
        },
        {
          x: 5.472726207986227,
          y: 5.881209539839915
        },
        {
          x: 5.527383190408102,
          y: 6.07209699101179
        },
        {
          x: 5.673135143533102,
          y: 6.339339422652415
        },
        {
          x: 5.727792125954977,
          y: 6.60658185429304
        },
        {
          x: 5.800668102517477,
          y: 6.873824285933665
        },
        {
          x: 5.873544079079977,
          y: 7.128340887496165
        },
        {
          x: 5.928201061501852,
          y: 7.39558331913679
        },
        {
          x: 6.001077038064352,
          y: 7.662825750777415
        },
        {
          x: 6.073953014626852,
          y: 7.993697332808665
        },
        {
          x: 6.128609997048727,
          y: 8.26093976444929
        },
        {
          x: 6.128609997048727,
          y: 8.528182196089915
        },
        {
          x: 6.201485973611227,
          y: 8.782698797652415
        },
        {
          x: 6.256142956033102,
          y: 9.04994122929304
        },
        {
          x: 6.256142956033102,
          y: 9.317183660933665
        },
        {
          x: 6.329018932595602,
          y: 9.648055242964915
        },
        {
          x: 6.401894909158102,
          y: 9.851668524214915
        },
        {
          x: 6.401894909158102,
          y: 10.106185125777415
        },
        {
          x: 6.401894909158102,
          y: 10.37342755741804
        },
        {
          x: 6.456551891579977,
          y: 10.57704083866804
        },
        {
          x: 6.456551891579977,
          y: 10.844283270308665
        },
        {
          x: 6.456551891579977,
          y: 11.11152570194929
        },
        {
          x: 6.456551891579977,
          y: 11.302413153121165
        },
        {
          x: 6.456551891579977,
          y: 11.506026434371165
        },
        {
          x: 6.456551891579977,
          y: 11.77326886601179
        },
        {
          x: 6.456551891579977,
          y: 11.964156317183665
        },
        {
          x: 6.456551891579977,
          y: 12.167769598433665
        },
        {
          x: 6.456551891579977,
          y: 12.43501203007429
        },
        {
          x: 6.456551891579977,
          y: 12.625899481246165
        },
        {
          x: 6.456551891579977,
          y: 12.829512762496165
        },
        {
          x: 6.456551891579977,
          y: 13.02040021366804
        },
        {
          x: 6.456551891579977,
          y: 13.22401349491804
        },
        {
          x: 6.456551891579977,
          y: 13.42762677616804
        },
        {
          x: 6.456551891579977,
          y: 13.618514227339915
        },
        {
          x: 6.456551891579977,
          y: 13.822127508589915
        },
        {
          x: 6.456551891579977,
          y: 14.01301495976179
        },
        {
          x: 6.456551891579977,
          y: 14.21662824101179
        },
        {
          x: 6.401894909158102,
          y: 14.34388654179304
        },
        {
          x: 6.256142956033102,
          y: 14.54749982304304
        },
        {
          x: 6.201485973611227,
          y: 14.75111310429304
        },
        {
          x: 6.128609997048727,
          y: 14.87837140507429
        },
        {
          x: 6.001077038064352,
          y: 15.08198468632429
        },
        {
          x: 5.928201061501852,
          y: 15.20924298710554
        },
        {
          x: 5.873544079079977,
          y: 15.33650128788679
        },
        {
          x: 5.727792125954977,
          y: 15.476485418746165
        },
        {
          x: 5.600259166970602,
          y: 15.603743719527415
        },
        {
          x: 5.527383190408102,
          y: 15.74372785038679
        },
        {
          x: 5.472726207986227,
          y: 15.87098615116804
        },
        {
          x: 5.345193249001852,
          y: 15.934615301558665
        },
        {
          x: 5.199441295876852,
          y: 16.07459943241804
        },
        {
          x: 5.144784313454977,
          y: 16.138228582808665
        },
        {
          x: 4.999032360329977,
          y: 16.32911603398054
        },
        {
          x: 4.944375377908102,
          y: 16.40547101444929
        },
        {
          x: 4.816842418923727,
          y: 16.469100164839915
        },
        {
          x: 4.671090465798727,
          y: 16.53272931523054
        },
        {
          x: 4.616433483376852,
          y: 16.65998761601179
        },
        {
          x: 4.470681530251852,
          y: 16.73634259648054
        },
        {
          x: 4.343148571267477,
          y: 16.799971746871165
        },
        {
          x: 4.215615612283102,
          y: 16.86360089726179
        },
        {
          x: 4.088082653298727,
          y: 16.86360089726179
        },
        {
          x: 3.942330700173727,
          y: 16.927230047652415
        },
        {
          x: 3.741921764626852,
          y: 16.927230047652415
        },
        {
          x: 3.614388805642477,
          y: 16.927230047652415
        },
        {
          x: 3.413979870095602,
          y: 16.927230047652415
        },
        {
          x: 3.286446911111227,
          y: 16.927230047652415
        },
        {
          x: 3.086037975564352,
          y: 16.927230047652415
        },
        {
          x: 2.885629040017477,
          y: 16.927230047652415
        },
        {
          x: 2.685220104470602,
          y: 16.927230047652415
        },
        {
          x: 2.430154186501852,
          y: 16.927230047652415
        },
        {
          x: 2.156869274392477,
          y: 16.927230047652415
        },
        {
          x: 1.901803356423727,
          y: 16.927230047652415
        },
        {
          x: 1.628518444314352,
          y: 16.927230047652415
        },
        {
          x: 1.300576549783102,
          y: 16.927230047652415
        },
        {
          x: 1.027291637673727,
          y: 16.927230047652415
        },
        {
          x: 0.6446927607206021,
          y: 16.927230047652415
        },
        {
          x: 0.2985318720487271,
          y: 16.927230047652415
        },
        {
          x: -0.02941002248252289,
          y: 16.86360089726179
        },
        {
          x: -0.4302278935762729,
          y: 16.799971746871165
        },
        {
          x: -0.7581697881075229,
          y: 16.73634259648054
        },
        {
          x: -1.158987659201273,
          y: 16.65998761601179
        },
        {
          x: -1.614462512716898,
          y: 16.596358465621165
        },
        {
          x: -2.015280383810648,
          y: 16.469100164839915
        },
        {
          x: -2.416098254904398,
          y: 16.32911603398054
        },
        {
          x: -2.798697131857523,
          y: 16.20185773319929
        },
        {
          x: -3.199515002951273,
          y: 15.99824445194929
        },
        {
          x: -3.600332874045023,
          y: 15.807357000777415
        },
        {
          x: -4.128683704123148,
          y: 15.54011456913679
        },
        {
          x: -4.456625598654398,
          y: 15.272872137496165
        },
        {
          x: -4.857443469748148,
          y: 14.942000555464915
        },
        {
          x: -5.331137317404398,
          y: 14.611128973433665
        }
      ]
    ]
  },
  {
    name: "6",
    strokes: [
      [
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.128168530734087
        },
        {
          x: 0.43154953290832054,
          y: -14.191797681124712
        },
        {
          x: 0.43154953290832054,
          y: -14.191797681124712
        },
        {
          x: 0.43154953290832054,
          y: -14.255426831515337
        },
        {
          x: 0.43154953290832054,
          y: -14.255426831515337
        },
        {
          x: 0.43154953290832054,
          y: -14.319055981905962
        },
        {
          x: 0.43154953290832054,
          y: -14.319055981905962
        },
        {
          x: 0.43154953290832054,
          y: -14.319055981905962
        },
        {
          x: 0.43154953290832054,
          y: -14.382685132296587
        },
        {
          x: 0.43154953290832054,
          y: -14.382685132296587
        },
        {
          x: 0.43154953290832054,
          y: -14.382685132296587
        },
        {
          x: 0.43154953290832054,
          y: -14.382685132296587
        },
        {
          x: 0.43154953290832054,
          y: -14.382685132296587
        },
        {
          x: 0.43154953290832054,
          y: -14.382685132296587
        },
        {
          x: 0.35867355634582054,
          y: -14.382685132296587
        },
        {
          x: 0.35867355634582054,
          y: -14.382685132296587
        },
        {
          x: 0.35867355634582054,
          y: -14.382685132296587
        },
        {
          x: 0.35867355634582054,
          y: -14.382685132296587
        },
        {
          x: 0.35867355634582054,
          y: -14.382685132296587
        },
        {
          x: 0.35867355634582054,
          y: -14.382685132296587
        },
        {
          x: 0.30401657392394554,
          y: -14.382685132296587
        },
        {
          x: 0.30401657392394554,
          y: -14.382685132296587
        },
        {
          x: 0.23114059736144554,
          y: -14.382685132296587
        },
        {
          x: 0.15826462079894554,
          y: -14.382685132296587
        },
        {
          x: 0.10360763837707054,
          y: -14.255426831515337
        },
        {
          x: 0.030731661814570543,
          y: -14.051813550265337
        },
        {
          x: -0.023925320607304457,
          y: -13.924555249484087
        },
        {
          x: -0.09680129716980446,
          y: -13.720941968234087
        },
        {
          x: -0.16967727373230446,
          y: -13.530054517062212
        },
        {
          x: -0.29721023271667946,
          y: -13.262812085421587
        },
        {
          x: -0.37008620927917946,
          y: -13.059198804171587
        },
        {
          x: -0.49761916826355446,
          y: -12.804682202609087
        },
        {
          x: -0.5704951448260545,
          y: -12.537439770968462
        },
        {
          x: -0.6980281038104295,
          y: -12.270197339327837
        },
        {
          x: -0.8255610627948045,
          y: -11.939325757296587
        },
        {
          x: -0.8984370393573045,
          y: -11.672083325655962
        },
        {
          x: -1.0259699983416795,
          y: -11.341211743624712
        },
        {
          x: -1.1535029573260545,
          y: -11.010340161593462
        },
        {
          x: -1.2263789338885545,
          y: -10.679468579562212
        },
        {
          x: -1.3539118928729295,
          y: -10.348596997530962
        },
        {
          x: -1.4814448518573045,
          y: -9.954096265109087
        },
        {
          x: -1.6271968049823045,
          y: -9.623224683077837
        },
        {
          x: -1.7547297639666795,
          y: -9.292353101046587
        },
        {
          x: -1.8276057405291795,
          y: -8.897852368624712
        },
        {
          x: -1.9551386995135545,
          y: -8.566980786593462
        },
        {
          x: -2.0826716584979295,
          y: -8.236109204562212
        },
        {
          x: -2.2102046174823045,
          y: -7.8288826420622115
        },
        {
          x: -2.2830805940448045,
          y: -7.4980110600309615
        },
        {
          x: -2.3559565706073045,
          y: -7.1671394779997115
        },
        {
          x: -2.4834895295916795,
          y: -6.8362678959684615
        },
        {
          x: -2.5563655061541795,
          y: -6.5053963139372115
        },
        {
          x: -2.6110224885760545,
          y: -6.2508797123747115
        },
        {
          x: -2.6838984651385545,
          y: -5.8436531498747115
        },
        {
          x: -2.7385554475604295,
          y: -5.5764107182340865
        },
        {
          x: -2.8114314241229295,
          y: -5.3218941166715865
        },
        {
          x: -2.8114314241229295,
          y: -5.0546516850309615
        },
        {
          x: -2.8843074006854295,
          y: -4.7874092533903365
        },
        {
          x: -2.9389643831073045,
          y: -4.5201668217497115
        },
        {
          x: -3.0118403596698045,
          y: -4.2529243901090865
        },
        {
          x: -3.0118403596698045,
          y: -3.9984077885465865
        },
        {
          x: -3.0847163362323045,
          y: -3.7947945072965865
        },
        {
          x: -3.0847163362323045,
          y: -3.5275520756559615
        },
        {
          x: -3.1393733186541795,
          y: -3.3366646244840865
        },
        {
          x: -3.2122492952166795,
          y: -3.0694221928434615
        },
        {
          x: -3.2122492952166795,
          y: -2.8021797612028365
        },
        {
          x: -3.2851252717791795,
          y: -2.5985664799528365
        },
        {
          x: -3.2851252717791795,
          y: -2.4076790287809615
        },
        {
          x: -3.3397822542010545,
          y: -2.2040657475309615
        },
        {
          x: -3.3397822542010545,
          y: -1.9368233158903365
        },
        {
          x: -3.4126582307635545,
          y: -1.7459358647184615
        },
        {
          x: -3.4126582307635545,
          y: -1.5423225834684615
        },
        {
          x: -3.4673152131854295,
          y: -1.3514351322965865
        },
        {
          x: -3.4673152131854295,
          y: -1.1478218510465865
        },
        {
          x: -3.4673152131854295,
          y: -0.9442085697965865
        },
        {
          x: -3.4673152131854295,
          y: -0.7533211186247115
        },
        {
          x: -3.5401911897479295,
          y: -0.5497078373747115
        },
        {
          x: -3.5401911897479295,
          y: -0.2824654057340865
        },
        {
          x: -3.5401911897479295,
          y: -0.09157795456221152
        },
        {
          x: -3.5401911897479295,
          y: 0.11203532668778848
        },
        {
          x: -3.6130671663104295,
          y: 0.3029227778596635
        },
        {
          x: -3.6130671663104295,
          y: 0.4429069087190385
        },
        {
          x: -3.6130671663104295,
          y: 0.6337943598909135
        },
        {
          x: -3.6130671663104295,
          y: 0.9010367915315385
        },
        {
          x: -3.6130671663104295,
          y: 1.0410209223909135
        },
        {
          x: -3.6130671663104295,
          y: 1.2319083735627885
        },
        {
          x: -3.6130671663104295,
          y: 1.3718925044221635
        },
        {
          x: -3.6130671663104295,
          y: 1.5627799555940385
        },
        {
          x: -3.6130671663104295,
          y: 1.7027640864534135
        },
        {
          x: -3.6130671663104295,
          y: 1.8936515376252885
        },
        {
          x: -3.6130671663104295,
          y: 2.0972648188752885
        },
        {
          x: -3.6130671663104295,
          y: 2.2245231196565385
        },
        {
          x: -3.6130671663104295,
          y: 2.3645072505159135
        },
        {
          x: -3.6130671663104295,
          y: 2.5553947016877885
        },
        {
          x: -3.6130671663104295,
          y: 2.6953788325471635
        },
        {
          x: -3.6130671663104295,
          y: 2.8862662837190385
        },
        {
          x: -3.6130671663104295,
          y: 3.0262504145784135
        },
        {
          x: -3.6130671663104295,
          y: 3.2171378657502885
        },
        {
          x: -3.6130671663104295,
          y: 3.3571219966096635
        },
        {
          x: -3.6130671663104295,
          y: 3.4843802973909135
        },
        {
          x: -3.6130671663104295,
          y: 3.6243644282502885
        },
        {
          x: -3.6130671663104295,
          y: 3.8152518794221635
        },
        {
          x: -3.6130671663104295,
          y: 3.9552360102815385
        },
        {
          x: -3.6130671663104295,
          y: 4.0824943110627885
        },
        {
          x: -3.6130671663104295,
          y: 4.2097526118440385
        },
        {
          x: -3.6130671663104295,
          y: 4.3497367427034135
        },
        {
          x: -3.6130671663104295,
          y: 4.4769950434846635
        },
        {
          x: -3.6130671663104295,
          y: 4.6169791743440385
        },
        {
          x: -3.6130671663104295,
          y: 4.7442374751252885
        },
        {
          x: -3.5401911897479295,
          y: 4.8714957759065385
        },
        {
          x: -3.5401911897479295,
          y: 4.9478507563752885
        },
        {
          x: -3.4673152131854295,
          y: 5.0751090571565385
        },
        {
          x: -3.4673152131854295,
          y: 5.1387382075471635
        },
        {
          x: -3.4126582307635545,
          y: 5.2787223384065385
        },
        {
          x: -3.4126582307635545,
          y: 5.4059806391877885
        },
        {
          x: -3.3397822542010545,
          y: 5.4696097895784135
        },
        {
          x: -3.3397822542010545,
          y: 5.6095939204377885
        },
        {
          x: -3.2851252717791795,
          y: 5.6732230708284135
        },
        {
          x: -3.2851252717791795,
          y: 5.8004813716096635
        },
        {
          x: -3.2122492952166795,
          y: 5.9404655024690385
        },
        {
          x: -3.2122492952166795,
          y: 6.0040946528596635
        },
        {
          x: -3.1393733186541795,
          y: 6.0677238032502885
        },
        {
          x: -3.0847163362323045,
          y: 6.1949821040315385
        },
        {
          x: -3.0847163362323045,
          y: 6.2713370845002885
        },
        {
          x: -3.0118403596698045,
          y: 6.3985953852815385
        },
        {
          x: -2.9389643831073045,
          y: 6.4622245356721635
        },
        {
          x: -2.8843074006854295,
          y: 6.6022086665315385
        },
        {
          x: -2.8114314241229295,
          y: 6.6658378169221635
        },
        {
          x: -2.7385554475604295,
          y: 6.7930961177034135
        },
        {
          x: -2.6838984651385545,
          y: 6.8567252680940385
        },
        {
          x: -2.6110224885760545,
          y: 6.9330802485627885
        },
        {
          x: -2.5563655061541795,
          y: 7.0603385493440385
        },
        {
          x: -2.4106135530291795,
          y: 7.1875968501252885
        },
        {
          x: -2.3559565706073045,
          y: 7.2639518305940385
        },
        {
          x: -2.2102046174823045,
          y: 7.3912101313752885
        },
        {
          x: -2.0826716584979295,
          y: 7.4548392817659135
        },
        {
          x: -2.0280146760760545,
          y: 7.5948234126252885
        },
        {
          x: -1.8822627229510545,
          y: 7.7220817134065385
        },
        {
          x: -1.7547297639666795,
          y: 7.7857108637971635
        },
        {
          x: -1.6271968049823045,
          y: 7.9256949946565385
        },
        {
          x: -1.4814448518573045,
          y: 7.9893241450471635
        },
        {
          x: -1.3539118928729295,
          y: 8.052953295437788
        },
        {
          x: -1.2263789338885545,
          y: 8.180211596219038
        },
        {
          x: -1.0988459749041795,
          y: 8.256566576687788
        },
        {
          x: -0.9530940217791795,
          y: 8.320195727078413
        },
        {
          x: -0.8255610627948045,
          y: 8.383824877469038
        },
        {
          x: -0.6251521272479295,
          y: 8.447454027859663
        },
        {
          x: -0.49761916826355446,
          y: 8.447454027859663
        },
        {
          x: -0.37008620927917946,
          y: 8.523809008328413
        },
        {
          x: -0.22433425615417946,
          y: 8.587438158719038
        },
        {
          x: -0.023925320607304457,
          y: 8.587438158719038
        },
        {
          x: 0.10360763837707054,
          y: 8.587438158719038
        },
        {
          x: 0.23114059736144554,
          y: 8.587438158719038
        },
        {
          x: 0.35867355634582054,
          y: 8.587438158719038
        },
        {
          x: 0.5590824918926955,
          y: 8.587438158719038
        },
        {
          x: 0.7048344450176955,
          y: 8.587438158719038
        },
        {
          x: 0.8323674040020705,
          y: 8.587438158719038
        },
        {
          x: 0.8870243864239455,
          y: 8.587438158719038
        },
        {
          x: 1.0874333219708205,
          y: 8.587438158719038
        },
        {
          x: 1.2331852750958205,
          y: 8.587438158719038
        },
        {
          x: 1.3607182340801955,
          y: 8.587438158719038
        },
        {
          x: 1.4882511930645705,
          y: 8.587438158719038
        },
        {
          x: 1.6157841520489455,
          y: 8.587438158719038
        },
        {
          x: 1.6886601286114455,
          y: 8.587438158719038
        },
        {
          x: 1.8161930875958205,
          y: 8.587438158719038
        },
        {
          x: 1.9619450407208205,
          y: 8.587438158719038
        },
        {
          x: 2.0894779997051955,
          y: 8.523809008328413
        },
        {
          x: 2.2170109586895705,
          y: 8.447454027859663
        },
        {
          x: 2.3445439176739455,
          y: 8.383824877469038
        },
        {
          x: 2.4902958707989455,
          y: 8.256566576687788
        },
        {
          x: 2.5449528532208205,
          y: 8.180211596219038
        },
        {
          x: 2.6907048063458205,
          y: 8.052953295437788
        },
        {
          x: 2.8182377653301955,
          y: 7.9893241450471635
        },
        {
          x: 2.8728947477520705,
          y: 7.8493400141877885
        },
        {
          x: 3.0186467008770705,
          y: 7.7220817134065385
        },
        {
          x: 3.0733036832989455,
          y: 7.6584525630159135
        },
        {
          x: 3.2190556364239455,
          y: 7.5184684321565385
        },
        {
          x: 3.2737126188458205,
          y: 7.4548392817659135
        },
        {
          x: 3.3465885954083205,
          y: 7.3275809809846635
        },
        {
          x: 3.4741215543926955,
          y: 7.2639518305940385
        },
        {
          x: 3.5469975309551955,
          y: 7.1875968501252885
        },
        {
          x: 3.6016545133770705,
          y: 7.0603385493440385
        },
        {
          x: 3.6745304899395705,
          y: 6.9967093989534135
        },
        {
          x: 3.7474064665020705,
          y: 6.8567252680940385
        },
        {
          x: 3.8020634489239455,
          y: 6.7930961177034135
        },
        {
          x: 3.8749394254864455,
          y: 6.6658378169221635
        },
        {
          x: 3.9478154020489455,
          y: 6.6022086665315385
        },
        {
          x: 4.0024723844708205,
          y: 6.5258536860627885
        },
        {
          x: 4.0753483610333205,
          y: 6.3985953852815385
        },
        {
          x: 4.1482243375958205,
          y: 6.3349662348909135
        },
        {
          x: 4.2028813200176955,
          y: 6.1949821040315385
        },
        {
          x: 4.2757572965801955,
          y: 6.0677238032502885
        },
        {
          x: 4.3304142790020705,
          y: 6.0040946528596635
        },
        {
          x: 4.3304142790020705,
          y: 5.8641105220002885
        },
        {
          x: 4.3304142790020705,
          y: 5.8004813716096635
        },
        {
          x: 4.4032902555645705,
          y: 5.6732230708284135
        },
        {
          x: 4.4032902555645705,
          y: 5.5332389399690385
        },
        {
          x: 4.4761662321270705,
          y: 5.4696097895784135
        },
        {
          x: 4.4761662321270705,
          y: 5.3423514887971635
        },
        {
          x: 4.4761662321270705,
          y: 5.2023673579377885
        },
        {
          x: 4.4761662321270705,
          y: 5.0751090571565385
        },
        {
          x: 4.4761662321270705,
          y: 5.0114799067659135
        },
        {
          x: 4.5308232145489455,
          y: 4.8078666255159135
        },
        {
          x: 4.5308232145489455,
          y: 4.6806083247346635
        },
        {
          x: 4.5308232145489455,
          y: 4.5406241938752885
        },
        {
          x: 4.5308232145489455,
          y: 4.4133658930940385
        },
        {
          x: 4.5308232145489455,
          y: 4.2861075923127885
        },
        {
          x: 4.5308232145489455,
          y: 4.1461234614534135
        },
        {
          x: 4.5308232145489455,
          y: 3.9552360102815385
        },
        {
          x: 4.5308232145489455,
          y: 3.8152518794221635
        },
        {
          x: 4.5308232145489455,
          y: 3.6243644282502885
        },
        {
          x: 4.5308232145489455,
          y: 3.4843802973909135
        },
        {
          x: 4.5308232145489455,
          y: 3.2934928462190385
        },
        {
          x: 4.5308232145489455,
          y: 3.1535087153596635
        },
        {
          x: 4.5308232145489455,
          y: 2.9626212641877885
        },
        {
          x: 4.5308232145489455,
          y: 2.8226371333284135
        },
        {
          x: 4.5308232145489455,
          y: 2.6317496821565385
        },
        {
          x: 4.5308232145489455,
          y: 2.4917655512971635
        },
        {
          x: 4.5308232145489455,
          y: 2.3645072505159135
        },
        {
          x: 4.5308232145489455,
          y: 2.2245231196565385
        },
        {
          x: 4.5308232145489455,
          y: 2.0336356684846635
        },
        {
          x: 4.4761662321270705,
          y: 1.8936515376252885
        },
        {
          x: 4.4032902555645705,
          y: 1.7663932368440385
        },
        {
          x: 4.3304142790020705,
          y: 1.6391349360627885
        },
        {
          x: 4.2757572965801955,
          y: 1.4991508052034135
        },
        {
          x: 4.2028813200176955,
          y: 1.3718925044221635
        },
        {
          x: 4.1482243375958205,
          y: 1.2319083735627885
        },
        {
          x: 4.0753483610333205,
          y: 1.1046500727815385
        },
        {
          x: 4.0024723844708205,
          y: 0.9646659419221635
        },
        {
          x: 3.8749394254864455,
          y: 0.8374076411409135
        },
        {
          x: 3.8020634489239455,
          y: 0.6337943598909135
        },
        {
          x: 3.6745304899395705,
          y: 0.5065360591096635
        },
        {
          x: 3.5469975309551955,
          y: 0.3792777583284135
        },
        {
          x: 3.4741215543926955,
          y: 0.23929362746903848
        },
        {
          x: 3.3465885954083205,
          y: 0.11203532668778848
        },
        {
          x: 3.2190556364239455,
          y: -0.027948804171586517
        },
        {
          x: 3.0733036832989455,
          y: -0.15520710495283652
        },
        {
          x: 2.9457707243145705,
          y: -0.3588203862028365
        },
        {
          x: 2.8182377653301955,
          y: -0.4224495365934615
        },
        {
          x: 2.6907048063458205,
          y: -0.5497078373747115
        },
        {
          x: 2.5449528532208205,
          y: -0.6896919682340865
        },
        {
          x: 2.4174198942364455,
          y: -0.7533211186247115
        },
        {
          x: 2.2170109586895705,
          y: -0.8805794194059615
        },
        {
          x: 2.0894779997051955,
          y: -0.9442085697965865
        },
        {
          x: 1.8890690641583205,
          y: -1.0205635502653365
        },
        {
          x: 1.6886601286114455,
          y: -1.1478218510465865
        },
        {
          x: 1.5611271696270705,
          y: -1.2114510014372115
        },
        {
          x: 1.3607182340801955,
          y: -1.2750801518278365
        },
        {
          x: 1.0874333219708205,
          y: -1.2750801518278365
        },
        {
          x: 0.8323674040020705,
          y: -1.3514351322965865
        },
        {
          x: 0.6319584684551955,
          y: -1.3514351322965865
        },
        {
          x: 0.30401657392394554,
          y: -1.3514351322965865
        },
        {
          x: 0.030731661814570543,
          y: -1.3514351322965865
        },
        {
          x: -0.29721023271667946,
          y: -1.3514351322965865
        },
        {
          x: -0.6980281038104295,
          y: -1.2750801518278365
        },
        {
          x: -1.0988459749041795,
          y: -1.0841927006559615
        },
        {
          x: -1.4814448518573045,
          y: -0.8169502690153365
        },
        {
          x: -1.8822627229510545,
          y: -0.5497078373747115
        },
        {
          x: -2.2830805940448045,
          y: -0.21883625534346152
        },
        {
          x: -2.7385554475604295,
          y: 0.17566447707841348
        }
      ]
    ]
  },
  {
    name: "7",
    strokes: [
      [
        {
          x: -6.773536233341019,
          y: -6.442763384650732
        },
        {
          x: -6.773536233341019,
          y: -6.442763384650732
        },
        {
          x: -6.773536233341019,
          y: -6.442763384650732
        },
        {
          x: -6.828193215762894,
          y: -6.442763384650732
        },
        {
          x: -6.901069192325394,
          y: -6.442763384650732
        },
        {
          x: -7.028602151309769,
          y: -6.442763384650732
        },
        {
          x: -7.101478127872269,
          y: -6.442763384650732
        },
        {
          x: -7.174354104434769,
          y: -6.442763384650732
        },
        {
          x: -7.301887063419144,
          y: -6.442763384650732
        },
        {
          x: -7.356544045841019,
          y: -6.442763384650732
        },
        {
          x: -7.429420022403519,
          y: -6.442763384650732
        },
        {
          x: -7.502295998966019,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.442763384650732
        },
        {
          x: -7.556952981387894,
          y: -6.506392535041357
        },
        {
          x: -7.556952981387894,
          y: -6.582747515510107
        },
        {
          x: -7.502295998966019,
          y: -6.646376665900732
        },
        {
          x: -7.356544045841019,
          y: -6.710005816291357
        },
        {
          x: -7.229011086856644,
          y: -6.773634966681982
        },
        {
          x: -7.028602151309769,
          y: -6.773634966681982
        },
        {
          x: -6.901069192325394,
          y: -6.837264117072607
        },
        {
          x: -6.700660256778519,
          y: -6.837264117072607
        },
        {
          x: -6.500251321231644,
          y: -6.837264117072607
        },
        {
          x: -6.299842385684769,
          y: -6.837264117072607
        },
        {
          x: -6.099433450137894,
          y: -6.913619097541357
        },
        {
          x: -5.899024514591019,
          y: -6.913619097541357
        },
        {
          x: -5.643958596622269,
          y: -6.913619097541357
        },
        {
          x: -5.443549661075394,
          y: -6.913619097541357
        },
        {
          x: -5.243140725528519,
          y: -6.977248247931982
        },
        {
          x: -4.988074807559769,
          y: -6.977248247931982
        },
        {
          x: -4.787665872012894,
          y: -6.977248247931982
        },
        {
          x: -4.514380959903519,
          y: -7.040877398322607
        },
        {
          x: -4.313972024356644,
          y: -7.040877398322607
        },
        {
          x: -4.058906106387894,
          y: -7.104506548713232
        },
        {
          x: -3.8584971708410194,
          y: -7.104506548713232
        },
        {
          x: -3.5852122587316444,
          y: -7.104506548713232
        },
        {
          x: -3.3848033231847694,
          y: -7.104506548713232
        },
        {
          x: -3.1843943876378944,
          y: -7.104506548713232
        },
        {
          x: -2.9293284696691444,
          y: -7.104506548713232
        },
        {
          x: -2.6560435575597694,
          y: -7.104506548713232
        },
        {
          x: -2.4556346220128944,
          y: -7.104506548713232
        },
        {
          x: -2.2005687040441444,
          y: -7.104506548713232
        },
        {
          x: -2.0001597684972694,
          y: -7.104506548713232
        },
        {
          x: -1.7268748563878944,
          y: -7.104506548713232
        },
        {
          x: -1.5446849149816444,
          y: -7.104506548713232
        },
        {
          x: -1.2714000028722694,
          y: -7.104506548713232
        },
        {
          x: -1.0709910673253944,
          y: -7.104506548713232
        },
        {
          x: -0.8159251493566444,
          y: -7.104506548713232
        },
        {
          x: -0.6155162138097694,
          y: -7.104506548713232
        },
        {
          x: -0.4151072782628944,
          y: -7.104506548713232
        },
        {
          x: -0.2146983427160194,
          y: -7.104506548713232
        },
        {
          x: 0.0585865693933556,
          y: -7.104506548713232
        },
        {
          x: 0.2589955049402306,
          y: -7.104506548713232
        },
        {
          x: 0.3865284639246056,
          y: -7.104506548713232
        },
        {
          x: 0.5869373994714806,
          y: -7.104506548713232
        },
        {
          x: 0.7873463350183556,
          y: -7.104506548713232
        },
        {
          x: 0.9877552705652306,
          y: -7.040877398322607
        },
        {
          x: 1.1152882295496056,
          y: -7.040877398322607
        },
        {
          x: 1.2428211885339806,
          y: -7.040877398322607
        },
        {
          x: 1.4432301240808556,
          y: -6.977248247931982
        },
        {
          x: 1.5707630830652306,
          y: -6.977248247931982
        },
        {
          x: 1.7165150361902306,
          y: -6.913619097541357
        },
        {
          x: 1.8987049775964806,
          y: -6.913619097541357
        },
        {
          x: 2.0444569307214806,
          y: -6.837264117072607
        },
        {
          x: 2.1719898897058556,
          y: -6.837264117072607
        },
        {
          x: 2.2995228486902306,
          y: -6.773634966681982
        },
        {
          x: 2.4270558076746056,
          y: -6.710005816291357
        },
        {
          x: 2.5728077607996056,
          y: -6.710005816291357
        },
        {
          x: 2.7732166963464806,
          y: -6.646376665900732
        },
        {
          x: 2.8278736787683556,
          y: -6.582747515510107
        },
        {
          x: 2.9736256318933556,
          y: -6.582747515510107
        },
        {
          x: 3.1011585908777306,
          y: -6.506392535041357
        },
        {
          x: 3.2286915498621056,
          y: -6.442763384650732
        },
        {
          x: 3.3562245088464806,
          y: -6.442763384650732
        },
        {
          x: 3.5019764619714806,
          y: -6.379134234260107
        },
        {
          x: 3.6295094209558556,
          y: -6.379134234260107
        },
        {
          x: 3.7023853975183556,
          y: -6.315505083869482
        },
        {
          x: 3.7570423799402306,
          y: -6.315505083869482
        },
        {
          x: 3.8845753389246056,
          y: -6.251875933478857
        },
        {
          x: 3.9574513154871056,
          y: -6.251875933478857
        },
        {
          x: 4.030327292049606,
          y: -6.175520953010107
        },
        {
          x: 4.084984274471481,
          y: -6.175520953010107
        },
        {
          x: 4.157860251033981,
          y: -6.111891802619482
        },
        {
          x: 4.230736227596481,
          y: -6.111891802619482
        },
        {
          x: 4.285393210018356,
          y: -6.048262652228857
        },
        {
          x: 4.358269186580856,
          y: -6.048262652228857
        },
        {
          x: 4.431145163143356,
          y: -5.984633501838232
        },
        {
          x: 4.431145163143356,
          y: -5.921004351447607
        },
        {
          x: 4.485802145565231,
          y: -5.844649370978857
        },
        {
          x: 4.485802145565231,
          y: -5.844649370978857
        },
        {
          x: 4.558678122127731,
          y: -5.781020220588232
        },
        {
          x: 4.558678122127731,
          y: -5.717391070197607
        },
        {
          x: 4.613335104549606,
          y: -5.717391070197607
        },
        {
          x: 4.686211081112106,
          y: -5.653761919806982
        },
        {
          x: 4.686211081112106,
          y: -5.653761919806982
        },
        {
          x: 4.686211081112106,
          y: -5.590132769416357
        },
        {
          x: 4.759087057674606,
          y: -5.590132769416357
        },
        {
          x: 4.759087057674606,
          y: -5.590132769416357
        },
        {
          x: 4.813744040096481,
          y: -5.513777788947607
        },
        {
          x: 4.813744040096481,
          y: -5.513777788947607
        },
        {
          x: 4.813744040096481,
          y: -5.513777788947607
        },
        {
          x: 4.813744040096481,
          y: -5.513777788947607
        },
        {
          x: 4.886620016658981,
          y: -5.513777788947607
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.450148638556982
        },
        {
          x: 4.886620016658981,
          y: -5.386519488166357
        },
        {
          x: 4.886620016658981,
          y: -5.386519488166357
        },
        {
          x: 4.886620016658981,
          y: -5.386519488166357
        },
        {
          x: 4.886620016658981,
          y: -5.386519488166357
        },
        {
          x: 4.886620016658981,
          y: -5.322890337775732
        },
        {
          x: 4.886620016658981,
          y: -5.322890337775732
        },
        {
          x: 4.886620016658981,
          y: -5.322890337775732
        },
        {
          x: 4.886620016658981,
          y: -5.259261187385107
        },
        {
          x: 4.813744040096481,
          y: -5.259261187385107
        },
        {
          x: 4.813744040096481,
          y: -5.259261187385107
        },
        {
          x: 4.759087057674606,
          y: -5.182906206916357
        },
        {
          x: 4.686211081112106,
          y: -5.182906206916357
        },
        {
          x: 4.613335104549606,
          y: -5.119277056525732
        },
        {
          x: 4.558678122127731,
          y: -5.119277056525732
        },
        {
          x: 4.485802145565231,
          y: -5.055647906135107
        },
        {
          x: 4.431145163143356,
          y: -4.992018755744482
        },
        {
          x: 4.358269186580856,
          y: -4.992018755744482
        },
        {
          x: 4.285393210018356,
          y: -4.928389605353857
        },
        {
          x: 4.230736227596481,
          y: -4.852034624885107
        },
        {
          x: 4.157860251033981,
          y: -4.852034624885107
        },
        {
          x: 4.084984274471481,
          y: -4.788405474494482
        },
        {
          x: 4.030327292049606,
          y: -4.724776324103857
        },
        {
          x: 3.9574513154871056,
          y: -4.661147173713232
        },
        {
          x: 3.8845753389246056,
          y: -4.597518023322607
        },
        {
          x: 3.8299183565027306,
          y: -4.521163042853857
        },
        {
          x: 3.7570423799402306,
          y: -4.457533892463232
        },
        {
          x: 3.7023853975183556,
          y: -4.330275591681982
        },
        {
          x: 3.6295094209558556,
          y: -4.266646441291357
        },
        {
          x: 3.5566334443933556,
          y: -4.126662310431982
        },
        {
          x: 3.5019764619714806,
          y: -4.063033160041357
        },
        {
          x: 3.4291004854089806,
          y: -3.935774859260107
        },
        {
          x: 3.3562245088464806,
          y: -3.795790728400732
        },
        {
          x: 3.3015675264246056,
          y: -3.668532427619482
        },
        {
          x: 3.1558155732996056,
          y: -3.528548296760107
        },
        {
          x: 3.1011585908777306,
          y: -3.401289995978857
        },
        {
          x: 3.0282826143152306,
          y: -3.261305865119482
        },
        {
          x: 2.9736256318933556,
          y: -3.070418413947607
        },
        {
          x: 2.8278736787683556,
          y: -2.866805132697607
        },
        {
          x: 2.7732166963464806,
          y: -2.675917681525732
        },
        {
          x: 2.7003407197839806,
          y: -2.472304400275732
        },
        {
          x: 2.5728077607996056,
          y: -2.205061968635107
        },
        {
          x: 2.4999317842371056,
          y: -2.014174517463232
        },
        {
          x: 2.3723988252527306,
          y: -1.746932085822607
        },
        {
          x: 2.2995228486902306,
          y: -1.416060503791357
        },
        {
          x: 2.1719898897058556,
          y: -1.085188921760107
        },
        {
          x: 2.0991139131433556,
          y: -0.754317339728857
        },
        {
          x: 1.9715809541589806,
          y: -0.42344575769760695
        },
        {
          x: 1.8987049775964806,
          y: -0.09257417566635695
        },
        {
          x: 1.7711720186121056,
          y: 0.23829740636489305
        },
        {
          x: 1.7165150361902306,
          y: 0.632798138786768
        },
        {
          x: 1.5707630830652306,
          y: 1.103653851677393
        },
        {
          x: 1.5161061006433556,
          y: 1.498154584099268
        },
        {
          x: 1.3703541475183556,
          y: 1.892655316521143
        },
        {
          x: 1.3156971650964806,
          y: 2.287156048943018
        },
        {
          x: 1.1699452119714806,
          y: 2.694382611443018
        },
        {
          x: 1.1152882295496056,
          y: 3.088883343864893
        },
        {
          x: 0.9877552705652306,
          y: 3.547013226677393
        },
        {
          x: 0.9148792940027306,
          y: 3.954239789177393
        },
        {
          x: 0.7873463350183556,
          y: 4.348740521599268
        },
        {
          x: 0.7144703584558556,
          y: 4.743241254021143
        },
        {
          x: 0.6415943818933556,
          y: 5.137741986443018
        },
        {
          x: 0.5140614229089806,
          y: 5.468613568474268
        },
        {
          x: 0.4411854463464806,
          y: 5.939469281364893
        },
        {
          x: 0.3136524873621056,
          y: 6.270340863396143
        },
        {
          x: 0.2589955049402306,
          y: 6.601212445427393
        },
        {
          x: 0.1861195283777306,
          y: 6.855729046989893
        },
        {
          x: 0.1132435518152306,
          y: 7.186600629021143
        },
        {
          x: 0.0585865693933556,
          y: 7.453843060661768
        },
        {
          x: -0.0871653837316444,
          y: 7.848343793083643
        },
        {
          x: -0.1418223661535194,
          y: 8.051957074333643
        },
        {
          x: -0.2146983427160194,
          y: 8.319199505974268
        },
        {
          x: -0.2875743192785194,
          y: 8.586441937614893
        },
        {
          x: -0.3422313017003944,
          y: 8.777329388786768
        },
        {
          x: -0.4151072782628944,
          y: 8.980942670036768
        },
        {
          x: -0.4697642606847694,
          y: 9.248185101677393
        },
        {
          x: -0.5426402372472694,
          y: 9.375443402458643
        },
        {
          x: -0.6155162138097694,
          y: 9.579056683708643
        },
        {
          x: -0.6701731962316444,
          y: 9.706314984489893
        },
        {
          x: -0.6701731962316444,
          y: 9.909928265739893
        },
        {
          x: -0.7430491727941444,
          y: 10.037186566521143
        },
        {
          x: -0.8705821317785194,
          y: 10.240799847771143
        },
        {
          x: -0.9434581083410194,
          y: 10.431687298943018
        },
        {
          x: -1.0163340849035194,
          y: 10.571671429802393
        },
        {
          x: -1.0709910673253944,
          y: 10.698929730583643
        },
        {
          x: -1.0709910673253944,
          y: 10.838913861443018
        },
        {
          x: -1.1438670438878944,
          y: 10.966172162224268
        },
        {
          x: -1.2714000028722694,
          y: 11.169785443474268
        },
        {
          x: -1.2714000028722694,
          y: 11.297043744255518
        },
        {
          x: -1.3442759794347694,
          y: 11.424302045036768
        },
        {
          x: -1.3989329618566444,
          y: 11.564286175896143
        },
        {
          x: -1.3989329618566444,
          y: 11.691544476677393
        },
        {
          x: -1.4718089384191444,
          y: 11.831528607536768
        },
        {
          x: -1.5446849149816444,
          y: 12.022416058708643
        },
        {
          x: -1.5446849149816444,
          y: 12.162400189568018
        },
        {
          x: -1.5993418974035194,
          y: 12.289658490349268
        },
        {
          x: -1.6722178739660194,
          y: 12.416916791130518
        },
        {
          x: -1.6722178739660194,
          y: 12.556900921989893
        },
        {
          x: -1.7268748563878944,
          y: 12.684159222771143
        },
        {
          x: -1.7268748563878944,
          y: 12.887772504021143
        },
        {
          x: -1.7997508329503944,
          y: 13.015030804802393
        },
        {
          x: -1.7997508329503944,
          y: 13.155014935661768
        },
        {
          x: -1.7997508329503944,
          y: 13.282273236443018
        },
        {
          x: -1.8726268095128944,
          y: 13.485886517693018
        },
        {
          x: -1.8726268095128944,
          y: 13.613144818474268
        },
        {
          x: -1.9272837919347694,
          y: 13.816758099724268
        },
        {
          x: -1.9272837919347694,
          y: 13.944016400505518
        },
        {
          x: -2.0001597684972694,
          y: 14.071274701286768
        },
        {
          x: -2.0001597684972694,
          y: 14.211258832146143
        },
        {
          x: -2.0730357450597694,
          y: 14.338517132927393
        },
        {
          x: -2.0730357450597694,
          y: 14.402146283318018
        },
        {
          x: -2.1276927274816444,
          y: 14.605759564568018
        },
        {
          x: -2.2005687040441444,
          y: 14.669388714958643
        },
        {
          x: -2.2005687040441444,
          y: 14.809372845818018
        },
        {
          x: -2.2005687040441444,
          y: 14.873001996208643
        },
        {
          x: -2.2734446806066444,
          y: 15.000260296989893
        },
        {
          x: -2.2734446806066444,
          y: 15.063889447380518
        },
        {
          x: -2.3281016630285194,
          y: 15.203873578239893
        },
        {
          x: -2.3281016630285194,
          y: 15.267502728630518
        },
        {
          x: -2.3281016630285194,
          y: 15.331131879021143
        },
        {
          x: -2.4009776395910194,
          y: 15.394761029411768
        },
        {
          x: -2.4009776395910194,
          y: 15.394761029411768
        },
        {
          x: -2.4009776395910194,
          y: 15.471116009880518
        },
        {
          x: -2.4009776395910194,
          y: 15.534745160271143
        },
        {
          x: -2.4009776395910194,
          y: 15.534745160271143
        },
        {
          x: -2.4556346220128944,
          y: 15.598374310661768
        },
        {
          x: -2.4556346220128944,
          y: 15.598374310661768
        },
        {
          x: -2.4556346220128944,
          y: 15.598374310661768
        },
        {
          x: -2.4556346220128944,
          y: 15.598374310661768
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        },
        {
          x: -2.4556346220128944,
          y: 15.662003461052393
        }
      ]
    ]
  },
  {
    name: "8",
    strokes: [
      [
        {
          x: 1.6842506763547362,
          y: -11.057229596515043
        },
        {
          x: 1.6842506763547362,
          y: -11.057229596515043
        },
        {
          x: 1.6842506763547362,
          y: -11.057229596515043
        },
        {
          x: 1.6113746997922362,
          y: -11.057229596515043
        },
        {
          x: 1.6113746997922362,
          y: -11.057229596515043
        },
        {
          x: 1.5384987232297362,
          y: -11.057229596515043
        },
        {
          x: 1.4838417408078612,
          y: -11.133584576983793
        },
        {
          x: 1.4109657642453612,
          y: -11.197213727374418
        },
        {
          x: 1.3380897876828612,
          y: -11.260842877765043
        },
        {
          x: 1.2834328052609862,
          y: -11.260842877765043
        },
        {
          x: 1.2834328052609862,
          y: -11.324472028155668
        },
        {
          x: 1.2105568286984862,
          y: -11.324472028155668
        },
        {
          x: 1.1376808521359862,
          y: -11.388101178546293
        },
        {
          x: 1.1376808521359862,
          y: -11.388101178546293
        },
        {
          x: 1.1376808521359862,
          y: -11.464456159015043
        },
        {
          x: 1.0830238697141112,
          y: -11.464456159015043
        },
        {
          x: 1.0830238697141112,
          y: -11.528085309405668
        },
        {
          x: 1.0101478931516112,
          y: -11.528085309405668
        },
        {
          x: 1.0101478931516112,
          y: -11.591714459796293
        },
        {
          x: 1.0101478931516112,
          y: -11.591714459796293
        },
        {
          x: 1.0101478931516112,
          y: -11.655343610186918
        },
        {
          x: 0.9554909107297362,
          y: -11.655343610186918
        },
        {
          x: 0.9554909107297362,
          y: -11.655343610186918
        },
        {
          x: 0.9554909107297362,
          y: -11.718972760577543
        },
        {
          x: 0.9554909107297362,
          y: -11.718972760577543
        },
        {
          x: 0.8826149341672362,
          y: -11.718972760577543
        },
        {
          x: 0.8826149341672362,
          y: -11.795327741046293
        },
        {
          x: 0.8826149341672362,
          y: -11.795327741046293
        },
        {
          x: 0.8097389576047362,
          y: -11.795327741046293
        },
        {
          x: 0.8097389576047362,
          y: -11.858956891436918
        },
        {
          x: 0.7550819751828612,
          y: -11.858956891436918
        },
        {
          x: 0.7550819751828612,
          y: -11.858956891436918
        },
        {
          x: 0.6822059986203612,
          y: -11.858956891436918
        },
        {
          x: 0.6822059986203612,
          y: -11.858956891436918
        },
        {
          x: 0.6093300220578612,
          y: -11.858956891436918
        },
        {
          x: 0.5546730396359862,
          y: -11.858956891436918
        },
        {
          x: 0.48179706307348624,
          y: -11.858956891436918
        },
        {
          x: 0.40892108651098624,
          y: -11.858956891436918
        },
        {
          x: 0.40892108651098624,
          y: -11.858956891436918
        },
        {
          x: 0.35426410408911124,
          y: -11.858956891436918
        },
        {
          x: 0.28138812752661124,
          y: -11.858956891436918
        },
        {
          x: 0.15385516854223624,
          y: -11.858956891436918
        },
        {
          x: 0.08097919197973624,
          y: -11.858956891436918
        },
        {
          x: 0.026322209557861243,
          y: -11.858956891436918
        },
        {
          x: -0.11942974356713876,
          y: -11.858956891436918
        },
        {
          x: -0.17408672598901376,
          y: -11.858956891436918
        },
        {
          x: -0.24696270255151376,
          y: -11.858956891436918
        },
        {
          x: -0.37449566153588876,
          y: -11.858956891436918
        },
        {
          x: -0.5020286205202638,
          y: -11.858956891436918
        },
        {
          x: -0.5749045970827638,
          y: -11.858956891436918
        },
        {
          x: -0.7024375560671388,
          y: -11.858956891436918
        },
        {
          x: -0.8481895091921388,
          y: -11.795327741046293
        },
        {
          x: -0.9757224681765138,
          y: -11.718972760577543
        },
        {
          x: -1.1032554271608888,
          y: -11.655343610186918
        },
        {
          x: -1.2307883861452638,
          y: -11.528085309405668
        },
        {
          x: -1.3765403392702638,
          y: -11.464456159015043
        },
        {
          x: -1.5040732982546388,
          y: -11.388101178546293
        },
        {
          x: -1.6316062572390138,
          y: -11.260842877765043
        },
        {
          x: -1.7591392162233888,
          y: -11.197213727374418
        },
        {
          x: -1.9048911693483888,
          y: -11.133584576983793
        },
        {
          x: -2.1053001048952638,
          y: -10.993600446124418
        },
        {
          x: -2.2328330638796388,
          y: -10.929971295733793
        },
        {
          x: -2.3603660228640138,
          y: -10.802712994952543
        },
        {
          x: -2.4878989818483888,
          y: -10.726358014483793
        },
        {
          x: -2.6883079173952638,
          y: -10.599099713702543
        },
        {
          x: -2.8340598705202638,
          y: -10.471841412921293
        },
        {
          x: -2.9615928295046388,
          y: -10.395486432452543
        },
        {
          x: -3.1620017650515138,
          y: -10.268228131671293
        },
        {
          x: -3.2895347240358888,
          y: -10.140969830890043
        },
        {
          x: -3.4899436595827638,
          y: -10.000985700030668
        },
        {
          x: -3.6174766185671388,
          y: -9.937356549640043
        },
        {
          x: -3.8178855541140138,
          y: -9.810098248858793
        },
        {
          x: -3.9454185130983888,
          y: -9.670114117999418
        },
        {
          x: -4.091170466223389,
          y: -9.542855817218168
        },
        {
          x: -4.291579401770264,
          y: -9.402871686358793
        },
        {
          x: -4.419112360754639,
          y: -9.275613385577543
        },
        {
          x: -4.546645319739014,
          y: -9.148355084796293
        },
        {
          x: -4.747054255285889,
          y: -9.008370953936918
        },
        {
          x: -4.874587214270264,
          y: -8.881112653155668
        },
        {
          x: -5.020339167395264,
          y: -8.817483502765043
        },
        {
          x: -5.147872126379639,
          y: -8.677499371905668
        },
        {
          x: -5.275405085364014,
          y: -8.550241071124418
        },
        {
          x: -5.402938044348389,
          y: -8.410256940265043
        },
        {
          x: -5.548689997473389,
          y: -8.282998639483793
        },
        {
          x: -5.676222956457764,
          y: -8.155740338702543
        },
        {
          x: -5.803755915442139,
          y: -8.079385358233793
        },
        {
          x: -5.876631892004639,
          y: -7.952127057452543
        },
        {
          x: -6.004164850989014,
          y: -7.824868756671293
        },
        {
          x: -6.077040827551514,
          y: -7.748513776202543
        },
        {
          x: -6.204573786535889,
          y: -7.621255475421293
        },
        {
          x: -6.332106745520264,
          y: -7.481271344561918
        },
        {
          x: -6.404982722082764,
          y: -7.354013043780668
        },
        {
          x: -6.532515681067139,
          y: -7.290383893390043
        },
        {
          x: -6.605391657629639,
          y: -7.150399762530668
        },
        {
          x: -6.660048640051514,
          y: -7.023141461749418
        },
        {
          x: -6.805800593176514,
          y: -6.895883160968168
        },
        {
          x: -6.860457575598389,
          y: -6.819528180499418
        },
        {
          x: -6.933333552160889,
          y: -6.692269879718168
        },
        {
          x: -7.006209528723389,
          y: -6.628640729327543
        },
        {
          x: -7.060866511145264,
          y: -6.488656598468168
        },
        {
          x: -7.133742487707764,
          y: -6.361398297686918
        },
        {
          x: -7.206618464270264,
          y: -6.234139996905668
        },
        {
          x: -7.261275446692139,
          y: -6.157785016436918
        },
        {
          x: -7.261275446692139,
          y: -6.030526715655668
        },
        {
          x: -7.334151423254639,
          y: -5.966897565265043
        },
        {
          x: -7.334151423254639,
          y: -5.826913434405668
        },
        {
          x: -7.334151423254639,
          y: -5.699655133624418
        },
        {
          x: -7.388808405676514,
          y: -5.636025983233793
        },
        {
          x: -7.388808405676514,
          y: -5.496041852374418
        },
        {
          x: -7.461684382239014,
          y: -5.368783551593168
        },
        {
          x: -7.461684382239014,
          y: -5.305154401202543
        },
        {
          x: -7.461684382239014,
          y: -5.165170270343168
        },
        {
          x: -7.461684382239014,
          y: -5.101541119952543
        },
        {
          x: -7.461684382239014,
          y: -4.974282819171293
        },
        {
          x: -7.461684382239014,
          y: -4.834298688311918
        },
        {
          x: -7.461684382239014,
          y: -4.707040387530668
        },
        {
          x: -7.461684382239014,
          y: -4.643411237140043
        },
        {
          x: -7.461684382239014,
          y: -4.503427106280668
        },
        {
          x: -7.461684382239014,
          y: -4.376168805499418
        },
        {
          x: -7.461684382239014,
          y: -4.248910504718168
        },
        {
          x: -7.461684382239014,
          y: -4.108926373858793
        },
        {
          x: -7.461684382239014,
          y: -4.045297223468168
        },
        {
          x: -7.461684382239014,
          y: -3.918038922686918
        },
        {
          x: -7.461684382239014,
          y: -3.778054791827543
        },
        {
          x: -7.461684382239014,
          y: -3.650796491046293
        },
        {
          x: -7.461684382239014,
          y: -3.587167340655668
        },
        {
          x: -7.461684382239014,
          y: -3.447183209796293
        },
        {
          x: -7.461684382239014,
          y: -3.383554059405668
        },
        {
          x: -7.461684382239014,
          y: -3.256295758624418
        },
        {
          x: -7.461684382239014,
          y: -3.179940778155668
        },
        {
          x: -7.461684382239014,
          y: -3.052682477374418
        },
        {
          x: -7.461684382239014,
          y: -2.989053326983793
        },
        {
          x: -7.461684382239014,
          y: -2.925424176593168
        },
        {
          x: -7.461684382239014,
          y: -2.785440045733793
        },
        {
          x: -7.461684382239014,
          y: -2.721810895343168
        },
        {
          x: -7.461684382239014,
          y: -2.658181744952543
        },
        {
          x: -7.388808405676514,
          y: -2.518197614093168
        },
        {
          x: -7.388808405676514,
          y: -2.454568463702543
        },
        {
          x: -7.334151423254639,
          y: -2.390939313311918
        },
        {
          x: -7.261275446692139,
          y: -2.327310162921293
        },
        {
          x: -7.206618464270264,
          y: -2.263681012530668
        },
        {
          x: -7.206618464270264,
          y: -2.123696881671293
        },
        {
          x: -7.133742487707764,
          y: -2.060067731280668
        },
        {
          x: -7.060866511145264,
          y: -1.9964385808900431
        },
        {
          x: -7.006209528723389,
          y: -1.8564544500306681
        },
        {
          x: -6.933333552160889,
          y: -1.7928252996400431
        },
        {
          x: -6.933333552160889,
          y: -1.7291961492494181
        },
        {
          x: -6.860457575598389,
          y: -1.6655669988587931
        },
        {
          x: -6.805800593176514,
          y: -1.5255828679994181
        },
        {
          x: -6.732924616614014,
          y: -1.4619537176087931
        },
        {
          x: -6.660048640051514,
          y: -1.3983245672181681
        },
        {
          x: -6.605391657629639,
          y: -1.3346954168275431
        },
        {
          x: -6.532515681067139,
          y: -1.2710662664369181
        },
        {
          x: -6.477858698645264,
          y: -1.1947112859681681
        },
        {
          x: -6.404982722082764,
          y: -1.1310821355775431
        },
        {
          x: -6.404982722082764,
          y: -1.0674529851869181
        },
        {
          x: -6.332106745520264,
          y: -1.0038238347962931
        },
        {
          x: -6.277449763098389,
          y: -0.9401946844056681
        },
        {
          x: -6.204573786535889,
          y: -0.9401946844056681
        },
        {
          x: -6.131697809973389,
          y: -0.8638397039369181
        },
        {
          x: -6.077040827551514,
          y: -0.8002105535462931
        },
        {
          x: -6.004164850989014,
          y: -0.7365814031556681
        },
        {
          x: -5.931288874426514,
          y: -0.7365814031556681
        },
        {
          x: -5.876631892004639,
          y: -0.6729522527650431
        },
        {
          x: -5.803755915442139,
          y: -0.6729522527650431
        },
        {
          x: -5.749098933020264,
          y: -0.5965972722962931
        },
        {
          x: -5.603346979895264,
          y: -0.5329681219056681
        },
        {
          x: -5.548689997473389,
          y: -0.5329681219056681
        },
        {
          x: -5.475814020910889,
          y: -0.5329681219056681
        },
        {
          x: -5.348281061926514,
          y: -0.4693389715150431
        },
        {
          x: -5.275405085364014,
          y: -0.4693389715150431
        },
        {
          x: -5.147872126379639,
          y: -0.4057098211244181
        },
        {
          x: -5.074996149817139,
          y: -0.4057098211244181
        },
        {
          x: -4.947463190832764,
          y: -0.4057098211244181
        },
        {
          x: -4.874587214270264,
          y: -0.3420806707337931
        },
        {
          x: -4.747054255285889,
          y: -0.3420806707337931
        },
        {
          x: -4.619521296301514,
          y: -0.3420806707337931
        },
        {
          x: -4.491988337317139,
          y: -0.3420806707337931
        },
        {
          x: -4.346236384192139,
          y: -0.2657256902650431
        },
        {
          x: -4.218703425207764,
          y: -0.2657256902650431
        },
        {
          x: -4.145827448645264,
          y: -0.2657256902650431
        },
        {
          x: -4.018294489660889,
          y: -0.2657256902650431
        },
        {
          x: -3.8907615306765138,
          y: -0.2657256902650431
        },
        {
          x: -3.7632285716921388,
          y: -0.2657256902650431
        },
        {
          x: -3.6174766185671388,
          y: -0.2657256902650431
        },
        {
          x: -3.4899436595827638,
          y: -0.2657256902650431
        },
        {
          x: -3.3624107005983888,
          y: -0.2657256902650431
        },
        {
          x: -3.2166587474733888,
          y: -0.2657256902650431
        },
        {
          x: -3.0891257884890138,
          y: -0.2657256902650431
        },
        {
          x: -2.9615928295046388,
          y: -0.2657256902650431
        },
        {
          x: -2.7611838939577638,
          y: -0.2020965398744181
        },
        {
          x: -2.6336509349733888,
          y: -0.2020965398744181
        },
        {
          x: -2.4878989818483888,
          y: -0.2020965398744181
        },
        {
          x: -2.3603660228640138,
          y: -0.2020965398744181
        },
        {
          x: -2.1599570873171388,
          y: -0.2020965398744181
        },
        {
          x: -2.0324241283327638,
          y: -0.2020965398744181
        },
        {
          x: -1.9048911693483888,
          y: -0.1384673894837931
        },
        {
          x: -1.7044822338015138,
          y: -0.1384673894837931
        },
        {
          x: -1.5769492748171388,
          y: -0.1384673894837931
        },
        {
          x: -1.4311973216921388,
          y: -0.1384673894837931
        },
        {
          x: -1.3036643627077638,
          y: -0.1384673894837931
        },
        {
          x: -1.1761314037233888,
          y: -0.07483823909316811
        },
        {
          x: -0.9757224681765138,
          y: -0.07483823909316811
        },
        {
          x: -0.8481895091921388,
          y: -0.07483823909316811
        },
        {
          x: -0.7024375560671388,
          y: -0.011209088702543113
        },
        {
          x: -0.5749045970827638,
          y: -0.011209088702543113
        },
        {
          x: -0.44737163809838876,
          y: -0.011209088702543113
        },
        {
          x: -0.31983867911401376,
          y: -0.011209088702543113
        },
        {
          x: -0.17408672598901376,
          y: 0.06514589176620689
        },
        {
          x: -0.04655376700463876,
          y: 0.06514589176620689
        },
        {
          x: 0.08097919197973624,
          y: 0.1287750421568319
        },
        {
          x: 0.15385516854223624,
          y: 0.1287750421568319
        },
        {
          x: 0.28138812752661124,
          y: 0.1924041925474569
        },
        {
          x: 0.40892108651098624,
          y: 0.1924041925474569
        },
        {
          x: 0.5546730396359862,
          y: 0.2560333429380819
        },
        {
          x: 0.6822059986203612,
          y: 0.2560333429380819
        },
        {
          x: 0.7550819751828612,
          y: 0.3196624933287069
        },
        {
          x: 0.8826149341672362,
          y: 0.3196624933287069
        },
        {
          x: 1.0101478931516112,
          y: 0.3960174737974569
        },
        {
          x: 1.1376808521359862,
          y: 0.3960174737974569
        },
        {
          x: 1.2834328052609862,
          y: 0.4596466241880819
        },
        {
          x: 1.3380897876828612,
          y: 0.5232757745787069
        },
        {
          x: 1.4838417408078612,
          y: 0.5232757745787069
        },
        {
          x: 1.5384987232297362,
          y: 0.5869049249693319
        },
        {
          x: 1.6842506763547362,
          y: 0.6505340753599569
        },
        {
          x: 1.8117836353391112,
          y: 0.6505340753599569
        },
        {
          x: 1.9393165943234862,
          y: 0.7268890558287069
        },
        {
          x: 2.0668495533078612,
          y: 0.7905182062193319
        },
        {
          x: 2.1397255298703612,
          y: 0.7905182062193319
        },
        {
          x: 2.2672584888547362,
          y: 0.8541473566099569
        },
        {
          x: 2.3947914478391112,
          y: 0.8541473566099569
        },
        {
          x: 2.5405434009641112,
          y: 0.9177765070005819
        },
        {
          x: 2.6680763599484862,
          y: 0.9814056573912069
        },
        {
          x: 2.7956093189328612,
          y: 0.9814056573912069
        },
        {
          x: 2.9413612720578612,
          y: 1.0577606378599569
        },
        {
          x: 3.0688942310422362,
          y: 1.0577606378599569
        },
        {
          x: 3.1964271900266112,
          y: 1.1213897882505819
        },
        {
          x: 3.3968361255734862,
          y: 1.1850189386412069
        },
        {
          x: 3.5243690845578612,
          y: 1.1850189386412069
        },
        {
          x: 3.5972450611203612,
          y: 1.2486480890318319
        },
        {
          x: 3.7247780201047362,
          y: 1.3122772394224569
        },
        {
          x: 3.8523109790891112,
          y: 1.3122772394224569
        },
        {
          x: 3.9980629322141112,
          y: 1.3886322198912069
        },
        {
          x: 4.125595891198486,
          y: 1.4522613702818319
        },
        {
          x: 4.253128850182861,
          y: 1.4522613702818319
        },
        {
          x: 4.398880803307861,
          y: 1.5158905206724569
        },
        {
          x: 4.526413762292236,
          y: 1.5795196710630819
        },
        {
          x: 4.581070744714111,
          y: 1.6431488214537069
        },
        {
          x: 4.726822697839111,
          y: 1.6431488214537069
        },
        {
          x: 4.854355656823486,
          y: 1.7195038019224569
        },
        {
          x: 4.981888615807861,
          y: 1.7831329523130819
        },
        {
          x: 5.054764592370361,
          y: 1.7831329523130819
        },
        {
          x: 5.182297551354736,
          y: 1.8467621027037069
        },
        {
          x: 5.255173527917236,
          y: 1.9103912530943319
        },
        {
          x: 5.382706486901611,
          y: 1.9103912530943319
        },
        {
          x: 5.455582463464111,
          y: 1.9740204034849569
        },
        {
          x: 5.583115422448486,
          y: 2.050375383953707
        },
        {
          x: 5.655991399010986,
          y: 2.050375383953707
        },
        {
          x: 5.710648381432861,
          y: 2.114004534344332
        },
        {
          x: 5.783524357995361,
          y: 2.114004534344332
        },
        {
          x: 5.838181340417236,
          y: 2.177633684734957
        },
        {
          x: 5.911057316979736,
          y: 2.241262835125582
        },
        {
          x: 5.983933293542236,
          y: 2.304891985516207
        },
        {
          x: 6.038590275964111,
          y: 2.381246965984957
        },
        {
          x: 6.111466252526611,
          y: 2.381246965984957
        },
        {
          x: 6.184342229089111,
          y: 2.444876116375582
        },
        {
          x: 6.184342229089111,
          y: 2.508505266766207
        },
        {
          x: 6.238999211510986,
          y: 2.572134417156832
        },
        {
          x: 6.311875188073486,
          y: 2.635763567547457
        },
        {
          x: 6.311875188073486,
          y: 2.712118548016207
        },
        {
          x: 6.311875188073486,
          y: 2.775747698406832
        },
        {
          x: 6.384751164635986,
          y: 2.839376848797457
        },
        {
          x: 6.384751164635986,
          y: 2.966635149578707
        },
        {
          x: 6.384751164635986,
          y: 3.042990130047457
        },
        {
          x: 6.439408147057861,
          y: 3.106619280438082
        },
        {
          x: 6.439408147057861,
          y: 3.170248430828707
        },
        {
          x: 6.439408147057861,
          y: 3.297506731609957
        },
        {
          x: 6.439408147057861,
          y: 3.373861712078707
        },
        {
          x: 6.439408147057861,
          y: 3.437490862469332
        },
        {
          x: 6.512284123620361,
          y: 3.501120012859957
        },
        {
          x: 6.512284123620361,
          y: 3.628378313641207
        },
        {
          x: 6.512284123620361,
          y: 3.704733294109957
        },
        {
          x: 6.512284123620361,
          y: 3.831991594891207
        },
        {
          x: 6.512284123620361,
          y: 3.895620745281832
        },
        {
          x: 6.566941106042236,
          y: 4.035604876141207
        },
        {
          x: 6.566941106042236,
          y: 4.099234026531832
        },
        {
          x: 6.566941106042236,
          y: 4.226492327313082
        },
        {
          x: 6.566941106042236,
          y: 4.366476458172457
        },
        {
          x: 6.566941106042236,
          y: 4.493734758953707
        },
        {
          x: 6.566941106042236,
          y: 4.620993059734957
        },
        {
          x: 6.566941106042236,
          y: 4.697348040203707
        },
        {
          x: 6.566941106042236,
          y: 4.888235491375582
        },
        {
          x: 6.566941106042236,
          y: 4.951864641766207
        },
        {
          x: 6.566941106042236,
          y: 5.091848772625582
        },
        {
          x: 6.566941106042236,
          y: 5.219107073406832
        },
        {
          x: 6.566941106042236,
          y: 5.359091204266207
        },
        {
          x: 6.566941106042236,
          y: 5.486349505047457
        },
        {
          x: 6.566941106042236,
          y: 5.613607805828707
        },
        {
          x: 6.566941106042236,
          y: 5.689962786297457
        },
        {
          x: 6.566941106042236,
          y: 5.817221087078707
        },
        {
          x: 6.566941106042236,
          y: 5.944479387859957
        },
        {
          x: 6.566941106042236,
          y: 6.020834368328707
        },
        {
          x: 6.566941106042236,
          y: 6.148092669109957
        },
        {
          x: 6.566941106042236,
          y: 6.275350969891207
        },
        {
          x: 6.566941106042236,
          y: 6.415335100750582
        },
        {
          x: 6.566941106042236,
          y: 6.478964251141207
        },
        {
          x: 6.566941106042236,
          y: 6.618948382000582
        },
        {
          x: 6.566941106042236,
          y: 6.746206682781832
        },
        {
          x: 6.566941106042236,
          y: 6.873464983563082
        },
        {
          x: 6.566941106042236,
          y: 7.013449114422457
        },
        {
          x: 6.566941106042236,
          y: 7.140707415203707
        },
        {
          x: 6.566941106042236,
          y: 7.280691546063082
        },
        {
          x: 6.566941106042236,
          y: 7.407949846844332
        },
        {
          x: 6.566941106042236,
          y: 7.535208147625582
        },
        {
          x: 6.566941106042236,
          y: 7.675192278484957
        },
        {
          x: 6.566941106042236,
          y: 7.866079729656832
        },
        {
          x: 6.512284123620361,
          y: 8.006063860516207
        },
        {
          x: 6.439408147057861,
          y: 8.196951311688082
        },
        {
          x: 6.439408147057861,
          y: 8.336935442547457
        },
        {
          x: 6.384751164635986,
          y: 8.464193743328707
        },
        {
          x: 6.311875188073486,
          y: 8.667807024578707
        },
        {
          x: 6.238999211510986,
          y: 8.795065325359957
        },
        {
          x: 6.184342229089111,
          y: 8.935049456219332
        },
        {
          x: 6.184342229089111,
          y: 9.062307757000582
        },
        {
          x: 6.111466252526611,
          y: 9.189566057781832
        },
        {
          x: 6.038590275964111,
          y: 9.329550188641207
        },
        {
          x: 5.983933293542236,
          y: 9.520437639813082
        },
        {
          x: 5.911057316979736,
          y: 9.660421770672457
        },
        {
          x: 5.838181340417236,
          y: 9.787680071453707
        },
        {
          x: 5.783524357995361,
          y: 9.927664202313082
        },
        {
          x: 5.655991399010986,
          y: 9.991293352703707
        },
        {
          x: 5.583115422448486,
          y: 10.118551653484957
        },
        {
          x: 5.510239445885986,
          y: 10.322164934734957
        },
        {
          x: 5.455582463464111,
          y: 10.385794085125582
        },
        {
          x: 5.309830510339111,
          y: 10.513052385906832
        },
        {
          x: 5.255173527917236,
          y: 10.653036516766207
        },
        {
          x: 5.182297551354736,
          y: 10.780294817547457
        },
        {
          x: 5.054764592370361,
          y: 10.843923967938082
        },
        {
          x: 4.981888615807861,
          y: 10.983908098797457
        },
        {
          x: 4.854355656823486,
          y: 11.111166399578707
        },
        {
          x: 4.781479680260986,
          y: 11.174795549969332
        },
        {
          x: 4.653946721276611,
          y: 11.314779680828707
        },
        {
          x: 4.526413762292236,
          y: 11.442037981609957
        },
        {
          x: 4.453537785729736,
          y: 11.505667132000582
        },
        {
          x: 4.326004826745361,
          y: 11.645651262859957
        },
        {
          x: 4.198471867760986,
          y: 11.709280413250582
        },
        {
          x: 4.052719914635986,
          y: 11.836538714031832
        },
        {
          x: 3.9251869556516112,
          y: 11.912893694500582
        },
        {
          x: 3.7247780201047362,
          y: 12.040151995281832
        },
        {
          x: 3.5972450611203612,
          y: 12.103781145672457
        },
        {
          x: 3.4697121021359862,
          y: 12.243765276531832
        },
        {
          x: 3.2693031665891112,
          y: 12.307394426922457
        },
        {
          x: 3.1235512134641112,
          y: 12.434652727703707
        },
        {
          x: 2.9413612720578612,
          y: 12.498281878094332
        },
        {
          x: 2.7956093189328612,
          y: 12.574636858563082
        },
        {
          x: 2.5952003833859862,
          y: 12.701895159344332
        },
        {
          x: 2.3947914478391112,
          y: 12.765524309734957
        },
        {
          x: 2.2126015064328612,
          y: 12.829153460125582
        },
        {
          x: 2.0121925708859862,
          y: 12.905508440594332
        },
        {
          x: 1.8117836353391112,
          y: 12.969137590984957
        },
        {
          x: 1.6113746997922362,
          y: 13.032766741375582
        },
        {
          x: 1.4109657642453612,
          y: 13.096395891766207
        },
        {
          x: 1.2105568286984862,
          y: 13.160025042156832
        },
        {
          x: 1.0101478931516112,
          y: 13.236380022625582
        },
        {
          x: 0.8097389576047362,
          y: 13.300009173016207
        },
        {
          x: 0.6093300220578612,
          y: 13.363638323406832
        },
        {
          x: 0.40892108651098624,
          y: 13.427267473797457
        },
        {
          x: 0.22673114510473624,
          y: 13.427267473797457
        },
        {
          x: 0.026322209557861243,
          y: 13.503622454266207
        },
        {
          x: -0.17408672598901376,
          y: 13.567251604656832
        },
        {
          x: -0.37449566153588876,
          y: 13.630880755047457
        },
        {
          x: -0.5749045970827638,
          y: 13.630880755047457
        },
        {
          x: -0.7024375560671388,
          y: 13.694509905438082
        },
        {
          x: -0.9028464916140138,
          y: 13.758139055828707
        },
        {
          x: -1.1032554271608888,
          y: 13.758139055828707
        },
        {
          x: -1.3036643627077638,
          y: 13.758139055828707
        },
        {
          x: -1.4311973216921388,
          y: 13.834494036297457
        },
        {
          x: -1.6316062572390138,
          y: 13.834494036297457
        },
        {
          x: -1.7591392162233888,
          y: 13.834494036297457
        },
        {
          x: -1.9595481517702638,
          y: 13.834494036297457
        },
        {
          x: -2.1599570873171388,
          y: 13.834494036297457
        },
        {
          x: -2.3057090404421388,
          y: 13.834494036297457
        },
        {
          x: -2.4878989818483888,
          y: 13.834494036297457
        },
        {
          x: -2.6336509349733888,
          y: 13.834494036297457
        },
        {
          x: -2.7611838939577638,
          y: 13.834494036297457
        },
        {
          x: -2.9615928295046388,
          y: 13.834494036297457
        },
        {
          x: -3.1620017650515138,
          y: 13.834494036297457
        },
        {
          x: -3.2895347240358888,
          y: 13.834494036297457
        },
        {
          x: -3.4170676830202638,
          y: 13.834494036297457
        },
        {
          x: -3.5628196361452638,
          y: 13.834494036297457
        },
        {
          x: -3.7632285716921388,
          y: 13.758139055828707
        },
        {
          x: -3.8907615306765138,
          y: 13.694509905438082
        },
        {
          x: -4.018294489660889,
          y: 13.630880755047457
        },
        {
          x: -4.145827448645264,
          y: 13.567251604656832
        },
        {
          x: -4.291579401770264,
          y: 13.503622454266207
        },
        {
          x: -4.419112360754639,
          y: 13.427267473797457
        },
        {
          x: -4.546645319739014,
          y: 13.363638323406832
        },
        {
          x: -4.674178278723389,
          y: 13.300009173016207
        },
        {
          x: -4.874587214270264,
          y: 13.236380022625582
        },
        {
          x: -5.020339167395264,
          y: 13.160025042156832
        },
        {
          x: -5.147872126379639,
          y: 13.096395891766207
        },
        {
          x: -5.202529108801514,
          y: 13.032766741375582
        },
        {
          x: -5.348281061926514,
          y: 12.905508440594332
        },
        {
          x: -5.475814020910889,
          y: 12.829153460125582
        },
        {
          x: -5.603346979895264,
          y: 12.765524309734957
        },
        {
          x: -5.749098933020264,
          y: 12.638266008953707
        },
        {
          x: -5.876631892004639,
          y: 12.574636858563082
        },
        {
          x: -5.931288874426514,
          y: 12.434652727703707
        },
        {
          x: -6.077040827551514,
          y: 12.371023577313082
        },
        {
          x: -6.131697809973389,
          y: 12.243765276531832
        },
        {
          x: -6.277449763098389,
          y: 12.167410296063082
        },
        {
          x: -6.404982722082764,
          y: 12.040151995281832
        },
        {
          x: -6.477858698645264,
          y: 11.976522844891207
        },
        {
          x: -6.532515681067139,
          y: 11.836538714031832
        },
        {
          x: -6.605391657629639,
          y: 11.772909563641207
        },
        {
          x: -6.660048640051514,
          y: 11.645651262859957
        },
        {
          x: -6.660048640051514,
          y: 11.505667132000582
        },
        {
          x: -6.732924616614014,
          y: 11.378408831219332
        },
        {
          x: -6.732924616614014,
          y: 11.251150530438082
        },
        {
          x: -6.805800593176514,
          y: 11.111166399578707
        },
        {
          x: -6.805800593176514,
          y: 10.983908098797457
        },
        {
          x: -6.805800593176514,
          y: 10.843923967938082
        },
        {
          x: -6.805800593176514,
          y: 10.716665667156832
        },
        {
          x: -6.860457575598389,
          y: 10.589407366375582
        },
        {
          x: -6.860457575598389,
          y: 10.449423235516207
        },
        {
          x: -6.860457575598389,
          y: 10.322164934734957
        },
        {
          x: -6.860457575598389,
          y: 10.182180803875582
        },
        {
          x: -6.860457575598389,
          y: 9.991293352703707
        },
        {
          x: -6.860457575598389,
          y: 9.851309221844332
        },
        {
          x: -6.860457575598389,
          y: 9.660421770672457
        },
        {
          x: -6.860457575598389,
          y: 9.520437639813082
        },
        {
          x: -6.860457575598389,
          y: 9.393179339031832
        },
        {
          x: -6.860457575598389,
          y: 9.189566057781832
        },
        {
          x: -6.860457575598389,
          y: 8.998678606609957
        },
        {
          x: -6.860457575598389,
          y: 8.858694475750582
        },
        {
          x: -6.860457575598389,
          y: 8.667807024578707
        },
        {
          x: -6.860457575598389,
          y: 8.464193743328707
        },
        {
          x: -6.860457575598389,
          y: 8.336935442547457
        },
        {
          x: -6.860457575598389,
          y: 8.133322161297457
        },
        {
          x: -6.860457575598389,
          y: 7.942434710125582
        },
        {
          x: -6.860457575598389,
          y: 7.802450579266207
        },
        {
          x: -6.860457575598389,
          y: 7.611563128094332
        },
        {
          x: -6.860457575598389,
          y: 7.471578997234957
        },
        {
          x: -6.860457575598389,
          y: 7.280691546063082
        },
        {
          x: -6.860457575598389,
          y: 7.140707415203707
        },
        {
          x: -6.860457575598389,
          y: 7.013449114422457
        },
        {
          x: -6.860457575598389,
          y: 6.873464983563082
        },
        {
          x: -6.860457575598389,
          y: 6.746206682781832
        },
        {
          x: -6.860457575598389,
          y: 6.618948382000582
        },
        {
          x: -6.860457575598389,
          y: 6.478964251141207
        },
        {
          x: -6.805800593176514,
          y: 6.351705950359957
        },
        {
          x: -6.805800593176514,
          y: 6.211721819500582
        },
        {
          x: -6.732924616614014,
          y: 6.084463518719332
        },
        {
          x: -6.732924616614014,
          y: 5.944479387859957
        },
        {
          x: -6.660048640051514,
          y: 5.880850237469332
        },
        {
          x: -6.660048640051514,
          y: 5.753591936688082
        },
        {
          x: -6.605391657629639,
          y: 5.613607805828707
        },
        {
          x: -6.605391657629639,
          y: 5.486349505047457
        },
        {
          x: -6.532515681067139,
          y: 5.359091204266207
        },
        {
          x: -6.532515681067139,
          y: 5.282736223797457
        },
        {
          x: -6.532515681067139,
          y: 5.155477923016207
        },
        {
          x: -6.477858698645264,
          y: 5.028219622234957
        },
        {
          x: -6.477858698645264,
          y: 4.951864641766207
        },
        {
          x: -6.404982722082764,
          y: 4.824606340984957
        },
        {
          x: -6.404982722082764,
          y: 4.697348040203707
        },
        {
          x: -6.332106745520264,
          y: 4.620993059734957
        },
        {
          x: -6.277449763098389,
          y: 4.493734758953707
        },
        {
          x: -6.277449763098389,
          y: 4.430105608563082
        },
        {
          x: -6.204573786535889,
          y: 4.290121477703707
        },
        {
          x: -6.204573786535889,
          y: 4.162863176922457
        },
        {
          x: -6.131697809973389,
          y: 4.035604876141207
        },
        {
          x: -6.077040827551514,
          y: 3.959249895672457
        },
        {
          x: -6.077040827551514,
          y: 3.831991594891207
        },
        {
          x: -6.004164850989014,
          y: 3.768362444500582
        },
        {
          x: -5.931288874426514,
          y: 3.704733294109957
        },
        {
          x: -5.931288874426514,
          y: 3.564749163250582
        },
        {
          x: -5.876631892004639,
          y: 3.437490862469332
        },
        {
          x: -5.803755915442139,
          y: 3.373861712078707
        },
        {
          x: -5.749098933020264,
          y: 3.233877581219332
        },
        {
          x: -5.749098933020264,
          y: 3.170248430828707
        },
        {
          x: -5.676222956457764,
          y: 3.106619280438082
        },
        {
          x: -5.603346979895264,
          y: 2.966635149578707
        },
        {
          x: -5.548689997473389,
          y: 2.903005999188082
        },
        {
          x: -5.475814020910889,
          y: 2.839376848797457
        },
        {
          x: -5.402938044348389,
          y: 2.712118548016207
        },
        {
          x: -5.348281061926514,
          y: 2.635763567547457
        },
        {
          x: -5.275405085364014,
          y: 2.572134417156832
        },
        {
          x: -5.202529108801514,
          y: 2.444876116375582
        },
        {
          x: -5.147872126379639,
          y: 2.381246965984957
        },
        {
          x: -5.074996149817139,
          y: 2.304891985516207
        },
        {
          x: -5.020339167395264,
          y: 2.241262835125582
        },
        {
          x: -4.947463190832764,
          y: 2.177633684734957
        },
        {
          x: -4.819930231848389,
          y: 2.114004534344332
        },
        {
          x: -4.747054255285889,
          y: 1.9740204034849569
        },
        {
          x: -4.674178278723389,
          y: 1.9103912530943319
        },
        {
          x: -4.546645319739014,
          y: 1.8467621027037069
        },
        {
          x: -4.491988337317139,
          y: 1.7831329523130819
        },
        {
          x: -4.346236384192139,
          y: 1.7195038019224569
        },
        {
          x: -4.291579401770264,
          y: 1.6431488214537069
        },
        {
          x: -4.145827448645264,
          y: 1.5795196710630819
        },
        {
          x: -4.091170466223389,
          y: 1.5158905206724569
        },
        {
          x: -3.9454185130983888,
          y: 1.4522613702818319
        },
        {
          x: -3.8907615306765138,
          y: 1.3886322198912069
        },
        {
          x: -3.7632285716921388,
          y: 1.3886322198912069
        },
        {
          x: -3.6903525951296388,
          y: 1.3122772394224569
        },
        {
          x: -3.5628196361452638,
          y: 1.2486480890318319
        },
        {
          x: -3.4170676830202638,
          y: 1.1850189386412069
        },
        {
          x: -3.2895347240358888,
          y: 1.1213897882505819
        },
        {
          x: -3.1620017650515138,
          y: 1.1213897882505819
        },
        {
          x: -3.0344688060671388,
          y: 1.0577606378599569
        },
        {
          x: -2.8887168529421388,
          y: 0.9814056573912069
        },
        {
          x: -2.7611838939577638,
          y: 0.9814056573912069
        },
        {
          x: -2.6336509349733888,
          y: 0.9177765070005819
        },
        {
          x: -2.4878989818483888,
          y: 0.8541473566099569
        },
        {
          x: -2.3603660228640138,
          y: 0.8541473566099569
        },
        {
          x: -2.1599570873171388,
          y: 0.8541473566099569
        },
        {
          x: -2.0324241283327638,
          y: 0.7905182062193319
        },
        {
          x: -1.9048911693483888,
          y: 0.7268890558287069
        },
        {
          x: -1.7591392162233888,
          y: 0.7268890558287069
        },
        {
          x: -1.5769492748171388,
          y: 0.7268890558287069
        },
        {
          x: -1.4311973216921388,
          y: 0.6505340753599569
        },
        {
          x: -1.3036643627077638,
          y: 0.6505340753599569
        },
        {
          x: -1.1761314037233888,
          y: 0.6505340753599569
        },
        {
          x: -1.0485984447390138,
          y: 0.5869049249693319
        },
        {
          x: -0.9028464916140138,
          y: 0.5869049249693319
        },
        {
          x: -0.7753135326296388,
          y: 0.5869049249693319
        },
        {
          x: -0.6477805736452638,
          y: 0.5869049249693319
        },
        {
          x: -0.5020286205202638,
          y: 0.5869049249693319
        },
        {
          x: -0.31983867911401376,
          y: 0.5869049249693319
        },
        {
          x: -0.17408672598901376,
          y: 0.5869049249693319
        },
        {
          x: -0.04655376700463876,
          y: 0.5232757745787069
        },
        {
          x: 0.026322209557861243,
          y: 0.5232757745787069
        },
        {
          x: 0.15385516854223624,
          y: 0.5232757745787069
        },
        {
          x: 0.28138812752661124,
          y: 0.5232757745787069
        },
        {
          x: 0.48179706307348624,
          y: 0.5232757745787069
        },
        {
          x: 0.6093300220578612,
          y: 0.5232757745787069
        },
        {
          x: 0.6822059986203612,
          y: 0.5232757745787069
        },
        {
          x: 0.8097389576047362,
          y: 0.5232757745787069
        },
        {
          x: 0.9554909107297362,
          y: 0.4596466241880819
        },
        {
          x: 1.0830238697141112,
          y: 0.4596466241880819
        },
        {
          x: 1.2105568286984862,
          y: 0.4596466241880819
        },
        {
          x: 1.3380897876828612,
          y: 0.4596466241880819
        },
        {
          x: 1.4838417408078612,
          y: 0.4596466241880819
        },
        {
          x: 1.6113746997922362,
          y: 0.4596466241880819
        },
        {
          x: 1.7389076587766112,
          y: 0.4596466241880819
        },
        {
          x: 1.8664406177609862,
          y: 0.4596466241880819
        },
        {
          x: 2.0121925708859862,
          y: 0.3960174737974569
        },
        {
          x: 2.1397255298703612,
          y: 0.3960174737974569
        },
        {
          x: 2.2672584888547362,
          y: 0.3960174737974569
        },
        {
          x: 2.4676674244016112,
          y: 0.3960174737974569
        },
        {
          x: 2.5952003833859862,
          y: 0.3960174737974569
        },
        {
          x: 2.7409523365109862,
          y: 0.3196624933287069
        },
        {
          x: 2.8684852954953612,
          y: 0.3196624933287069
        },
        {
          x: 2.9960182544797362,
          y: 0.3196624933287069
        },
        {
          x: 3.1964271900266112,
          y: 0.2560333429380819
        },
        {
          x: 3.3239601490109862,
          y: 0.2560333429380819
        },
        {
          x: 3.4697121021359862,
          y: 0.1924041925474569
        },
        {
          x: 3.5972450611203612,
          y: 0.1924041925474569
        },
        {
          x: 3.7247780201047362,
          y: 0.1287750421568319
        },
        {
          x: 3.8523109790891112,
          y: 0.1287750421568319
        },
        {
          x: 3.9980629322141112,
          y: 0.06514589176620689
        },
        {
          x: 4.125595891198486,
          y: -0.011209088702543113
        },
        {
          x: 4.253128850182861,
          y: -0.07483823909316811
        },
        {
          x: 4.398880803307861,
          y: -0.07483823909316811
        },
        {
          x: 4.526413762292236,
          y: -0.1384673894837931
        },
        {
          x: 4.653946721276611,
          y: -0.2020965398744181
        },
        {
          x: 4.726822697839111,
          y: -0.2657256902650431
        },
        {
          x: 4.854355656823486,
          y: -0.3420806707337931
        },
        {
          x: 4.981888615807861,
          y: -0.4057098211244181
        },
        {
          x: 5.054764592370361,
          y: -0.4693389715150431
        },
        {
          x: 5.255173527917236,
          y: -0.5329681219056681
        },
        {
          x: 5.309830510339111,
          y: -0.5965972722962931
        },
        {
          x: 5.455582463464111,
          y: -0.7365814031556681
        },
        {
          x: 5.510239445885986,
          y: -0.8002105535462931
        },
        {
          x: 5.583115422448486,
          y: -0.8638397039369181
        },
        {
          x: 5.710648381432861,
          y: -1.0038238347962931
        },
        {
          x: 5.783524357995361,
          y: -1.0674529851869181
        },
        {
          x: 5.911057316979736,
          y: -1.1947112859681681
        },
        {
          x: 5.983933293542236,
          y: -1.2710662664369181
        },
        {
          x: 6.038590275964111,
          y: -1.3983245672181681
        },
        {
          x: 6.111466252526611,
          y: -1.4619537176087931
        },
        {
          x: 6.184342229089111,
          y: -1.6019378484681681
        },
        {
          x: 6.311875188073486,
          y: -1.7291961492494181
        },
        {
          x: 6.384751164635986,
          y: -1.8564544500306681
        },
        {
          x: 6.439408147057861,
          y: -1.9328094304994181
        },
        {
          x: 6.512284123620361,
          y: -2.060067731280668
        },
        {
          x: 6.566941106042236,
          y: -2.187326032061918
        },
        {
          x: 6.639817082604736,
          y: -2.327310162921293
        },
        {
          x: 6.767350041589111,
          y: -2.454568463702543
        },
        {
          x: 6.840226018151611,
          y: -2.594552594561918
        },
        {
          x: 6.913101994714111,
          y: -2.721810895343168
        },
        {
          x: 6.967758977135986,
          y: -2.849069196124418
        },
        {
          x: 7.040634953698486,
          y: -2.989053326983793
        },
        {
          x: 7.113510930260986,
          y: -3.116311627765043
        },
        {
          x: 7.168167912682861,
          y: -3.256295758624418
        },
        {
          x: 7.241043889245361,
          y: -3.383554059405668
        },
        {
          x: 7.241043889245361,
          y: -3.510812360186918
        },
        {
          x: 7.295700871667236,
          y: -3.650796491046293
        },
        {
          x: 7.295700871667236,
          y: -3.778054791827543
        },
        {
          x: 7.368576848229736,
          y: -3.918038922686918
        },
        {
          x: 7.368576848229736,
          y: -4.045297223468168
        },
        {
          x: 7.441452824792236,
          y: -4.172555524249418
        },
        {
          x: 7.441452824792236,
          y: -4.312539655108793
        },
        {
          x: 7.441452824792236,
          y: -4.439797955890043
        },
        {
          x: 7.496109807214111,
          y: -4.579782086749418
        },
        {
          x: 7.496109807214111,
          y: -4.643411237140043
        },
        {
          x: 7.496109807214111,
          y: -4.834298688311918
        },
        {
          x: 7.496109807214111,
          y: -4.910653668780668
        },
        {
          x: 7.568985783776611,
          y: -5.037911969561918
        },
        {
          x: 7.568985783776611,
          y: -5.165170270343168
        },
        {
          x: 7.568985783776611,
          y: -5.241525250811918
        },
        {
          x: 7.568985783776611,
          y: -5.368783551593168
        },
        {
          x: 7.568985783776611,
          y: -5.496041852374418
        },
        {
          x: 7.568985783776611,
          y: -5.572396832843168
        },
        {
          x: 7.568985783776611,
          y: -5.699655133624418
        },
        {
          x: 7.568985783776611,
          y: -5.763284284015043
        },
        {
          x: 7.568985783776611,
          y: -5.903268414874418
        },
        {
          x: 7.568985783776611,
          y: -5.966897565265043
        },
        {
          x: 7.568985783776611,
          y: -6.094155866046293
        },
        {
          x: 7.568985783776611,
          y: -6.157785016436918
        },
        {
          x: 7.568985783776611,
          y: -6.234139996905668
        },
        {
          x: 7.568985783776611,
          y: -6.361398297686918
        },
        {
          x: 7.568985783776611,
          y: -6.425027448077543
        },
        {
          x: 7.568985783776611,
          y: -6.565011578936918
        },
        {
          x: 7.568985783776611,
          y: -6.628640729327543
        },
        {
          x: 7.568985783776611,
          y: -6.692269879718168
        },
        {
          x: 7.568985783776611,
          y: -6.755899030108793
        },
        {
          x: 7.568985783776611,
          y: -6.895883160968168
        },
        {
          x: 7.568985783776611,
          y: -6.959512311358793
        },
        {
          x: 7.568985783776611,
          y: -7.086770612140043
        },
        {
          x: 7.568985783776611,
          y: -7.150399762530668
        },
        {
          x: 7.568985783776611,
          y: -7.226754742999418
        },
        {
          x: 7.568985783776611,
          y: -7.354013043780668
        },
        {
          x: 7.568985783776611,
          y: -7.417642194171293
        },
        {
          x: 7.568985783776611,
          y: -7.481271344561918
        },
        {
          x: 7.568985783776611,
          y: -7.621255475421293
        },
        {
          x: 7.496109807214111,
          y: -7.748513776202543
        },
        {
          x: 7.441452824792236,
          y: -7.824868756671293
        },
        {
          x: 7.368576848229736,
          y: -7.952127057452543
        },
        {
          x: 7.368576848229736,
          y: -8.015756207843168
        },
        {
          x: 7.295700871667236,
          y: -8.155740338702543
        },
        {
          x: 7.241043889245361,
          y: -8.219369489093168
        },
        {
          x: 7.168167912682861,
          y: -8.346627789874418
        },
        {
          x: 7.113510930260986,
          y: -8.486611920733793
        },
        {
          x: 6.967758977135986,
          y: -8.550241071124418
        },
        {
          x: 6.913101994714111,
          y: -8.677499371905668
        },
        {
          x: 6.840226018151611,
          y: -8.817483502765043
        },
        {
          x: 6.712693059167236,
          y: -8.944741803546293
        },
        {
          x: 6.639817082604736,
          y: -9.072000104327543
        },
        {
          x: 6.512284123620361,
          y: -9.148355084796293
        },
        {
          x: 6.384751164635986,
          y: -9.275613385577543
        },
        {
          x: 6.311875188073486,
          y: -9.402871686358793
        },
        {
          x: 6.184342229089111,
          y: -9.542855817218168
        },
        {
          x: 6.038590275964111,
          y: -9.670114117999418
        },
        {
          x: 5.983933293542236,
          y: -9.810098248858793
        },
        {
          x: 5.838181340417236,
          y: -9.873727399249418
        },
        {
          x: 5.710648381432861,
          y: -10.000985700030668
        },
        {
          x: 5.655991399010986,
          y: -10.064614850421293
        },
        {
          x: 5.510239445885986,
          y: -10.204598981280668
        },
        {
          x: 5.382706486901611,
          y: -10.331857282061918
        },
        {
          x: 5.255173527917236,
          y: -10.395486432452543
        },
        {
          x: 5.182297551354736,
          y: -10.471841412921293
        },
        {
          x: 5.054764592370361,
          y: -10.535470563311918
        },
        {
          x: 4.927231633385986,
          y: -10.662728864093168
        },
        {
          x: 4.781479680260986,
          y: -10.726358014483793
        },
        {
          x: 4.653946721276611,
          y: -10.802712994952543
        },
        {
          x: 4.526413762292236,
          y: -10.866342145343168
        },
        {
          x: 4.326004826745361,
          y: -10.929971295733793
        },
        {
          x: 4.198471867760986,
          y: -10.993600446124418
        },
        {
          x: 4.052719914635986,
          y: -11.057229596515043
        },
        {
          x: 3.8523109790891112,
          y: -11.057229596515043
        },
        {
          x: 3.6701210376828612,
          y: -11.133584576983793
        },
        {
          x: 3.4697121021359862,
          y: -11.133584576983793
        },
        {
          x: 3.3239601490109862,
          y: -11.197213727374418
        },
        {
          x: 3.1235512134641112,
          y: -11.197213727374418
        },
        {
          x: 2.9413612720578612,
          y: -11.197213727374418
        },
        {
          x: 2.6680763599484862,
          y: -11.197213727374418
        },
        {
          x: 2.4676674244016112,
          y: -11.197213727374418
        },
        {
          x: 2.2126015064328612,
          y: -11.197213727374418
        },
        {
          x: 2.0121925708859862,
          y: -11.197213727374418
        },
        {
          x: 1.7389076587766112,
          y: -11.197213727374418
        },
        {
          x: 1.5384987232297362,
          y: -11.197213727374418
        },
        {
          x: 1.2834328052609862,
          y: -11.197213727374418
        },
        {
          x: 1.0101478931516112,
          y: -11.197213727374418
        },
        {
          x: 0.8097389576047362,
          y: -11.197213727374418
        },
        {
          x: 0.6093300220578612,
          y: -11.197213727374418
        },
        {
          x: 0.40892108651098624,
          y: -11.133584576983793
        },
        {
          x: 0.22673114510473624,
          y: -11.057229596515043
        }
      ]
    ]
  },
  {
    name: "9",
    strokes: [
      [
        {
          x: 0.19873005212775752,
          y: -5.290210085924173
        },
        {
          x: 0.2716060286902575,
          y: -5.290210085924173
        },
        {
          x: 0.3991389876746325,
          y: -5.430194216783548
        },
        {
          x: 0.4720149642371325,
          y: -5.493823367174173
        },
        {
          x: 0.5995479232215075,
          y: -5.621081667955423
        },
        {
          x: 0.6724238997840075,
          y: -5.684710818346048
        },
        {
          x: 0.7270808822058825,
          y: -5.761065798814798
        },
        {
          x: 0.7999568587683825,
          y: -5.824694949205423
        },
        {
          x: 0.8728328353308825,
          y: -5.951953249986673
        },
        {
          x: 0.9274898177527575,
          y: -6.015582400377298
        },
        {
          x: 0.9274898177527575,
          y: -6.091937380846048
        },
        {
          x: 0.9274898177527575,
          y: -6.155566531236673
        },
        {
          x: 0.9274898177527575,
          y: -6.155566531236673
        },
        {
          x: 0.9274898177527575,
          y: -6.219195681627298
        },
        {
          x: 0.9274898177527575,
          y: -6.219195681627298
        },
        {
          x: 0.9274898177527575,
          y: -6.282824832017923
        },
        {
          x: 0.9274898177527575,
          y: -6.282824832017923
        },
        {
          x: 0.9274898177527575,
          y: -6.282824832017923
        },
        {
          x: 0.9274898177527575,
          y: -6.282824832017923
        },
        {
          x: 0.9274898177527575,
          y: -6.282824832017923
        },
        {
          x: 0.9274898177527575,
          y: -6.346453982408548
        },
        {
          x: 0.8728328353308825,
          y: -6.346453982408548
        },
        {
          x: 0.7999568587683825,
          y: -6.346453982408548
        },
        {
          x: 0.6724238997840075,
          y: -6.346453982408548
        },
        {
          x: 0.5995479232215075,
          y: -6.346453982408548
        },
        {
          x: 0.4720149642371325,
          y: -6.346453982408548
        },
        {
          x: 0.3444820052527575,
          y: -6.346453982408548
        },
        {
          x: 0.19873005212775752,
          y: -6.346453982408548
        },
        {
          x: 0.07119709314338252,
          y: -6.346453982408548
        },
        {
          x: -0.05633586584099248,
          y: -6.346453982408548
        },
        {
          x: -0.18386882482536748,
          y: -6.346453982408548
        },
        {
          x: -0.3842777603722425,
          y: -6.346453982408548
        },
        {
          x: -0.5300297134972425,
          y: -6.346453982408548
        },
        {
          x: -0.6575626724816175,
          y: -6.346453982408548
        },
        {
          x: -0.8579716080284925,
          y: -6.346453982408548
        },
        {
          x: -1.0583805435753675,
          y: -6.346453982408548
        },
        {
          x: -1.1859135025597425,
          y: -6.282824832017923
        },
        {
          x: -1.3863224381066175,
          y: -6.219195681627298
        },
        {
          x: -1.5867313736534925,
          y: -6.091937380846048
        },
        {
          x: -1.7871403092003675,
          y: -6.015582400377298
        },
        {
          x: -1.9875492447472425,
          y: -5.951953249986673
        },
        {
          x: -2.1150822037316175,
          y: -5.824694949205423
        },
        {
          x: -2.3154911392784925,
          y: -5.761065798814798
        },
        {
          x: -2.5159000748253675,
          y: -5.621081667955423
        },
        {
          x: -2.6434330338097425,
          y: -5.557452517564798
        },
        {
          x: -2.8438419693566175,
          y: -5.430194216783548
        },
        {
          x: -2.9713749283409925,
          y: -5.290210085924173
        },
        {
          x: -3.1717838638878675,
          y: -5.162951785142923
        },
        {
          x: -3.2993168228722425,
          y: -5.099322634752298
        },
        {
          x: -3.4997257584191175,
          y: -4.895709353502298
        },
        {
          x: -3.6272587174034925,
          y: -4.768451052721048
        },
        {
          x: -3.7730106705284925,
          y: -4.628466921861673
        },
        {
          x: -3.9005436295128675,
          y: -4.501208621080423
        },
        {
          x: -4.0280765884972425,
          y: -4.361224490221048
        },
        {
          x: -4.1556095474816175,
          y: -4.233966189439798
        },
        {
          x: -4.3013615006066175,
          y: -4.093982058580423
        },
        {
          x: -4.4288944595909925,
          y: -3.9667237577991727
        },
        {
          x: -4.5564274185753675,
          y: -3.7631104765491727
        },
        {
          x: -4.7021793717003675,
          y: -3.6358521757679227
        },
        {
          x: -4.7568363541222425,
          y: -3.5085938749866727
        },
        {
          x: -4.8843693131066175,
          y: -3.3049805937366727
        },
        {
          x: -4.9572452896691175,
          y: -3.1013673124866727
        },
        {
          x: -5.0847782486534925,
          y: -2.9741090117054227
        },
        {
          x: -5.1576542252159925,
          y: -2.8468507109241727
        },
        {
          x: -5.2305302017784925,
          y: -2.6432374296741727
        },
        {
          x: -5.2305302017784925,
          y: -2.5159791288929227
        },
        {
          x: -5.2851871842003675,
          y: -2.3123658476429227
        },
        {
          x: -5.3580631607628675,
          y: -2.1087525663929227
        },
        {
          x: -5.3580631607628675,
          y: -1.9814942656116727
        },
        {
          x: -5.4309391373253675,
          y: -1.7778809843616727
        },
        {
          x: -5.4309391373253675,
          y: -1.6506226835804227
        },
        {
          x: -5.4309391373253675,
          y: -1.4470094023304227
        },
        {
          x: -5.4309391373253675,
          y: -1.3197511015491727
        },
        {
          x: -5.4309391373253675,
          y: -1.1161378202991727
        },
        {
          x: -5.4309391373253675,
          y: -0.9888795195179227
        },
        {
          x: -5.4309391373253675,
          y: -0.8616212187366727
        },
        {
          x: -5.4309391373253675,
          y: -0.7216370878772977
        },
        {
          x: -5.4309391373253675,
          y: -0.5943787870960477
        },
        {
          x: -5.4309391373253675,
          y: -0.45439465623667274
        },
        {
          x: -5.4309391373253675,
          y: -0.26350720506479774
        },
        {
          x: -5.4309391373253675,
          y: -0.12352307420542274
        },
        {
          x: -5.3580631607628675,
          y: -0.059893923814797745
        },
        {
          x: -5.2305302017784925,
          y: 0.06736437696645226
        },
        {
          x: -5.0847782486534925,
          y: 0.20734850782582726
        },
        {
          x: -4.9572452896691175,
          y: 0.27097765821645226
        },
        {
          x: -4.7568363541222425,
          y: 0.39823595899770226
        },
        {
          x: -4.5564274185753675,
          y: 0.46186510938832726
        },
        {
          x: -4.4288944595909925,
          y: 0.5382200898570773
        },
        {
          x: -4.1556095474816175,
          y: 0.6018492402477023
        },
        {
          x: -3.9734196060753675,
          y: 0.6654783906383273
        },
        {
          x: -3.7730106705284925,
          y: 0.7291075410289523
        },
        {
          x: -3.4997257584191175,
          y: 0.8690916718883273
        },
        {
          x: -3.2993168228722425,
          y: 0.8690916718883273
        },
        {
          x: -3.0442509049034925,
          y: 0.9327208222789523
        },
        {
          x: -2.8438419693566175,
          y: 0.9327208222789523
        },
        {
          x: -2.5705570572472425,
          y: 0.9963499726695773
        },
        {
          x: -2.3701481217003675,
          y: 0.9963499726695773
        },
        {
          x: -2.1150822037316175,
          y: 0.9963499726695773
        },
        {
          x: -1.9146732681847425,
          y: 0.9963499726695773
        },
        {
          x: -1.7142643326378675,
          y: 0.9963499726695773
        },
        {
          x: -1.5138553970909925,
          y: 0.9963499726695773
        },
        {
          x: -1.2587894791222425,
          y: 0.9963499726695773
        },
        {
          x: -1.0583805435753675,
          y: 0.9963499726695773
        },
        {
          x: -0.8579716080284925,
          y: 0.9963499726695773
        },
        {
          x: -0.6575626724816175,
          y: 0.9963499726695773
        },
        {
          x: -0.4571537369347425,
          y: 0.9963499726695773
        },
        {
          x: -0.18386882482536748,
          y: 0.9963499726695773
        },
        {
          x: -0.0016788834191174828,
          y: 0.9963499726695773
        },
        {
          x: 0.19873005212775752,
          y: 0.9327208222789523
        },
        {
          x: 0.3991389876746325,
          y: 0.8690916718883273
        },
        {
          x: 0.5995479232215075,
          y: 0.7291075410289523
        },
        {
          x: 0.7999568587683825,
          y: 0.6018492402477023
        },
        {
          x: 0.9274898177527575,
          y: 0.46186510938832726
        },
        {
          x: 1.1278987532996325,
          y: 0.27097765821645226
        },
        {
          x: 1.2736507064246325,
          y: 0.13099352735707726
        },
        {
          x: 1.4558406478308825,
          y: 0.003735226575827255
        },
        {
          x: 1.6015926009558825,
          y: -0.19987805467417274
        },
        {
          x: 1.8020015365027575,
          y: -0.32713635545542274
        },
        {
          x: 1.9295344954871325,
          y: -0.45439465623667274
        },
        {
          x: 2.0570674544715075,
          y: -0.6580079374866727
        },
        {
          x: 2.1846004134558825,
          y: -0.8616212187366727
        },
        {
          x: 2.3303523665808825,
          y: -0.9888795195179227
        },
        {
          x: 2.3850093490027575,
          y: -1.1161378202991727
        },
        {
          x: 2.5307613021277575,
          y: -1.3197511015491727
        },
        {
          x: 2.5854182845496325,
          y: -1.4470094023304227
        },
        {
          x: 2.6582942611121325,
          y: -1.6506226835804227
        },
        {
          x: 2.7858272200965075,
          y: -1.8542359648304227
        },
        {
          x: 2.8587031966590075,
          y: -1.9814942656116727
        },
        {
          x: 2.9133601790808825,
          y: -2.1851075468616727
        },
        {
          x: 2.9862361556433825,
          y: -2.3123658476429227
        },
        {
          x: 3.0591121322058825,
          y: -2.4396241484241727
        },
        {
          x: 3.0591121322058825,
          y: -2.5796082792835477
        },
        {
          x: 3.1137691146277575,
          y: -2.7704957304554227
        },
        {
          x: 3.1137691146277575,
          y: -2.9104798613147977
        },
        {
          x: 3.1137691146277575,
          y: -3.0377381620960477
        },
        {
          x: 3.1137691146277575,
          y: -3.1777222929554227
        },
        {
          x: 3.1137691146277575,
          y: -3.3049805937366727
        },
        {
          x: 3.1137691146277575,
          y: -3.4322388945179227
        },
        {
          x: 3.1137691146277575,
          y: -3.5722230253772977
        },
        {
          x: 3.1137691146277575,
          y: -3.6994813261585477
        },
        {
          x: 3.1137691146277575,
          y: -3.8394654570179227
        },
        {
          x: 3.1137691146277575,
          y: -3.9667237577991727
        },
        {
          x: 3.1137691146277575,
          y: -4.093982058580423
        },
        {
          x: 3.1137691146277575,
          y: -4.233966189439798
        },
        {
          x: 3.1137691146277575,
          y: -4.361224490221048
        },
        {
          x: 3.1137691146277575,
          y: -4.501208621080423
        },
        {
          x: 3.1137691146277575,
          y: -4.628466921861673
        },
        {
          x: 3.1137691146277575,
          y: -4.768451052721048
        },
        {
          x: 3.1137691146277575,
          y: -4.832080203111673
        },
        {
          x: 3.0591121322058825,
          y: -4.959338503892923
        },
        {
          x: 3.0591121322058825,
          y: -5.099322634752298
        },
        {
          x: 3.0591121322058825,
          y: -5.162951785142923
        },
        {
          x: 2.9862361556433825,
          y: -5.290210085924173
        },
        {
          x: 2.9862361556433825,
          y: -5.353839236314798
        },
        {
          x: 2.9133601790808825,
          y: -5.430194216783548
        },
        {
          x: 2.9133601790808825,
          y: -5.557452517564798
        },
        {
          x: 2.9133601790808825,
          y: -5.621081667955423
        },
        {
          x: 2.8587031966590075,
          y: -5.684710818346048
        },
        {
          x: 2.8587031966590075,
          y: -5.761065798814798
        },
        {
          x: 2.7858272200965075,
          y: -5.824694949205423
        },
        {
          x: 2.7858272200965075,
          y: -5.888324099596048
        },
        {
          x: 2.7858272200965075,
          y: -5.888324099596048
        },
        {
          x: 2.7311702376746325,
          y: -5.951953249986673
        },
        {
          x: 2.7311702376746325,
          y: -5.951953249986673
        },
        {
          x: 2.7311702376746325,
          y: -6.015582400377298
        },
        {
          x: 2.6582942611121325,
          y: -6.015582400377298
        },
        {
          x: 2.6582942611121325,
          y: -6.015582400377298
        },
        {
          x: 2.5854182845496325,
          y: -6.015582400377298
        },
        {
          x: 2.5854182845496325,
          y: -6.015582400377298
        },
        {
          x: 2.5307613021277575,
          y: -6.015582400377298
        },
        {
          x: 2.5307613021277575,
          y: -6.015582400377298
        },
        {
          x: 2.5307613021277575,
          y: -6.015582400377298
        },
        {
          x: 2.4578853255652575,
          y: -6.015582400377298
        },
        {
          x: 2.4578853255652575,
          y: -6.015582400377298
        },
        {
          x: 2.3850093490027575,
          y: -6.015582400377298
        },
        {
          x: 2.3850093490027575,
          y: -6.015582400377298
        },
        {
          x: 2.3303523665808825,
          y: -6.015582400377298
        },
        {
          x: 2.3303523665808825,
          y: -5.951953249986673
        },
        {
          x: 2.3303523665808825,
          y: -5.888324099596048
        },
        {
          x: 2.2574763900183825,
          y: -5.824694949205423
        },
        {
          x: 2.2574763900183825,
          y: -5.761065798814798
        },
        {
          x: 2.2574763900183825,
          y: -5.684710818346048
        },
        {
          x: 2.1846004134558825,
          y: -5.621081667955423
        },
        {
          x: 2.1846004134558825,
          y: -5.493823367174173
        },
        {
          x: 2.1846004134558825,
          y: -5.430194216783548
        },
        {
          x: 2.1846004134558825,
          y: -5.353839236314798
        },
        {
          x: 2.1299434310340075,
          y: -5.226580935533548
        },
        {
          x: 2.1299434310340075,
          y: -5.162951785142923
        },
        {
          x: 2.1299434310340075,
          y: -5.022967654283548
        },
        {
          x: 2.1299434310340075,
          y: -4.959338503892923
        },
        {
          x: 2.1299434310340075,
          y: -4.832080203111673
        },
        {
          x: 2.0570674544715075,
          y: -4.692096072252298
        },
        {
          x: 2.0570674544715075,
          y: -4.564837771471048
        },
        {
          x: 2.0570674544715075,
          y: -4.424853640611673
        },
        {
          x: 2.0570674544715075,
          y: -4.297595339830423
        },
        {
          x: 2.0570674544715075,
          y: -4.170337039049173
        },
        {
          x: 2.0570674544715075,
          y: -3.9667237577991727
        },
        {
          x: 2.0570674544715075,
          y: -3.8394654570179227
        },
        {
          x: 2.0570674544715075,
          y: -3.6358521757679227
        },
        {
          x: 2.0570674544715075,
          y: -3.4322388945179227
        },
        {
          x: 2.0570674544715075,
          y: -3.2413514433460477
        },
        {
          x: 2.0570674544715075,
          y: -2.9741090117054227
        },
        {
          x: 2.0570674544715075,
          y: -2.7704957304554227
        },
        {
          x: 2.0570674544715075,
          y: -2.5159791288929227
        },
        {
          x: 2.0570674544715075,
          y: -2.2487366972522977
        },
        {
          x: 2.0570674544715075,
          y: -1.9178651152210477
        },
        {
          x: 2.0570674544715075,
          y: -1.6506226835804227
        },
        {
          x: 2.0570674544715075,
          y: -1.3197511015491727
        },
        {
          x: 2.0570674544715075,
          y: -0.9888795195179227
        },
        {
          x: 2.0570674544715075,
          y: -0.5943787870960477
        },
        {
          x: 2.0570674544715075,
          y: -0.19987805467417274
        },
        {
          x: 2.0570674544715075,
          y: 0.13099352735707726
        },
        {
          x: 2.0570674544715075,
          y: 0.5382200898570773
        },
        {
          x: 2.0570674544715075,
          y: 0.9327208222789523
        },
        {
          x: 2.0570674544715075,
          y: 1.3272215547008273
        },
        {
          x: 2.0570674544715075,
          y: 1.7217222871227023
        },
        {
          x: 2.0570674544715075,
          y: 2.1162230195445773
        },
        {
          x: 2.0570674544715075,
          y: 2.5234495820445773
        },
        {
          x: 2.0570674544715075,
          y: 2.9179503144664523
        },
        {
          x: 2.0570674544715075,
          y: 3.2488218964977023
        },
        {
          x: 2.0570674544715075,
          y: 3.5796934785289523
        },
        {
          x: 2.0570674544715075,
          y: 3.9741942109508273
        },
        {
          x: 2.0570674544715075,
          y: 4.305065792982077
        },
        {
          x: 2.0570674544715075,
          y: 4.635937375013327
        },
        {
          x: 2.0570674544715075,
          y: 4.903179806653952
        },
        {
          x: 2.0570674544715075,
          y: 5.170422238294577
        },
        {
          x: 2.0570674544715075,
          y: 5.437664669935202
        },
        {
          x: 2.0570674544715075,
          y: 5.768536251966452
        },
        {
          x: 2.0570674544715075,
          y: 6.023052853528952
        },
        {
          x: 2.0570674544715075,
          y: 6.290295285169577
        },
        {
          x: 2.0570674544715075,
          y: 6.493908566419577
        },
        {
          x: 2.0570674544715075,
          y: 6.684796017591452
        },
        {
          x: 2.0570674544715075,
          y: 6.888409298841452
        },
        {
          x: 2.0570674544715075,
          y: 7.155651730482077
        },
        {
          x: 2.0570674544715075,
          y: 7.346539181653952
        },
        {
          x: 2.0570674544715075,
          y: 7.550152462903952
        },
        {
          x: 2.0570674544715075,
          y: 7.677410763685202
        },
        {
          x: 2.0570674544715075,
          y: 7.881024044935202
        },
        {
          x: 2.0570674544715075,
          y: 8.008282345716452
        },
        {
          x: 2.0570674544715075,
          y: 8.211895626966452
        },
        {
          x: 2.0024104720496325,
          y: 8.339153927747702
        },
        {
          x: 2.0024104720496325,
          y: 8.479138058607077
        },
        {
          x: 1.9295344954871325,
          y: 8.606396359388327
        },
        {
          x: 1.8566585189246325,
          y: 8.746380490247702
        },
        {
          x: 1.8020015365027575,
          y: 8.873638791028952
        },
        {
          x: 1.6562495833777575,
          y: 9.000897091810202
        },
        {
          x: 1.6015926009558825,
          y: 9.140881222669577
        },
        {
          x: 1.5287166243933825,
          y: 9.204510373060202
        },
        {
          x: 1.4558406478308825,
          y: 9.331768673841452
        },
        {
          x: 1.4011836654090075,
          y: 9.408123654310202
        },
        {
          x: 1.3283076888465075,
          y: 9.535381955091452
        },
        {
          x: 1.2007747298621325,
          y: 9.675366085950827
        },
        {
          x: 1.1278987532996325,
          y: 9.738995236341452
        },
        {
          x: 1.0732417708777575,
          y: 9.802624386732077
        },
        {
          x: 1.0003657943152575,
          y: 9.929882687513327
        },
        {
          x: 0.8728328353308825,
          y: 10.006237667982077
        },
        {
          x: 0.7999568587683825,
          y: 10.069866818372702
        },
        {
          x: 0.6724238997840075,
          y: 10.197125119153952
        },
        {
          x: 0.5995479232215075,
          y: 10.337109250013327
        },
        {
          x: 0.4720149642371325,
          y: 10.400738400403952
        },
        {
          x: 0.3991389876746325,
          y: 10.527996701185202
        },
        {
          x: 0.2716060286902575,
          y: 10.667980832044577
        },
        {
          x: 0.14407306970588252,
          y: 10.795239132825827
        },
        {
          x: -0.0016788834191174828,
          y: 10.922497433607077
        },
        {
          x: -0.12921184240349248,
          y: 11.062481564466452
        },
        {
          x: -0.2567448013878675,
          y: 11.189739865247702
        },
        {
          x: -0.3842777603722425,
          y: 11.329723996107077
        },
        {
          x: -0.5300297134972425,
          y: 11.456982296888327
        },
        {
          x: -0.7122196549034925,
          y: 11.660595578138327
        },
        {
          x: -0.8579716080284925,
          y: 11.787853878919577
        },
        {
          x: -1.0583805435753675,
          y: 11.915112179700827
        },
        {
          x: -1.1859135025597425,
          y: 12.055096310560202
        },
        {
          x: -1.3134464615441175,
          y: 12.182354611341452
        },
        {
          x: -1.5138553970909925,
          y: 12.322338742200827
        },
        {
          x: -1.7142643326378675,
          y: 12.449597042982077
        },
        {
          x: -1.9146732681847425,
          y: 12.576855343763327
        },
        {
          x: -2.0422062271691175,
          y: 12.653210324232077
        },
        {
          x: -2.2426151627159925,
          y: 12.716839474622702
        },
        {
          x: -2.5159000748253675,
          y: 12.780468625013327
        },
        {
          x: -2.7163090103722425,
          y: 12.844097775403952
        },
        {
          x: -2.9713749283409925,
          y: 12.907726925794577
        },
        {
          x: -3.2993168228722425,
          y: 12.984081906263327
        },
        {
          x: -3.5726017349816175,
          y: 12.984081906263327
        },
        {
          x: -3.9005436295128675,
          y: 13.047711056653952
        },
        {
          x: -4.3013615006066175,
          y: 13.047711056653952
        },
        {
          x: -4.7021793717003675,
          y: 13.047711056653952
        },
        {
          x: -5.0847782486534925,
          y: 13.047711056653952
        },
        {
          x: -5.5584720963097425,
          y: 13.111340207044577
        },
        {
          x: -6.0139469498253675,
          y: 13.111340207044577
        },
        {
          x: -6.4147648209191175,
          y: 13.111340207044577
        },
        {
          x: -6.7427067154503675,
          y: 13.174969357435202
        },
        {
          x: -7.0706486099816175,
          y: 13.238598507825827
        },
        {
          x: -7.3439335220909925,
          y: 13.314953488294577
        }
      ]
    ]
  },
  {
    name: "0",
    strokes: [
      [
        {
          x: 0.2975196118625263,
          y: -11.552172390919822
        },
        {
          x: 0.2975196118625263,
          y: -11.552172390919822
        },
        {
          x: 0.2428626294406513,
          y: -11.552172390919822
        },
        {
          x: 0.2428626294406513,
          y: -11.552172390919822
        },
        {
          x: 0.11532967045627629,
          y: -11.552172390919822
        },
        {
          x: 0.04245369389377629,
          y: -11.552172390919822
        },
        {
          x: -0.03042228266872371,
          y: -11.552172390919822
        },
        {
          x: -0.08507926509059871,
          y: -11.552172390919822
        },
        {
          x: -0.2308312182155987,
          y: -11.552172390919822
        },
        {
          x: -0.2854882006374737,
          y: -11.615801541310447
        },
        {
          x: -0.3583641771999737,
          y: -11.615801541310447
        },
        {
          x: -0.4130211596218487,
          y: -11.692156521779197
        },
        {
          x: -0.4858971361843487,
          y: -11.692156521779197
        },
        {
          x: -0.5587731127468487,
          y: -11.692156521779197
        },
        {
          x: -0.6134300951687237,
          y: -11.755785672169822
        },
        {
          x: -0.6134300951687237,
          y: -11.755785672169822
        },
        {
          x: -0.6863060717312237,
          y: -11.755785672169822
        },
        {
          x: -0.7591820482937237,
          y: -11.819414822560447
        },
        {
          x: -0.7591820482937237,
          y: -11.819414822560447
        },
        {
          x: -0.8138390307155987,
          y: -11.819414822560447
        },
        {
          x: -0.8867150072780987,
          y: -11.883043972951072
        },
        {
          x: -0.9595909838405987,
          y: -11.883043972951072
        },
        {
          x: -0.9595909838405987,
          y: -11.883043972951072
        },
        {
          x: -1.0142479662624737,
          y: -11.883043972951072
        },
        {
          x: -1.0871239428249737,
          y: -11.883043972951072
        },
        {
          x: -1.0871239428249737,
          y: -11.946673123341697
        },
        {
          x: -1.1417809252468487,
          y: -11.946673123341697
        },
        {
          x: -1.2146569018093487,
          y: -11.946673123341697
        },
        {
          x: -1.2875328783718487,
          y: -11.946673123341697
        },
        {
          x: -1.3421898607937237,
          y: -11.946673123341697
        },
        {
          x: -1.4150658373562237,
          y: -11.946673123341697
        },
        {
          x: -1.5425987963405987,
          y: -11.946673123341697
        },
        {
          x: -1.6154747729030987,
          y: -11.946673123341697
        },
        {
          x: -1.6883507494655987,
          y: -11.946673123341697
        },
        {
          x: -1.8158837084499737,
          y: -11.946673123341697
        },
        {
          x: -1.8705406908718487,
          y: -11.946673123341697
        },
        {
          x: -1.9434166674343487,
          y: -11.946673123341697
        },
        {
          x: -2.0709496264187237,
          y: -11.883043972951072
        },
        {
          x: -2.2167015795437237,
          y: -11.819414822560447
        },
        {
          x: -2.2713585619655987,
          y: -11.692156521779197
        },
        {
          x: -2.4171105150905987,
          y: -11.552172390919822
        },
        {
          x: -2.4717674975124737,
          y: -11.488543240529197
        },
        {
          x: -2.5993004564968487,
          y: -11.361284939747947
        },
        {
          x: -2.7450524096218487,
          y: -11.221300808888572
        },
        {
          x: -2.8725853686062237,
          y: -11.030413357716697
        },
        {
          x: -2.9454613451687237,
          y: -10.890429226857322
        },
        {
          x: -3.0729943041530987,
          y: -10.763170926076072
        },
        {
          x: -3.2005272631374737,
          y: -10.623186795216697
        },
        {
          x: -3.3280602221218487,
          y: -10.432299344044822
        },
        {
          x: -3.4009361986843487,
          y: -10.292315213185447
        },
        {
          x: -3.5284691576687237,
          y: -10.101427762013572
        },
        {
          x: -3.6742211107937237,
          y: -9.897814480763572
        },
        {
          x: -3.8017540697780987,
          y: -9.770556179982322
        },
        {
          x: -3.8564110521999737,
          y: -9.566942898732322
        },
        {
          x: -4.002163005324974,
          y: -9.363329617482322
        },
        {
          x: -4.056819987746849,
          y: -9.172442166310447
        },
        {
          x: -4.202571940871849,
          y: -8.968828885060447
        },
        {
          x: -4.330104899856224,
          y: -8.777941433888572
        },
        {
          x: -4.402980876418724,
          y: -8.574328152638572
        },
        {
          x: -4.457637858840599,
          y: -8.447069851857322
        },
        {
          x: -4.585170817824974,
          y: -8.243456570607322
        },
        {
          x: -4.658046794387474,
          y: -8.039843289357322
        },
        {
          x: -4.730922770949974,
          y: -7.7853266877948215
        },
        {
          x: -4.785579753371849,
          y: -7.5817134065448215
        },
        {
          x: -4.858455729934349,
          y: -7.3781001252948215
        },
        {
          x: -4.931331706496849,
          y: -7.2508418245135715
        },
        {
          x: -4.985988688918724,
          y: -7.0472285432635715
        },
        {
          x: -5.058864665481224,
          y: -6.8563410920916965
        },
        {
          x: -5.131740642043724,
          y: -6.5890986604510715
        },
        {
          x: -5.186397624465599,
          y: -6.4618403596698215
        },
        {
          x: -5.259273601028099,
          y: -6.2582270784198215
        },
        {
          x: -5.313930583449974,
          y: -6.0546137971698215
        },
        {
          x: -5.386806560012474,
          y: -5.8637263459979465
        },
        {
          x: -5.386806560012474,
          y: -5.6601130647479465
        },
        {
          x: -5.514339518996849,
          y: -5.4692256135760715
        },
        {
          x: -5.514339518996849,
          y: -5.2656123323260715
        },
        {
          x: -5.587215495559349,
          y: -5.0619990510760715
        },
        {
          x: -5.660091472121849,
          y: -4.9347407502948215
        },
        {
          x: -5.660091472121849,
          y: -4.7311274690448215
        },
        {
          x: -5.714748454543724,
          y: -4.5402400178729465
        },
        {
          x: -5.787624431106224,
          y: -4.3366267366229465
        },
        {
          x: -5.860500407668724,
          y: -4.1457392854510715
        },
        {
          x: -5.860500407668724,
          y: -4.0057551545916965
        },
        {
          x: -5.915157390090599,
          y: -3.8148677034198215
        },
        {
          x: -5.988033366653099,
          y: -3.6112544221698215
        },
        {
          x: -6.042690349074974,
          y: -3.4076411409198215
        },
        {
          x: -6.042690349074974,
          y: -3.2803828401385715
        },
        {
          x: -6.115566325637474,
          y: -3.0767695588885715
        },
        {
          x: -6.188442302199974,
          y: -2.8858821077166965
        },
        {
          x: -6.243099284621849,
          y: -2.6822688264666965
        },
        {
          x: -6.315975261184349,
          y: -2.4786555452166965
        },
        {
          x: -6.388851237746849,
          y: -2.2877680940448215
        },
        {
          x: -6.443508220168724,
          y: -2.0841548127948215
        },
        {
          x: -6.516384196731224,
          y: -1.8932673616229465
        },
        {
          x: -6.589260173293724,
          y: -1.7532832307635715
        },
        {
          x: -6.589260173293724,
          y: -1.5623957795916965
        },
        {
          x: -6.643917155715599,
          y: -1.3587824983416965
        },
        {
          x: -6.716793132278099,
          y: -1.0915400667010715
        },
        {
          x: -6.771450114699974,
          y: -0.9642817659198215
        },
        {
          x: -6.844326091262474,
          y: -0.7606684846698215
        },
        {
          x: -6.917202067824974,
          y: -0.5697810334979465
        },
        {
          x: -6.971859050246849,
          y: -0.3661677522479465
        },
        {
          x: -6.971859050246849,
          y: -0.2389094514666965
        },
        {
          x: -7.044735026809349,
          y: 0.02833298017392849
        },
        {
          x: -7.117611003371849,
          y: 0.1683171110333035
        },
        {
          x: -7.117611003371849,
          y: 0.3592045622051785
        },
        {
          x: -7.172267985793724,
          y: 0.4991886930645535
        },
        {
          x: -7.172267985793724,
          y: 0.6900761442364285
        },
        {
          x: -7.245143962356224,
          y: 0.8936894254864285
        },
        {
          x: -7.245143962356224,
          y: 1.0845768766583035
        },
        {
          x: -7.299800944778099,
          y: 1.2245610075176785
        },
        {
          x: -7.299800944778099,
          y: 1.4154484586895535
        },
        {
          x: -7.299800944778099,
          y: 1.5554325895489285
        },
        {
          x: -7.372676921340599,
          y: 1.7463200407208035
        },
        {
          x: -7.372676921340599,
          y: 1.8863041715801785
        },
        {
          x: -7.372676921340599,
          y: 2.0771916227520535
        },
        {
          x: -7.372676921340599,
          y: 2.2171757536114285
        },
        {
          x: -7.372676921340599,
          y: 2.4080632047833035
        },
        {
          x: -7.445552897903099,
          y: 2.5480473356426785
        },
        {
          x: -7.445552897903099,
          y: 2.6753056364239285
        },
        {
          x: -7.445552897903099,
          y: 2.8789189176739285
        },
        {
          x: -7.445552897903099,
          y: 3.0698063688458035
        },
        {
          x: -7.445552897903099,
          y: 3.2097904997051785
        },
        {
          x: -7.445552897903099,
          y: 3.3370488004864285
        },
        {
          x: -7.445552897903099,
          y: 3.5406620817364285
        },
        {
          x: -7.445552897903099,
          y: 3.6679203825176785
        },
        {
          x: -7.445552897903099,
          y: 3.8079045133770535
        },
        {
          x: -7.445552897903099,
          y: 3.9987919645489285
        },
        {
          x: -7.445552897903099,
          y: 4.2024052457989285
        },
        {
          x: -7.445552897903099,
          y: 4.3296635465801785
        },
        {
          x: -7.445552897903099,
          y: 4.4696476774395535
        },
        {
          x: -7.445552897903099,
          y: 4.5969059782208035
        },
        {
          x: -7.445552897903099,
          y: 4.8005192594708035
        },
        {
          x: -7.445552897903099,
          y: 4.9277775602520535
        },
        {
          x: -7.445552897903099,
          y: 5.0677616911114285
        },
        {
          x: -7.445552897903099,
          y: 5.1950199918926785
        },
        {
          x: -7.445552897903099,
          y: 5.3222782926739285
        },
        {
          x: -7.445552897903099,
          y: 5.4622624235333035
        },
        {
          x: -7.445552897903099,
          y: 5.5895207243145535
        },
        {
          x: -7.445552897903099,
          y: 5.7295048551739285
        },
        {
          x: -7.445552897903099,
          y: 5.8567631559551785
        },
        {
          x: -7.445552897903099,
          y: 5.9203923063458035
        },
        {
          x: -7.445552897903099,
          y: 6.0603764372051785
        },
        {
          x: -7.372676921340599,
          y: 6.1240055875958035
        },
        {
          x: -7.372676921340599,
          y: 6.2512638883770535
        },
        {
          x: -7.299800944778099,
          y: 6.3912480192364285
        },
        {
          x: -7.245143962356224,
          y: 6.4548771696270535
        },
        {
          x: -7.245143962356224,
          y: 6.5821354704083035
        },
        {
          x: -7.172267985793724,
          y: 6.6457646207989285
        },
        {
          x: -7.117611003371849,
          y: 6.7857487516583035
        },
        {
          x: -7.044735026809349,
          y: 6.8493779020489285
        },
        {
          x: -6.971859050246849,
          y: 6.9766362028301785
        },
        {
          x: -6.917202067824974,
          y: 7.1166203336895535
        },
        {
          x: -6.844326091262474,
          y: 7.1802494840801785
        },
        {
          x: -6.771450114699974,
          y: 7.2438786344708035
        },
        {
          x: -6.716793132278099,
          y: 7.3838627653301785
        },
        {
          x: -6.643917155715599,
          y: 7.4474919157208035
        },
        {
          x: -6.589260173293724,
          y: 7.5747502165020535
        },
        {
          x: -6.516384196731224,
          y: 7.6383793668926785
        },
        {
          x: -6.443508220168724,
          y: 7.7783634977520535
        },
        {
          x: -6.388851237746849,
          y: 7.8419926481426785
        },
        {
          x: -6.315975261184349,
          y: 7.9692509489239285
        },
        {
          x: -6.243099284621849,
          y: 8.109235079783303
        },
        {
          x: -6.188442302199974,
          y: 8.236493380564553
        },
        {
          x: -6.042690349074974,
          y: 8.376477511423928
        },
        {
          x: -5.988033366653099,
          y: 8.440106661814553
        },
        {
          x: -5.915157390090599,
          y: 8.567364962595803
        },
        {
          x: -5.860500407668724,
          y: 8.707349093455178
        },
        {
          x: -5.787624431106224,
          y: 8.834607394236428
        },
        {
          x: -5.660091472121849,
          y: 8.961865695017678
        },
        {
          x: -5.587215495559349,
          y: 9.101849825877053
        },
        {
          x: -5.514339518996849,
          y: 9.229108126658303
        },
        {
          x: -5.459682536574974,
          y: 9.292737277048928
        },
        {
          x: -5.386806560012474,
          y: 9.432721407908303
        },
        {
          x: -5.259273601028099,
          y: 9.559979708689553
        },
        {
          x: -5.186397624465599,
          y: 9.623608859080178
        },
        {
          x: -5.131740642043724,
          y: 9.763592989939553
        },
        {
          x: -5.058864665481224,
          y: 9.827222140330178
        },
        {
          x: -4.931331706496849,
          y: 9.890851290720803
        },
        {
          x: -4.858455729934349,
          y: 9.954480441111428
        },
        {
          x: -4.785579753371849,
          y: 10.030835421580178
        },
        {
          x: -4.658046794387474,
          y: 10.094464571970803
        },
        {
          x: -4.585170817824974,
          y: 10.158093722361428
        },
        {
          x: -4.530513835403099,
          y: 10.158093722361428
        },
        {
          x: -4.457637858840599,
          y: 10.221722872752053
        },
        {
          x: -4.402980876418724,
          y: 10.285352023142678
        },
        {
          x: -4.257228923293724,
          y: 10.361707003611428
        },
        {
          x: -4.202571940871849,
          y: 10.361707003611428
        },
        {
          x: -4.129695964309349,
          y: 10.425336154002053
        },
        {
          x: -4.056819987746849,
          y: 10.425336154002053
        },
        {
          x: -4.002163005324974,
          y: 10.488965304392678
        },
        {
          x: -3.9292870287624737,
          y: 10.488965304392678
        },
        {
          x: -3.8017540697780987,
          y: 10.552594454783303
        },
        {
          x: -3.7288780932155987,
          y: 10.552594454783303
        },
        {
          x: -3.6742211107937237,
          y: 10.616223605173928
        },
        {
          x: -3.6013451342312237,
          y: 10.616223605173928
        },
        {
          x: -3.4738121752468487,
          y: 10.616223605173928
        },
        {
          x: -3.4009361986843487,
          y: 10.616223605173928
        },
        {
          x: -3.2734032396999737,
          y: 10.616223605173928
        },
        {
          x: -3.1458702807155987,
          y: 10.616223605173928
        },
        {
          x: -3.0001183275905987,
          y: 10.616223605173928
        },
        {
          x: -2.9454613451687237,
          y: 10.616223605173928
        },
        {
          x: -2.7997093920437237,
          y: 10.616223605173928
        },
        {
          x: -2.6721764330593487,
          y: 10.616223605173928
        },
        {
          x: -2.5446434740749737,
          y: 10.616223605173928
        },
        {
          x: -2.4171105150905987,
          y: 10.616223605173928
        },
        {
          x: -2.2713585619655987,
          y: 10.616223605173928
        },
        {
          x: -2.1438256029812237,
          y: 10.616223605173928
        },
        {
          x: -2.0162926439968487,
          y: 10.616223605173928
        },
        {
          x: -1.8705406908718487,
          y: 10.616223605173928
        },
        {
          x: -1.7430077318874737,
          y: 10.616223605173928
        },
        {
          x: -1.6154747729030987,
          y: 10.616223605173928
        },
        {
          x: -1.4879418139187237,
          y: 10.616223605173928
        },
        {
          x: -1.3421898607937237,
          y: 10.616223605173928
        },
        {
          x: -1.1417809252468487,
          y: 10.616223605173928
        },
        {
          x: -1.0142479662624737,
          y: 10.616223605173928
        },
        {
          x: -0.8867150072780987,
          y: 10.616223605173928
        },
        {
          x: -0.7591820482937237,
          y: 10.616223605173928
        },
        {
          x: -0.5587731127468487,
          y: 10.616223605173928
        },
        {
          x: -0.4130211596218487,
          y: 10.616223605173928
        },
        {
          x: -0.2854882006374737,
          y: 10.616223605173928
        },
        {
          x: -0.1579552416530987,
          y: 10.616223605173928
        },
        {
          x: -0.03042228266872371,
          y: 10.616223605173928
        },
        {
          x: 0.11532967045627629,
          y: 10.616223605173928
        },
        {
          x: 0.2428626294406513,
          y: 10.616223605173928
        },
        {
          x: 0.3703955884250263,
          y: 10.616223605173928
        },
        {
          x: 0.4979285474094013,
          y: 10.616223605173928
        },
        {
          x: 0.6436805005344013,
          y: 10.616223605173928
        },
        {
          x: 0.8440894360812763,
          y: 10.616223605173928
        },
        {
          x: 0.9716223950656513,
          y: 10.616223605173928
        },
        {
          x: 1.0991553540500263,
          y: 10.616223605173928
        },
        {
          x: 1.1720313306125263,
          y: 10.616223605173928
        },
        {
          x: 1.2995642895969013,
          y: 10.616223605173928
        },
        {
          x: 1.4270972485812763,
          y: 10.616223605173928
        },
        {
          x: 1.5728492017062763,
          y: 10.616223605173928
        },
        {
          x: 1.7003821606906513,
          y: 10.616223605173928
        },
        {
          x: 1.8279151196750263,
          y: 10.616223605173928
        },
        {
          x: 1.9007910962375263,
          y: 10.616223605173928
        },
        {
          x: 2.0283240552219013,
          y: 10.552594454783303
        },
        {
          x: 2.1558570142062763,
          y: 10.552594454783303
        },
        {
          x: 2.3016089673312763,
          y: 10.488965304392678
        },
        {
          x: 2.3562659497531513,
          y: 10.488965304392678
        },
        {
          x: 2.4837989087375263,
          y: 10.425336154002053
        },
        {
          x: 2.5566748853000263,
          y: 10.361707003611428
        },
        {
          x: 2.6842078442844013,
          y: 10.361707003611428
        },
        {
          x: 2.7570838208469013,
          y: 10.285352023142678
        },
        {
          x: 2.8846167798312763,
          y: 10.221722872752053
        },
        {
          x: 3.0303687329562763,
          y: 10.158093722361428
        },
        {
          x: 3.0850257153781513,
          y: 10.094464571970803
        },
        {
          x: 3.2125586743625263,
          y: 10.030835421580178
        },
        {
          x: 3.2854346509250263,
          y: 9.954480441111428
        },
        {
          x: 3.4129676099094013,
          y: 9.890851290720803
        },
        {
          x: 3.5587195630344013,
          y: 9.827222140330178
        },
        {
          x: 3.6133765454562763,
          y: 9.763592989939553
        },
        {
          x: 3.7409095044406513,
          y: 9.699963839548928
        },
        {
          x: 3.8137854810031513,
          y: 9.623608859080178
        },
        {
          x: 3.8866614575656513,
          y: 9.559979708689553
        },
        {
          x: 4.014194416550026,
          y: 9.432721407908303
        },
        {
          x: 4.141727375534401,
          y: 9.369092257517678
        },
        {
          x: 4.214603352096901,
          y: 9.292737277048928
        },
        {
          x: 4.287479328659401,
          y: 9.165478976267678
        },
        {
          x: 4.415012287643776,
          y: 9.101849825877053
        },
        {
          x: 4.469669270065651,
          y: 8.961865695017678
        },
        {
          x: 4.542545246628151,
          y: 8.898236544627053
        },
        {
          x: 4.670078205612526,
          y: 8.770978243845803
        },
        {
          x: 4.742954182175026,
          y: 8.630994112986428
        },
        {
          x: 4.870487141159401,
          y: 8.567364962595803
        },
        {
          x: 4.943363117721901,
          y: 8.440106661814553
        },
        {
          x: 5.016239094284401,
          y: 8.300122530955178
        },
        {
          x: 5.070896076706276,
          y: 8.236493380564553
        },
        {
          x: 5.198429035690651,
          y: 8.109235079783303
        },
        {
          x: 5.271305012253151,
          y: 7.9692509489239285
        },
        {
          x: 5.344180988815651,
          y: 7.8419926481426785
        },
        {
          x: 5.398837971237526,
          y: 7.7147343473614285
        },
        {
          x: 5.471713947800026,
          y: 7.5747502165020535
        },
        {
          x: 5.544589924362526,
          y: 7.4474919157208035
        },
        {
          x: 5.599246906784401,
          y: 7.3075077848614285
        },
        {
          x: 5.672122883346901,
          y: 7.1802494840801785
        },
        {
          x: 5.744998859909401,
          y: 6.9766362028301785
        },
        {
          x: 5.799655842331276,
          y: 6.8493779020489285
        },
        {
          x: 5.872531818893776,
          y: 6.7221196012676785
        },
        {
          x: 5.927188801315651,
          y: 6.5185063200176785
        },
        {
          x: 6.000064777878151,
          y: 6.3912480192364285
        },
        {
          x: 6.072940754440651,
          y: 6.2512638883770535
        },
        {
          x: 6.127597736862526,
          y: 6.0603764372051785
        },
        {
          x: 6.200473713425026,
          y: 5.9203923063458035
        },
        {
          x: 6.200473713425026,
          y: 5.7931340055645535
        },
        {
          x: 6.273349689987526,
          y: 5.5895207243145535
        },
        {
          x: 6.328006672409401,
          y: 5.4622624235333035
        },
        {
          x: 6.400882648971901,
          y: 5.2586491422833035
        },
        {
          x: 6.400882648971901,
          y: 5.1313908415020535
        },
        {
          x: 6.473758625534401,
          y: 4.9277775602520535
        },
        {
          x: 6.473758625534401,
          y: 4.8005192594708035
        },
        {
          x: 6.528415607956276,
          y: 4.5969059782208035
        },
        {
          x: 6.601291584518776,
          y: 4.4060185270489285
        },
        {
          x: 6.601291584518776,
          y: 4.2660343961895535
        },
        {
          x: 6.655948566940651,
          y: 4.0751469450176785
        },
        {
          x: 6.655948566940651,
          y: 3.9351628141583035
        },
        {
          x: 6.728824543503151,
          y: 3.7315495329083035
        },
        {
          x: 6.728824543503151,
          y: 3.5406620817364285
        },
        {
          x: 6.801700520065651,
          y: 3.4006779508770535
        },
        {
          x: 6.856357502487526,
          y: 3.2097904997051785
        },
        {
          x: 6.856357502487526,
          y: 3.0698063688458035
        },
        {
          x: 6.929233479050026,
          y: 2.8789189176739285
        },
        {
          x: 6.929233479050026,
          y: 2.6753056364239285
        },
        {
          x: 7.002109455612526,
          y: 2.4844181852520535
        },
        {
          x: 7.056766438034401,
          y: 2.3444340543926785
        },
        {
          x: 7.056766438034401,
          y: 2.1535466032208035
        },
        {
          x: 7.129642414596901,
          y: 1.9499333219708035
        },
        {
          x: 7.129642414596901,
          y: 1.8226750211895535
        },
        {
          x: 7.184299397018776,
          y: 1.6190617399395535
        },
        {
          x: 7.184299397018776,
          y: 1.4154484586895535
        },
        {
          x: 7.257175373581276,
          y: 1.2881901579083035
        },
        {
          x: 7.257175373581276,
          y: 1.1609318571270535
        },
        {
          x: 7.330051350143776,
          y: 0.9573185758770535
        },
        {
          x: 7.330051350143776,
          y: 0.8300602750958035
        },
        {
          x: 7.384708332565651,
          y: 0.6264469938458035
        },
        {
          x: 7.384708332565651,
          y: 0.4991886930645535
        },
        {
          x: 7.457584309128151,
          y: 0.2955754118145535
        },
        {
          x: 7.457584309128151,
          y: 0.1683171110333035
        },
        {
          x: 7.457584309128151,
          y: -0.03529617021669651
        },
        {
          x: 7.530460285690651,
          y: -0.1625544709979465
        },
        {
          x: 7.530460285690651,
          y: -0.3661677522479465
        },
        {
          x: 7.585117268112526,
          y: -0.5697810334979465
        },
        {
          x: 7.585117268112526,
          y: -0.7606684846698215
        },
        {
          x: 7.585117268112526,
          y: -0.9006526155291965
        },
        {
          x: 7.585117268112526,
          y: -1.0915400667010715
        },
        {
          x: 7.585117268112526,
          y: -1.2951533479510715
        },
        {
          x: 7.657993244675026,
          y: -1.4224116487323215
        },
        {
          x: 7.657993244675026,
          y: -1.6260249299823215
        },
        {
          x: 7.657993244675026,
          y: -1.8169123811541965
        },
        {
          x: 7.657993244675026,
          y: -1.9568965120135715
        },
        {
          x: 7.657993244675026,
          y: -2.1477839631854465
        },
        {
          x: 7.657993244675026,
          y: -2.2877680940448215
        },
        {
          x: 7.657993244675026,
          y: -2.4786555452166965
        },
        {
          x: 7.657993244675026,
          y: -2.6822688264666965
        },
        {
          x: 7.657993244675026,
          y: -2.8095271272479465
        },
        {
          x: 7.657993244675026,
          y: -2.9495112581073215
        },
        {
          x: 7.657993244675026,
          y: -3.0767695588885715
        },
        {
          x: 7.657993244675026,
          y: -3.2167536897479465
        },
        {
          x: 7.657993244675026,
          y: -3.4076411409198215
        },
        {
          x: 7.657993244675026,
          y: -3.5476252717791965
        },
        {
          x: 7.657993244675026,
          y: -3.6748835725604465
        },
        {
          x: 7.657993244675026,
          y: -3.8148677034198215
        },
        {
          x: 7.657993244675026,
          y: -3.9421260042010715
        },
        {
          x: 7.657993244675026,
          y: -4.0693843049823215
        },
        {
          x: 7.657993244675026,
          y: -4.2093684358416965
        },
        {
          x: 7.657993244675026,
          y: -4.3366267366229465
        },
        {
          x: 7.657993244675026,
          y: -4.4766108674823215
        },
        {
          x: 7.657993244675026,
          y: -4.6038691682635715
        },
        {
          x: 7.657993244675026,
          y: -4.6674983186541965
        },
        {
          x: 7.657993244675026,
          y: -4.8074824495135715
        },
        {
          x: 7.657993244675026,
          y: -4.9347407502948215
        },
        {
          x: 7.585117268112526,
          y: -5.0619990510760715
        },
        {
          x: 7.585117268112526,
          y: -5.2019831819354465
        },
        {
          x: 7.530460285690651,
          y: -5.3292414827166965
        },
        {
          x: 7.457584309128151,
          y: -5.4692256135760715
        },
        {
          x: 7.457584309128151,
          y: -5.5964839143573215
        },
        {
          x: 7.384708332565651,
          y: -5.7237422151385715
        },
        {
          x: 7.330051350143776,
          y: -5.8637263459979465
        },
        {
          x: 7.257175373581276,
          y: -5.9909846467791965
        },
        {
          x: 7.184299397018776,
          y: -6.1309687776385715
        },
        {
          x: 7.129642414596901,
          y: -6.2582270784198215
        },
        {
          x: 7.056766438034401,
          y: -6.3854853792010715
        },
        {
          x: 7.002109455612526,
          y: -6.5254695100604465
        },
        {
          x: 6.929233479050026,
          y: -6.7163569612323215
        },
        {
          x: 6.856357502487526,
          y: -6.8563410920916965
        },
        {
          x: 6.801700520065651,
          y: -6.9835993928729465
        },
        {
          x: 6.728824543503151,
          y: -7.1235835237323215
        },
        {
          x: 6.655948566940651,
          y: -7.2508418245135715
        },
        {
          x: 6.601291584518776,
          y: -7.3781001252948215
        },
        {
          x: 6.528415607956276,
          y: -7.5180842561541965
        },
        {
          x: 6.400882648971901,
          y: -7.6453425569354465
        },
        {
          x: 6.328006672409401,
          y: -7.7089717073260715
        },
        {
          x: 6.273349689987526,
          y: -7.8489558381854465
        },
        {
          x: 6.127597736862526,
          y: -7.9125849885760715
        },
        {
          x: 6.072940754440651,
          y: -8.039843289357322
        },
        {
          x: 5.927188801315651,
          y: -8.179827420216697
        },
        {
          x: 5.872531818893776,
          y: -8.243456570607322
        },
        {
          x: 5.744998859909401,
          y: -8.307085720997947
        },
        {
          x: 5.672122883346901,
          y: -8.370714871388572
        },
        {
          x: 5.544589924362526,
          y: -8.447069851857322
        },
        {
          x: 5.398837971237526,
          y: -8.574328152638572
        },
        {
          x: 5.271305012253151,
          y: -8.637957303029197
        },
        {
          x: 5.198429035690651,
          y: -8.701586453419822
        },
        {
          x: 5.070896076706276,
          y: -8.777941433888572
        },
        {
          x: 4.943363117721901,
          y: -8.841570584279197
        },
        {
          x: 4.815830158737526,
          y: -8.905199734669822
        },
        {
          x: 4.670078205612526,
          y: -8.968828885060447
        },
        {
          x: 4.542545246628151,
          y: -9.032458035451072
        },
        {
          x: 4.415012287643776,
          y: -9.108813015919822
        },
        {
          x: 4.287479328659401,
          y: -9.172442166310447
        },
        {
          x: 4.141727375534401,
          y: -9.299700467091697
        },
        {
          x: 4.014194416550026,
          y: -9.363329617482322
        },
        {
          x: 3.8866614575656513,
          y: -9.439684597951072
        },
        {
          x: 3.7409095044406513,
          y: -9.503313748341697
        },
        {
          x: 3.6133765454562763,
          y: -9.566942898732322
        },
        {
          x: 3.4858435864719013,
          y: -9.630572049122947
        },
        {
          x: 3.3583106274875263,
          y: -9.694201199513572
        },
        {
          x: 3.1579016919406513,
          y: -9.770556179982322
        },
        {
          x: 3.0303687329562763,
          y: -9.897814480763572
        },
        {
          x: 2.8299597974094013,
          y: -9.961443631154197
        },
        {
          x: 2.6842078442844013,
          y: -10.025072781544822
        },
        {
          x: 2.4837989087375263,
          y: -10.101427762013572
        },
        {
          x: 2.3562659497531513,
          y: -10.165056912404197
        },
        {
          x: 2.1558570142062763,
          y: -10.228686062794822
        },
        {
          x: 1.9554480786594013,
          y: -10.292315213185447
        },
        {
          x: 1.7550391431125263,
          y: -10.292315213185447
        },
        {
          x: 1.4999732251437763,
          y: -10.368670193654197
        },
        {
          x: 1.2995642895969013,
          y: -10.368670193654197
        },
        {
          x: 1.0262793774875263,
          y: -10.432299344044822
        },
        {
          x: 0.8440894360812763,
          y: -10.432299344044822
        },
        {
          x: 0.5708045239719013,
          y: -10.495928494435447
        },
        {
          x: 0.2975196118625263,
          y: -10.559557644826072
        },
        {
          x: 0.04245369389377629,
          y: -10.623186795216697
        },
        {
          x: -0.1579552416530987,
          y: -10.699541775685447
        },
        {
          x: -0.4130211596218487,
          y: -10.763170926076072
        },
        {
          x: -0.6863060717312237,
          y: -10.826800076466697
        },
        {
          x: -0.9595909838405987,
          y: -10.890429226857322
        },
        {
          x: -1.1417809252468487,
          y: -10.954058377247947
        },
        {
          x: -1.3421898607937237,
          y: -11.030413357716697
        },
        {
          x: -1.5425987963405987,
          y: -11.094042508107322
        },
        {
          x: -1.6883507494655987,
          y: -11.094042508107322
        },
        {
          x: -1.8705406908718487,
          y: -11.094042508107322
        }
      ]
    ]
  },
  {
    name: "4",
    strokes: [
      [
        {
          x: -0.9743201214333794,
          y: -8.521695344344437
        },
        {
          x: -0.9743201214333794,
          y: -8.585324494735062
        },
        {
          x: -0.9743201214333794,
          y: -8.788937775985062
        },
        {
          x: -0.9743201214333794,
          y: -8.979825227156937
        },
        {
          x: -0.9743201214333794,
          y: -9.119809358016312
        },
        {
          x: -0.9743201214333794,
          y: -9.374325959578812
        },
        {
          x: -0.9743201214333794,
          y: -9.514310090438187
        },
        {
          x: -0.9743201214333794,
          y: -9.641568391219437
        },
        {
          x: -0.9743201214333794,
          y: -9.781552522078812
        },
        {
          x: -0.9743201214333794,
          y: -9.908810822860062
        },
        {
          x: -1.0289771038552544,
          y: -10.036069123641312
        },
        {
          x: -1.0289771038552544,
          y: -10.239682404891312
        },
        {
          x: -1.0289771038552544,
          y: -10.303311555281937
        },
        {
          x: -1.0289771038552544,
          y: -10.366940705672562
        },
        {
          x: -1.0289771038552544,
          y: -10.443295686141312
        },
        {
          x: -1.0289771038552544,
          y: -10.506924836531937
        },
        {
          x: -1.0289771038552544,
          y: -10.570553986922562
        },
        {
          x: -1.0289771038552544,
          y: -10.634183137313187
        },
        {
          x: -1.0289771038552544,
          y: -10.634183137313187
        },
        {
          x: -1.0289771038552544,
          y: -10.634183137313187
        },
        {
          x: -1.0289771038552544,
          y: -10.634183137313187
        },
        {
          x: -1.0289771038552544,
          y: -10.634183137313187
        },
        {
          x: -1.0289771038552544,
          y: -10.570553986922562
        },
        {
          x: -1.0289771038552544,
          y: -10.303311555281937
        },
        {
          x: -1.1018530804177544,
          y: -10.036069123641312
        },
        {
          x: -1.1747290569802544,
          y: -9.705197541610062
        },
        {
          x: -1.1747290569802544,
          y: -9.310696809188187
        },
        {
          x: -1.2293860394021294,
          y: -8.916196076766312
        },
        {
          x: -1.3751379925271294,
          y: -8.445340363875687
        },
        {
          x: -1.4297949749490044,
          y: -7.923581330672562
        },
        {
          x: -1.5755469280740044,
          y: -7.389096467391312
        },
        {
          x: -1.7030798870583794,
          y: -6.790982453719437
        },
        {
          x: -1.8306128460427544,
          y: -6.205594270125687
        },
        {
          x: -1.9581458050271294,
          y: -5.607480256453812
        },
        {
          x: -2.1038977581521294,
          y: -5.009366242781937
        },
        {
          x: -2.3043066936990044,
          y: -4.347623078719437
        },
        {
          x: -2.4864966351052544,
          y: -3.7495090650475618
        },
        {
          x: -2.6322485882302544,
          y: -3.1513950513756868
        },
        {
          x: -2.8326575237771294,
          y: -2.5660068677819368
        },
        {
          x: -2.9601904827615044,
          y: -1.9678928541100618
        },
        {
          x: -3.1605994183083794,
          y: -1.3697788404381868
        },
        {
          x: -3.3610083538552544,
          y: -0.7080356763756868
        },
        {
          x: -3.4885413128396294,
          y: -0.17355081309443676
        },
        {
          x: -3.6160742718240044,
          y: 0.34820822010868824
        },
        {
          x: -3.7436072308083794,
          y: 0.8826930833899382
        },
        {
          x: -3.8893591839333794,
          y: 1.3408229662024382
        },
        {
          x: -4.016892142917754,
          y: 1.8116786790930632
        },
        {
          x: -4.144425101902129,
          y: 2.2698085619055632
        },
        {
          x: -4.290177055027129,
          y: 2.6643092943274382
        },
        {
          x: -4.344834037449004,
          y: 2.9951808763586882
        },
        {
          x: -4.417710014011504,
          y: 3.3260524583899382
        },
        {
          x: -4.472366996433379,
          y: 3.5932948900305632
        },
        {
          x: -4.545242972995879,
          y: 3.8605373216711882
        },
        {
          x: -4.618118949558379,
          y: 4.127779753311813
        },
        {
          x: -4.618118949558379,
          y: 4.255038054093063
        },
        {
          x: -4.618118949558379,
          y: 4.395022184952438
        },
        {
          x: -4.618118949558379,
          y: 4.458651335343063
        },
        {
          x: -4.618118949558379,
          y: 4.522280485733688
        },
        {
          x: -4.618118949558379,
          y: 4.585909636124313
        },
        {
          x: -4.618118949558379,
          y: 4.649538786514938
        },
        {
          x: -4.618118949558379,
          y: 4.649538786514938
        },
        {
          x: -4.618118949558379,
          y: 4.649538786514938
        },
        {
          x: -4.618118949558379,
          y: 4.649538786514938
        },
        {
          x: -4.618118949558379,
          y: 4.649538786514938
        },
        {
          x: -4.545242972995879,
          y: 4.649538786514938
        },
        {
          x: -4.417710014011504,
          y: 4.649538786514938
        },
        {
          x: -4.290177055027129,
          y: 4.649538786514938
        },
        {
          x: -4.089768119480254,
          y: 4.649538786514938
        },
        {
          x: -3.8164832073708794,
          y: 4.649538786514938
        },
        {
          x: -3.5614172894021294,
          y: 4.649538786514938
        },
        {
          x: -3.2152564007302544,
          y: 4.649538786514938
        },
        {
          x: -2.8873145061990044,
          y: 4.649538786514938
        },
        {
          x: -2.5593726116677544,
          y: 4.649538786514938
        },
        {
          x: -2.1585547405740044,
          y: 4.585909636124313
        },
        {
          x: -1.7577368694802544,
          y: 4.585909636124313
        },
        {
          x: -1.3751379925271294,
          y: 4.585909636124313
        },
        {
          x: -0.9743201214333794,
          y: 4.585909636124313
        },
        {
          x: -0.5006262737771294,
          y: 4.585909636124313
        },
        {
          x: -0.04515142026150443,
          y: 4.585909636124313
        },
        {
          x: 0.3556664508322456,
          y: 4.585909636124313
        },
        {
          x: 0.7564843219259956,
          y: 4.585909636124313
        },
        {
          x: 1.1390831988791206,
          y: 4.585909636124313
        },
        {
          x: 1.5399010699728706,
          y: 4.585909636124313
        },
        {
          x: 2.0135949176291206,
          y: 4.585909636124313
        },
        {
          x: 2.4144127887228706,
          y: 4.585909636124313
        },
        {
          x: 2.7423546832541206,
          y: 4.585909636124313
        },
        {
          x: 3.0702965777853706,
          y: 4.585909636124313
        },
        {
          x: 3.3982384723166206,
          y: 4.585909636124313
        },
        {
          x: 3.7261803668478706,
          y: 4.585909636124313
        },
        {
          x: 3.9994652789572456,
          y: 4.585909636124313
        },
        {
          x: 4.199874214504121,
          y: 4.649538786514938
        },
        {
          x: 4.400283150050996,
          y: 4.649538786514938
        },
        {
          x: 4.582473091457246,
          y: 4.649538786514938
        },
        {
          x: 4.728225044582246,
          y: 4.725893766983688
        },
        {
          x: 4.928633980129121,
          y: 4.725893766983688
        },
        {
          x: 5.056166939113496,
          y: 4.725893766983688
        },
        {
          x: 5.129042915675996,
          y: 4.725893766983688
        },
        {
          x: 5.183699898097871,
          y: 4.725893766983688
        },
        {
          x: 5.256575874660371,
          y: 4.725893766983688
        },
        {
          x: 5.311232857082246,
          y: 4.725893766983688
        },
        {
          x: 5.384108833644746,
          y: 4.725893766983688
        },
        {
          x: 5.384108833644746,
          y: 4.725893766983688
        },
        {
          x: 5.456984810207246,
          y: 4.725893766983688
        },
        {
          x: 5.456984810207246,
          y: 4.725893766983688
        },
        {
          x: 5.511641792629121,
          y: 4.725893766983688
        }
      ],
      [
        {
          x: 4.454940132472871,
          y: -1.6370212720788118
        },
        {
          x: 4.454940132472871,
          y: -1.6370212720788118
        },
        {
          x: 4.454940132472871,
          y: -1.6370212720788118
        },
        {
          x: 4.327407173488496,
          y: -1.6370212720788118
        },
        {
          x: 4.254531196925996,
          y: -1.6370212720788118
        },
        {
          x: 4.199874214504121,
          y: -1.6370212720788118
        },
        {
          x: 4.054122261379121,
          y: -1.6370212720788118
        },
        {
          x: 3.9994652789572456,
          y: -1.6370212720788118
        },
        {
          x: 3.8719323199728706,
          y: -1.6370212720788118
        },
        {
          x: 3.7990563434103706,
          y: -1.6370212720788118
        },
        {
          x: 3.6715233844259956,
          y: -1.6370212720788118
        },
        {
          x: 3.5986474078634956,
          y: -1.6370212720788118
        },
        {
          x: 3.4711144488791206,
          y: -1.6370212720788118
        },
        {
          x: 3.3253624957541206,
          y: -1.5606662916100618
        },
        {
          x: 3.1978295367697456,
          y: -1.3061496900475618
        },
        {
          x: 3.0702965777853706,
          y: -0.9752781080163118
        },
        {
          x: 2.9427636188009956,
          y: -0.5044223951256868
        },
        {
          x: 2.7970116656759956,
          y: 0.017336638077438238
        },
        {
          x: 2.5966027301291206,
          y: 0.6790798021399382
        },
        {
          x: 2.4690697711447456,
          y: 1.4808070970618132
        },
        {
          x: 2.2686608355978706,
          y: 2.3334377122961882
        },
        {
          x: 2.1411278766134956,
          y: 3.2624233079993132
        },
        {
          x: 2.0135949176291206,
          y: 4.191408903702438
        },
        {
          x: 1.8678429645041206,
          y: 5.184023649796188
        },
        {
          x: 1.8131859820822456,
          y: 6.176638395889938
        },
        {
          x: 1.6856530230978706,
          y: 7.232882292374313
        },
        {
          x: 1.6127770465353706,
          y: 8.161867888077438
        },
        {
          x: 1.5399010699728706,
          y: 9.090853483780563
        },
        {
          x: 1.4852440875509956,
          y: 9.879854948624313
        },
        {
          x: 1.4852440875509956,
          y: 10.681582243546188
        },
        {
          x: 1.4852440875509956,
          y: 11.406954557999313
        },
        {
          x: 1.4852440875509956,
          y: 12.132326872452438
        },
        {
          x: 1.4852440875509956,
          y: 12.666811735733688
        }
      ]
    ]
  },
  {
    name: "+",
    strokes: [
      [
        {
          x: 0.3521671504764754,
          y: -4.767990950699698
        },
        {
          x: 0.4068241328983504,
          y: -4.767990950699698
        },
        {
          x: 0.5525760860233504,
          y: -4.767990950699698
        },
        {
          x: 0.6801090450077254,
          y: -4.767990950699698
        },
        {
          x: 0.8076420039921004,
          y: -4.767990950699698
        },
        {
          x: 1.0080509395389754,
          y: -4.767990950699698
        },
        {
          x: 1.0809269161014754,
          y: -4.767990950699698
        },
        {
          x: 1.2084598750858504,
          y: -4.767990950699698
        },
        {
          x: 1.2631168575077254,
          y: -4.767990950699698
        },
        {
          x: 1.3359928340702254,
          y: -4.767990950699698
        },
        {
          x: 1.4088688106327254,
          y: -4.767990950699698
        },
        {
          x: 1.4635257930546004,
          y: -4.767990950699698
        },
        {
          x: 1.4635257930546004,
          y: -4.767990950699698
        },
        {
          x: 1.5364017696171004,
          y: -4.767990950699698
        },
        {
          x: 1.5364017696171004,
          y: -4.767990950699698
        },
        {
          x: 1.5364017696171004,
          y: -4.767990950699698
        },
        {
          x: 1.5364017696171004,
          y: -4.767990950699698
        },
        {
          x: 1.5364017696171004,
          y: -4.628006819840323
        },
        {
          x: 1.5364017696171004,
          y: -4.437119368668448
        },
        {
          x: 1.5364017696171004,
          y: -4.169876937027823
        },
        {
          x: 1.5364017696171004,
          y: -3.902634505387198
        },
        {
          x: 1.5364017696171004,
          y: -3.571762923355948
        },
        {
          x: 1.5364017696171004,
          y: -3.177262190934073
        },
        {
          x: 1.5364017696171004,
          y: -2.782761458512198
        },
        {
          x: 1.5364017696171004,
          y: -2.311905745621573
        },
        {
          x: 1.5364017696171004,
          y: -1.7901467124184478
        },
        {
          x: 1.5364017696171004,
          y: -1.2556618491371978
        },
        {
          x: 1.4088688106327254,
          y: -0.6575478354653228
        },
        {
          x: 1.3359928340702254,
          y: -0.059433821793447805
        },
        {
          x: 1.2084598750858504,
          y: 0.6023093422690522
        },
        {
          x: 1.1355838985233504,
          y: 1.2640525063315522
        },
        {
          x: 1.0080509395389754,
          y: 1.8621665200034272
        },
        {
          x: 0.9351749629764754,
          y: 2.447554703597177
        },
        {
          x: 0.8076420039921004,
          y: 3.109297867659677
        },
        {
          x: 0.7347660274296004,
          y: 3.707411881331552
        },
        {
          x: 0.6801090450077254,
          y: 4.369155045394052
        },
        {
          x: 0.6072330684452254,
          y: 4.903639908675302
        },
        {
          x: 0.5525760860233504,
          y: 5.361769791487802
        },
        {
          x: 0.4797001094608504,
          y: 5.832625504378427
        },
        {
          x: 0.4797001094608504,
          y: 6.227126236800302
        },
        {
          x: 0.4797001094608504,
          y: 6.621626969222177
        },
        {
          x: 0.4797001094608504,
          y: 7.016127701644052
        },
        {
          x: 0.4797001094608504,
          y: 7.283370133284677
        },
        {
          x: 0.4797001094608504,
          y: 7.423354264144052
        },
        {
          x: 0.4797001094608504,
          y: 7.550612564925302
        },
        {
          x: 0.4797001094608504,
          y: 7.614241715315927
        },
        {
          x: 0.4797001094608504,
          y: 7.614241715315927
        },
        {
          x: 0.5525760860233504,
          y: 7.614241715315927
        },
        {
          x: 0.6801090450077254,
          y: 7.614241715315927
        },
        {
          x: 0.7347660274296004,
          y: 7.614241715315927
        }
      ],
      [
        {
          x: -4.9495601444454,
          y: 1.1240683754721772
        },
        {
          x: -4.9495601444454,
          y: 0.9331809243003022
        },
        {
          x: -4.9495601444454,
          y: 0.7295676430503022
        },
        {
          x: -4.9495601444454,
          y: 0.5386801918784272
        },
        {
          x: -4.9495601444454,
          y: 0.3986960610190522
        },
        {
          x: -5.0224361210079,
          y: 0.2714377602378022
        },
        {
          x: -5.077093103429775,
          y: 0.1314536293784272
        },
        {
          x: -5.149969079992275,
          y: 0.0678244789878022
        },
        {
          x: -5.149969079992275,
          y: -0.059433821793447805
        },
        {
          x: -5.222845056554775,
          y: -0.1357888022621978
        },
        {
          x: -5.27750203897665,
          y: -0.1994179526528228
        },
        {
          x: -5.27750203897665,
          y: -0.2630471030434478
        },
        {
          x: -5.27750203897665,
          y: -0.3266762534340728
        },
        {
          x: -5.27750203897665,
          y: -0.3266762534340728
        },
        {
          x: -5.27750203897665,
          y: -0.3266762534340728
        },
        {
          x: -5.27750203897665,
          y: -0.3903054038246978
        },
        {
          x: -5.27750203897665,
          y: -0.3903054038246978
        },
        {
          x: -5.222845056554775,
          y: -0.3903054038246978
        },
        {
          x: -4.9495601444454,
          y: -0.3903054038246978
        },
        {
          x: -4.69449422647665,
          y: -0.3903054038246978
        },
        {
          x: -4.2936763553829,
          y: -0.3903054038246978
        },
        {
          x: -3.8199825077266496,
          y: -0.3903054038246978
        },
        {
          x: -3.2916316776485246,
          y: -0.3903054038246978
        },
        {
          x: -2.7632808475703996,
          y: -0.3903054038246978
        },
        {
          x: -2.1073970585078996,
          y: -0.3903054038246978
        },
        {
          x: -1.4515132694453996,
          y: -0.3903054038246978
        },
        {
          x: -0.7227535038203996,
          y: -0.3266762534340728
        },
        {
          x: 0.0788822383671004,
          y: -0.2630471030434478
        },
        {
          x: 0.8076420039921004,
          y: -0.1994179526528228
        },
        {
          x: 1.6092777461796004,
          y: -0.059433821793447805
        },
        {
          x: 2.4655704707889754,
          y: 0.004195328597177195
        },
        {
          x: 3.2672062129764754,
          y: 0.0678244789878022
        },
        {
          x: 4.05062296102335,
          y: 0.1314536293784272
        },
        {
          x: 4.906915685632725,
          y: 0.1950827797690522
        },
        {
          x: 5.635675451257725,
          y: 0.1950827797690522
        },
        {
          x: 6.30977823446085,
          y: 0.2714377602378022
        },
        {
          x: 6.89278604696085,
          y: 0.3350669106284272
        },
        {
          x: 7.494012853601475,
          y: 0.3350669106284272
        },
        {
          x: 8.0223636836796,
          y: 0.3350669106284272
        },
        {
          x: 8.696466466882725,
          y: 0.3986960610190522
        },
        {
          x: 9.15194132039835,
          y: 0.4623252114096772
        }
      ]
    ]
  },
  {
    name: "=",
    strokes: [
      [
        {
          x: -3.3415912628173885,
          y: -2.282536697387684
        },
        {
          x: -3.3415912628173885,
          y: -2.282536697387684
        },
        {
          x: -3.3415912628173885,
          y: -2.282536697387684
        },
        {
          x: -3.3415912628173885,
          y: -2.282536697387684
        },
        {
          x: -3.3415912628173885,
          y: -2.282536697387684
        },
        {
          x: -3.3415912628173885,
          y: -2.346165847778309
        },
        {
          x: -3.2687152862548885,
          y: -2.409794998168934
        },
        {
          x: -3.1958393096923885,
          y: -2.486149978637684
        },
        {
          x: -3.1411823272705135,
          y: -2.549779129028309
        },
        {
          x: -3.1411823272705135,
          y: -2.613408279418934
        },
        {
          x: -3.1411823272705135,
          y: -2.613408279418934
        },
        {
          x: -3.0683063507080135,
          y: -2.677037429809559
        },
        {
          x: -2.9954303741455135,
          y: -2.740666580200184
        },
        {
          x: -2.9954303741455135,
          y: -2.740666580200184
        },
        {
          x: -2.9407733917236385,
          y: -2.817021560668934
        },
        {
          x: -2.8678974151611385,
          y: -2.817021560668934
        },
        {
          x: -2.8132404327392635,
          y: -2.880650711059559
        },
        {
          x: -2.7403644561767635,
          y: -2.944279861450184
        },
        {
          x: -2.6128314971923885,
          y: -3.007909011840809
        },
        {
          x: -2.4670795440673885,
          y: -3.007909011840809
        },
        {
          x: -2.2666706085205135,
          y: -3.071538162231434
        },
        {
          x: -2.1391376495361385,
          y: -3.147893142700184
        },
        {
          x: -1.8840717315673885,
          y: -3.147893142700184
        },
        {
          x: -1.6107868194580135,
          y: -3.211522293090809
        },
        {
          x: -1.2828449249267635,
          y: -3.211522293090809
        },
        {
          x: -0.9549030303955135,
          y: -3.275151443481434
        },
        {
          x: -0.6269611358642635,
          y: -3.275151443481434
        },
        {
          x: -0.2261432647705135,
          y: -3.275151443481434
        },
        {
          x: 0.2475505828857365,
          y: -3.275151443481434
        },
        {
          x: 0.7759014129638615,
          y: -3.275151443481434
        },
        {
          x: 1.2313762664794865,
          y: -3.275151443481434
        },
        {
          x: 1.7597270965576115,
          y: -3.275151443481434
        },
        {
          x: 2.3609539031982365,
          y: -3.275151443481434
        },
        {
          x: 2.8893047332763615,
          y: -3.275151443481434
        },
        {
          x: 3.4905315399169865,
          y: -3.275151443481434
        },
        {
          x: 4.1464153289794865,
          y: -3.275151443481434
        },
        {
          x: 4.7476421356201115,
          y: -3.275151443481434
        },
        {
          x: 5.3488689422607365,
          y: -3.275151443481434
        },
        {
          x: 5.8772197723388615,
          y: -3.275151443481434
        },
        {
          x: 6.4602275848388615,
          y: -3.275151443481434
        },
        {
          x: 6.9885784149169865,
          y: -3.275151443481434
        },
        {
          x: 7.5898052215576115,
          y: -3.275151443481434
        },
        {
          x: 8.118156051635737,
          y: -3.275151443481434
        },
        {
          x: 8.518973922729487,
          y: -3.275151443481434
        },
        {
          x: 8.974448776245112,
          y: -3.275151443481434
        },
        {
          x: 9.320609664916987,
          y: -3.275151443481434
        },
        {
          x: 9.703208541870112,
          y: -3.275151443481434
        }
      ],
      [
        {
          x: -3.1958393096923885,
          y: 4.933008956909191
        },
        {
          x: -3.1958393096923885,
          y: 4.933008956909191
        },
        {
          x: -3.1958393096923885,
          y: 4.933008956909191
        },
        {
          x: -3.2687152862548885,
          y: 4.933008956909191
        },
        {
          x: -3.2687152862548885,
          y: 4.933008956909191
        },
        {
          x: -3.3415912628173885,
          y: 4.933008956909191
        },
        {
          x: -3.3962482452392635,
          y: 4.933008956909191
        },
        {
          x: -3.4691242218017635,
          y: 4.933008956909191
        },
        {
          x: -3.5420001983642635,
          y: 4.869379806518566
        },
        {
          x: -3.5966571807861385,
          y: 4.805750656127941
        },
        {
          x: -3.5966571807861385,
          y: 4.805750656127941
        },
        {
          x: -3.5966571807861385,
          y: 4.729395675659191
        },
        {
          x: -3.5966571807861385,
          y: 4.665766525268566
        },
        {
          x: -3.5966571807861385,
          y: 4.602137374877941
        },
        {
          x: -3.5966571807861385,
          y: 4.538508224487316
        },
        {
          x: -3.5966571807861385,
          y: 4.474879074096691
        },
        {
          x: -3.4691242218017635,
          y: 4.398524093627941
        },
        {
          x: -3.1958393096923885,
          y: 4.334894943237316
        },
        {
          x: -2.8132404327392635,
          y: 4.207636642456066
        },
        {
          x: -2.4124225616455135,
          y: 4.144007492065441
        },
        {
          x: -1.8840717315673885,
          y: 4.004023361206066
        },
        {
          x: -1.2099689483642635,
          y: 3.940394210815441
        },
        {
          x: -0.5540851593017635,
          y: 3.813135910034191
        },
        {
          x: 0.1746746063232365,
          y: 3.736780929565441
        },
        {
          x: 1.0309673309326115,
          y: 3.673151779174816
        },
        {
          x: 1.8326030731201115,
          y: 3.545893478393566
        },
        {
          x: 2.7617717742919865,
          y: 3.482264328002941
        },
        {
          x: 3.8184734344482365,
          y: 3.405909347534191
        },
        {
          x: 4.8022991180419865,
          y: 3.342280197143566
        },
        {
          x: 5.8772197723388615,
          y: 3.278651046752941
        },
        {
          x: 6.9885784149169865,
          y: 3.215021896362316
        },
        {
          x: 8.063499069213862,
          y: 3.215021896362316
        },
        {
          x: 9.120200729370112,
          y: 3.215021896362316
        }
      ]
    ]
  },
  {
    name: "\xD7",
    strokes: [
      [
        {
          x: -4.592794081744032,
          y: -6.787234138039977
        },
        {
          x: -4.592794081744032,
          y: -6.850863288430602
        },
        {
          x: -4.538137099322157,
          y: -6.990847419289977
        },
        {
          x: -4.465261122759657,
          y: -7.118105720071227
        },
        {
          x: -4.392385146197157,
          y: -7.321719001321227
        },
        {
          x: -4.392385146197157,
          y: -7.448977302102477
        },
        {
          x: -4.337728163775282,
          y: -7.588961432961852
        },
        {
          x: -4.264852187212782,
          y: -7.716219733743102
        },
        {
          x: -4.264852187212782,
          y: -7.779848884133727
        },
        {
          x: -4.264852187212782,
          y: -7.919833014993102
        },
        {
          x: -4.264852187212782,
          y: -7.983462165383727
        },
        {
          x: -4.191976210650282,
          y: -8.047091315774352
        },
        {
          x: -4.191976210650282,
          y: -8.110720466164977
        },
        {
          x: -4.191976210650282,
          y: -8.174349616555602
        },
        {
          x: -4.191976210650282,
          y: -8.250704597024352
        },
        {
          x: -4.191976210650282,
          y: -8.314333747414977
        },
        {
          x: -4.191976210650282,
          y: -8.314333747414977
        },
        {
          x: -4.191976210650282,
          y: -8.314333747414977
        },
        {
          x: -4.191976210650282,
          y: -8.314333747414977
        },
        {
          x: -4.137319228228407,
          y: -8.314333747414977
        },
        {
          x: -4.137319228228407,
          y: -8.314333747414977
        },
        {
          x: -4.064443251665907,
          y: -8.314333747414977
        },
        {
          x: -4.064443251665907,
          y: -8.314333747414977
        },
        {
          x: -4.009786269244032,
          y: -8.314333747414977
        },
        {
          x: -3.9369102926815316,
          y: -8.174349616555602
        },
        {
          x: -3.8640343161190316,
          y: -7.919833014993102
        },
        {
          x: -3.7365013571346566,
          y: -7.652590583352477
        },
        {
          x: -3.6089683981502816,
          y: -7.385348151711852
        },
        {
          x: -3.4085594626034066,
          y: -6.990847419289977
        },
        {
          x: -3.2081505270565316,
          y: -6.596346686868102
        },
        {
          x: -3.0077415915096566,
          y: -6.125490973977477
        },
        {
          x: -2.8073326559627816,
          y: -5.667361091164977
        },
        {
          x: -2.5522667379940316,
          y: -5.132876227883727
        },
        {
          x: -2.2061058493221566,
          y: -4.598391364602477
        },
        {
          x: -1.8781639547909066,
          y: -3.9366482005399774
        },
        {
          x: -1.5502220602596566,
          y: -3.2749050364774774
        },
        {
          x: -1.1494041891659066,
          y: -2.6131618724149774
        },
        {
          x: -0.7485863180721566,
          y: -1.9514187083524774
        },
        {
          x: -0.3659874411190316,
          y: -1.2260463938993524
        },
        {
          x: 0.10770640653721841,
          y: -0.5643032298368524
        },
        {
          x: 0.5631812600528434,
          y: 0.16106908461627256
        },
        {
          x: 1.0915320901309684,
          y: 1.0264255299287726
        },
        {
          x: 1.6198829202090934,
          y: 1.6881686939912726
        },
        {
          x: 2.0935767678653434,
          y: 2.3499118580537726
        },
        {
          x: 2.5490516213809684,
          y: 3.0116550221162726
        },
        {
          x: 3.0774024514590934,
          y: 3.6097690357881476
        },
        {
          x: 3.5510962991153434,
          y: 4.195157219381898
        },
        {
          x: 4.006571152630968,
          y: 4.856900383444398
        },
        {
          x: 4.407389023724718,
          y: 5.391385246725648
        },
        {
          x: 4.735330918255968,
          y: 5.849515129538148
        },
        {
          x: 5.063272812787218,
          y: 6.256741692038148
        },
        {
          x: 5.409433701459093,
          y: 6.651242424460023
        },
        {
          x: 5.664499619427843,
          y: 7.045743156881898
        },
        {
          x: 5.992441513959093,
          y: 7.516598869772523
        },
        {
          x: 6.192850449505968,
          y: 7.847470451803773
        },
        {
          x: 6.393259385052843,
          y: 8.101987053366273
        },
        {
          x: 6.593668320599718,
          y: 8.369229485006898
        },
        {
          x: 6.721201279584093,
          y: 8.572842766256898
        },
        {
          x: 6.921610215130968,
          y: 8.763730217428773
        },
        {
          x: 7.194895127240343,
          y: 9.030972649069398
        },
        {
          x: 7.322428086224718,
          y: 9.170956779928773
        },
        {
          x: 7.522837021771593,
          y: 9.234585930319398
        },
        {
          x: 7.777902939740343,
          y: 9.298215080710023
        },
        {
          x: 7.978311875287218,
          y: 9.298215080710023
        },
        {
          x: 8.178720810834093,
          y: 9.298215080710023
        },
        {
          x: 8.452005722943468,
          y: 9.298215080710023
        }
      ],
      [
        {
          x: -4.738546034869032,
          y: 9.692715813131898
        },
        {
          x: -4.665670058306532,
          y: 9.692715813131898
        },
        {
          x: -4.538137099322157,
          y: 9.565457512350648
        },
        {
          x: -4.392385146197157,
          y: 9.425473381491273
        },
        {
          x: -4.337728163775282,
          y: 9.298215080710023
        },
        {
          x: -4.264852187212782,
          y: 9.170956779928773
        },
        {
          x: -4.137319228228407,
          y: 8.967343498678773
        },
        {
          x: -4.064443251665907,
          y: 8.840085197897523
        },
        {
          x: -3.9369102926815316,
          y: 8.636471916647523
        },
        {
          x: -3.8093773336971566,
          y: 8.432858635397523
        },
        {
          x: -3.6636253805721566,
          y: 8.178342033835023
        },
        {
          x: -3.5360924215877816,
          y: 7.911099602194398
        },
        {
          x: -3.3356834860409066,
          y: 7.643857170553773
        },
        {
          x: -3.0806175680721566,
          y: 7.249356438131898
        },
        {
          x: -2.8073326559627816,
          y: 6.842129875631898
        },
        {
          x: -2.4793907614315316,
          y: 6.320370842428773
        },
        {
          x: -2.0785728903377816,
          y: 5.722256828756898
        },
        {
          x: -1.6230980368221566,
          y: 5.124142815085023
        },
        {
          x: -1.1494041891659066,
          y: 4.398770500631898
        },
        {
          x: -0.5663963766659066,
          y: 3.6097690357881476
        },
        {
          x: -0.019826552447156587,
          y: 2.7444125904756476
        },
        {
          x: 0.6360572366153434,
          y: 1.8154269947725226
        },
        {
          x: 1.2919410256778434,
          y: 0.9627963795381476
        },
        {
          x: 1.8931678323184684,
          y: 0.09743993422564756
        },
        {
          x: 2.5490516213809684,
          y: -0.7679165110868524
        },
        {
          x: 3.1502784280215934,
          y: -1.6205471263212274
        },
        {
          x: 3.6786292580997184,
          y: -2.4222744212431024
        },
        {
          x: 4.334513047162218,
          y: -3.3512600169462274
        },
        {
          x: 4.862863877240343,
          y: -4.013003181008727
        },
        {
          x: 5.409433701459093,
          y: -4.674746345071227
        },
        {
          x: 5.864908554974718,
          y: -5.336489509133727
        },
        {
          x: 6.393259385052843,
          y: -5.921877692727477
        },
        {
          x: 6.848734238568468,
          y: -6.519991706399352
        },
        {
          x: 7.449961045209093,
          y: -7.181734870461852
        },
        {
          x: 7.850778916302843,
          y: -7.652590583352477
        },
        {
          x: 8.178720810834093,
          y: -8.047091315774352
        }
      ]
    ]
  },
  {
    name: "-",
    strokes: [
      [
        {
          x: -4.7747260199652715,
          y: 0.7359771728515625
        },
        {
          x: -4.7747260199652715,
          y: 0.7359771728515625
        },
        {
          x: -4.7747260199652715,
          y: 0.7359771728515625
        },
        {
          x: -4.7747260199652715,
          y: 0.7359771728515625
        },
        {
          x: -4.8293830023871465,
          y: 0.7359771728515625
        },
        {
          x: -4.8293830023871465,
          y: 0.6723480224609375
        },
        {
          x: -4.9022589789496465,
          y: 0.6723480224609375
        },
        {
          x: -4.9022589789496465,
          y: 0.6087188720703125
        },
        {
          x: -4.9751349555121465,
          y: 0.5450897216796875
        },
        {
          x: -4.9751349555121465,
          y: 0.5450897216796875
        },
        {
          x: -4.9751349555121465,
          y: 0.4687347412109375
        },
        {
          x: -5.0297919379340215,
          y: 0.4687347412109375
        },
        {
          x: -5.0297919379340215,
          y: 0.4051055908203125
        },
        {
          x: -5.0297919379340215,
          y: 0.4051055908203125
        },
        {
          x: -5.0297919379340215,
          y: 0.3414764404296875
        },
        {
          x: -5.0297919379340215,
          y: 0.3414764404296875
        },
        {
          x: -5.0297919379340215,
          y: 0.2778472900390625
        },
        {
          x: -5.0297919379340215,
          y: 0.2778472900390625
        },
        {
          x: -4.9751349555121465,
          y: 0.2142181396484375
        },
        {
          x: -4.9022589789496465,
          y: 0.2142181396484375
        },
        {
          x: -4.7018500434027715,
          y: 0.1378631591796875
        },
        {
          x: -4.4467841254340215,
          y: 0.1378631591796875
        },
        {
          x: -4.2463751898871465,
          y: 0.0742340087890625
        },
        {
          x: -3.9184332953558965,
          y: 0.0742340087890625
        },
        {
          x: -3.5722724066840215,
          y: 0.0106048583984375
        },
        {
          x: -3.2443305121527715,
          y: 0.0106048583984375
        },
        {
          x: -2.8435126410590215,
          y: -0.0530242919921875
        },
        {
          x: -2.3880377875433965,
          y: -0.1166534423828125
        },
        {
          x: -1.9325629340277715,
          y: -0.1166534423828125
        },
        {
          x: -1.3859931098090215,
          y: -0.1930084228515625
        },
        {
          x: -0.8576422797308965,
          y: -0.2566375732421875
        },
        {
          x: -0.27463446723089646,
          y: -0.2566375732421875
        },
        {
          x: 0.25371636284722854,
          y: -0.3202667236328125
        },
        {
          x: 0.9278191460503535,
          y: -0.3838958740234375
        },
        {
          x: 1.5108269585503535,
          y: -0.3838958740234375
        },
        {
          x: 2.2395867241753535,
          y: -0.4475250244140625
        },
        {
          x: 2.8408135308159785,
          y: -0.4475250244140625
        },
        {
          x: 3.4420403374566035,
          y: -0.4475250244140625
        },
        {
          x: 4.0432671440972285,
          y: -0.4475250244140625
        },
        {
          x: 4.6262749565972285,
          y: -0.4475250244140625
        },
        {
          x: 5.1546257866753535,
          y: -0.4475250244140625
        },
        {
          x: 5.7558525933159785,
          y: -0.4475250244140625
        },
        {
          x: 6.2842034233941035,
          y: -0.4475250244140625
        },
        {
          x: 6.6850212944878535,
          y: -0.4475250244140625
        },
        {
          x: 7.1404961480034785,
          y: -0.4475250244140625
        },
        {
          x: 7.5413140190972285,
          y: -0.4475250244140625
        },
        {
          x: 7.9421318901909785,
          y: -0.4475250244140625
        },
        {
          x: 8.342949761284729,
          y: -0.4475250244140625
        },
        {
          x: 8.743767632378479,
          y: -0.4475250244140625
        },
        {
          x: 9.071709526909729,
          y: -0.4475250244140625
        },
        {
          x: 9.399651421440979,
          y: -0.4475250244140625
        },
        {
          x: 9.727593315972229,
          y: -0.4475250244140625
        },
        {
          x: 10.128411187065979,
          y: -0.4475250244140625
        },
        {
          x: 10.583886040581604,
          y: -0.4475250244140625
        }
      ]
    ]
  },
  {
    name: "(",
    strokes: [
      [
        {
          x: 1.6316377663914068,
          y: -11.985637809656836
        },
        {
          x: 1.6316377663914068,
          y: -11.985637809656836
        },
        {
          x: 1.6316377663914068,
          y: -11.985637809656836
        },
        {
          x: 1.5587617898289068,
          y: -11.985637809656836
        },
        {
          x: 1.5041048074070318,
          y: -11.985637809656836
        },
        {
          x: 1.3583528542820318,
          y: -11.985637809656836
        },
        {
          x: 1.3036958718601568,
          y: -12.049266960047461
        },
        {
          x: 1.2308198952976568,
          y: -12.125621940516211
        },
        {
          x: 1.1579439187351568,
          y: -12.189251090906836
        },
        {
          x: 1.1032869363132818,
          y: -12.189251090906836
        },
        {
          x: 1.0304109597507818,
          y: -12.252880241297461
        },
        {
          x: 0.9757539773289068,
          y: -12.252880241297461
        },
        {
          x: 0.9028780007664068,
          y: -12.252880241297461
        },
        {
          x: 0.8300020242039068,
          y: -12.252880241297461
        },
        {
          x: 0.7753450417820318,
          y: -12.252880241297461
        },
        {
          x: 0.7024690652195318,
          y: -12.252880241297461
        },
        {
          x: 0.6295930886570318,
          y: -12.252880241297461
        },
        {
          x: 0.6295930886570318,
          y: -12.252880241297461
        },
        {
          x: 0.5749361062351568,
          y: -12.252880241297461
        },
        {
          x: 0.4474031472507818,
          y: -12.252880241297461
        },
        {
          x: 0.3745271706882818,
          y: -12.252880241297461
        },
        {
          x: 0.3016511941257818,
          y: -12.252880241297461
        },
        {
          x: 0.17411823514140679,
          y: -12.125621940516211
        },
        {
          x: 0.10124225857890679,
          y: -11.922008659266211
        },
        {
          x: -0.026290700405468215,
          y: -11.654766227625586
        },
        {
          x: -0.15382365938984321,
          y: -11.387523795984961
        },
        {
          x: -0.2813566183742182,
          y: -10.993023063563086
        },
        {
          x: -0.4271085714992182,
          y: -10.598522331141211
        },
        {
          x: -0.5546415304835932,
          y: -10.127666618250586
        },
        {
          x: -0.7550504660304682,
          y: -9.605907585047461
        },
        {
          x: -0.8825834250148432,
          y: -9.007793571375586
        },
        {
          x: -1.0829923605617182,
          y: -8.409679557703711
        },
        {
          x: -1.2834012961085932,
          y: -7.684307243250586
        },
        {
          x: -1.4109342550929682,
          y: -6.958934928797461
        },
        {
          x: -1.6113431906398432,
          y: -6.157207633875586
        },
        {
          x: -1.7388761496242182,
          y: -5.368206169031836
        },
        {
          x: -1.9392850851710932,
          y: -4.502849723719336
        },
        {
          x: -2.085037038296093,
          y: -3.6502191084849613
        },
        {
          x: -2.212569997280468,
          y: -2.6576043623912113
        },
        {
          x: -2.340102956264843,
          y: -1.7922479170787113
        },
        {
          x: -2.412978932827343,
          y: -0.8632623213755863
        },
        {
          x: -2.467635915249218,
          y: -0.010631706141211339
        },
        {
          x: -2.540511891811718,
          y: 0.8547247391712887
        },
        {
          x: -2.540511891811718,
          y: 1.7200811844837887
        },
        {
          x: -2.540511891811718,
          y: 2.7126959305775387
        },
        {
          x: -2.540511891811718,
          y: 3.5016973954212887
        },
        {
          x: -2.540511891811718,
          y: 4.303424690343164
        },
        {
          x: -2.540511891811718,
          y: 5.028797004796289
        },
        {
          x: -2.540511891811718,
          y: 5.754169319249414
        },
        {
          x: -2.467635915249218,
          y: 6.479541633702539
        },
        {
          x: -2.340102956264843,
          y: 7.344898079015039
        },
        {
          x: -2.139694020717968,
          y: 7.943012092686914
        },
        {
          x: -1.9392850851710932,
          y: 8.604755256749414
        },
        {
          x: -1.6842191672023432,
          y: 9.266498420811914
        },
        {
          x: -1.4109342550929682,
          y: 9.864612434483789
        },
        {
          x: -1.1558683371242182,
          y: 10.450000618077539
        },
        {
          x: -0.8279264425929682,
          y: 11.188098762608789
        },
        {
          x: -0.5546415304835932,
          y: 11.709857795811914
        },
        {
          x: -0.2813566183742182,
          y: 12.180713508702539
        },
        {
          x: -0.09916667696796821,
          y: 12.638843391515039
        },
        {
          x: 0.17411823514140679,
          y: 13.096973274327539
        },
        {
          x: 0.4474031472507818,
          y: 13.427844856358789
        },
        {
          x: 0.7024690652195318,
          y: 13.898700569249414
        },
        {
          x: 0.9028780007664068,
          y: 14.229572151280664
        },
        {
          x: 1.1032869363132818,
          y: 14.420459602452539
        },
        {
          x: 1.3036958718601568,
          y: 14.624072883702539
        },
        {
          x: 1.4312288308445318,
          y: 14.827686164952539
        },
        {
          x: 1.6316377663914068,
          y: 14.954944465733789
        },
        {
          x: 1.8320467019382818,
          y: 15.158557746983789
        },
        {
          x: 1.9595796609226568,
          y: 15.222186897374414
        },
        {
          x: 2.032455637485157,
          y: 15.285816047765039
        },
        {
          x: 2.159988596469532,
          y: 15.285816047765039
        },
        {
          x: 2.232864573032032,
          y: 15.285816047765039
        },
        {
          x: 2.360397532016407,
          y: 15.285816047765039
        },
        {
          x: 2.487930491000782,
          y: 15.285816047765039
        },
        {
          x: 2.560806467563282,
          y: 15.285816047765039
        },
        {
          x: 2.688339426547657,
          y: 15.285816047765039
        },
        {
          x: 2.815872385532032,
          y: 15.285816047765039
        },
        {
          x: 2.961624338657032,
          y: 15.285816047765039
        }
      ]
    ]
  },
  {
    name: ")",
    strokes: [
      [
        {
          x: -2.8000316619873047,
          y: -6.7436957359313965
        },
        {
          x: -2.8000316619873047,
          y: -6.7436957359313965
        },
        {
          x: -2.8000316619873047,
          y: -6.7436957359313965
        },
        {
          x: -2.8000316619873047,
          y: -6.8073248863220215
        },
        {
          x: -2.7271556854248047,
          y: -6.9473090171813965
        },
        {
          x: -2.7271556854248047,
          y: -7.0109381675720215
        },
        {
          x: -2.7271556854248047,
          y: -7.0745673179626465
        },
        {
          x: -2.6542797088623047,
          y: -7.1381964683532715
        },
        {
          x: -2.6542797088623047,
          y: -7.2018256187438965
        },
        {
          x: -2.6542797088623047,
          y: -7.2781805992126465
        },
        {
          x: -2.6542797088623047,
          y: -7.4054388999938965
        },
        {
          x: -2.6542797088623047,
          y: -7.4690680503845215
        },
        {
          x: -2.6542797088623047,
          y: -7.5326972007751465
        },
        {
          x: -2.5996227264404297,
          y: -7.6090521812438965
        },
        {
          x: -2.5996227264404297,
          y: -7.6726813316345215
        },
        {
          x: -2.5996227264404297,
          y: -7.7363104820251465
        },
        {
          x: -2.5267467498779297,
          y: -7.7999396324157715
        },
        {
          x: -2.5267467498779297,
          y: -7.8635687828063965
        },
        {
          x: -2.4538707733154297,
          y: -7.9399237632751465
        },
        {
          x: -2.4538707733154297,
          y: -8.003552913665771
        },
        {
          x: -2.3992137908935547,
          y: -8.003552913665771
        },
        {
          x: -2.3263378143310547,
          y: -8.003552913665771
        },
        {
          x: -2.2716808319091797,
          y: -8.067182064056396
        },
        {
          x: -2.1259288787841797,
          y: -8.067182064056396
        },
        {
          x: -1.9255199432373047,
          y: -8.067182064056396
        },
        {
          x: -1.7979869842529297,
          y: -8.067182064056396
        },
        {
          x: -1.5429210662841797,
          y: -8.067182064056396
        },
        {
          x: -1.2696361541748047,
          y: -7.7999396324157715
        },
        {
          x: -1.0145702362060547,
          y: -7.4690680503845215
        },
        {
          x: -0.6684093475341797,
          y: -7.0745673179626465
        },
        {
          x: -0.2858104705810547,
          y: -6.5400824546813965
        },
        {
          x: 0.11500740051269531,
          y: -5.9546942710876465
        },
        {
          x: 0.5887012481689453,
          y: -5.2929511070251465
        },
        {
          x: 1.1170520782470703,
          y: -4.4912238121032715
        },
        {
          x: 1.5178699493408203,
          y: -3.6385931968688965
        },
        {
          x: 1.9733448028564453,
          y: -2.7732367515563965
        },
        {
          x: 2.3741626739501953,
          y: -1.7806220054626465
        },
        {
          x: 2.7749805450439453,
          y: -0.7880072593688965
        },
        {
          x: 3.1575794219970703,
          y: 0.2682366371154785
        },
        {
          x: 3.5037403106689453,
          y: 1.4008355140686035
        },
        {
          x: 3.7588062286376953,
          y: 2.4570794105529785
        },
        {
          x: 3.9592151641845703,
          y: 3.4496941566467285
        },
        {
          x: 4.159624099731445,
          y: 4.4423089027404785
        },
        {
          x: 4.232500076293945,
          y: 5.3712944984436035
        },
        {
          x: 4.28715705871582,
          y: 6.3002800941467285
        },
        {
          x: 4.28715705871582,
          y: 7.2928948402404785
        },
        {
          x: 4.28715705871582,
          y: 8.081896305084229
        },
        {
          x: 4.28715705871582,
          y: 8.807268619537354
        },
        {
          x: 4.232500076293945,
          y: 9.469011783599854
        },
        {
          x: 3.8863391876220703,
          y: 10.130754947662354
        },
        {
          x: 3.5583972930908203,
          y: 10.792498111724854
        },
        {
          x: 3.1029224395751953,
          y: 11.530596256256104
        },
        {
          x: 2.7021045684814453,
          y: 11.988726139068604
        },
        {
          x: 2.1737537384033203,
          y: 12.523211002349854
        },
        {
          x: 1.7000598907470703,
          y: 12.981340885162354
        },
        {
          x: 1.2445850372314453,
          y: 13.375841617584229
        },
        {
          x: 0.8437671661376953,
          y: 13.783068180084229
        },
        {
          x: 0.3882923126220703,
          y: 14.177568912506104
        },
        {
          x: -0.012525558471679688,
          y: 14.444811344146729
        },
        {
          x: -0.2858104705810547,
          y: 14.572069644927979
        },
        {
          x: -0.5408763885498047,
          y: 14.699327945709229
        },
        {
          x: -0.7412853240966797,
          y: 14.775682926177979
        },
        {
          x: -0.8688182830810547,
          y: 14.775682926177979
        },
        {
          x: -1.0692272186279297,
          y: 14.775682926177979
        }
      ]
    ]
  },
  {
    name: "/",
    strokes: [
      [
        {
          x: 3.1423132944915437,
          y: -6.094594147245758
        },
        {
          x: 3.1969702769134187,
          y: -6.094594147245758
        },
        {
          x: 3.3427222300384187,
          y: -6.094594147245758
        },
        {
          x: 3.4702551890227937,
          y: -6.094594147245758
        },
        {
          x: 3.5977881480071687,
          y: -6.094594147245758
        },
        {
          x: 3.7435401011321687,
          y: -6.094594147245758
        },
        {
          x: 3.7981970835540437,
          y: -6.094594147245758
        },
        {
          x: 3.9257300425384187,
          y: -6.094594147245758
        },
        {
          x: 3.9986060191009187,
          y: -6.094594147245758
        },
        {
          x: 4.071481995663419,
          y: -6.158223297636383
        },
        {
          x: 4.126138978085294,
          y: -6.158223297636383
        },
        {
          x: 4.199014954647794,
          y: -6.158223297636383
        },
        {
          x: 4.199014954647794,
          y: -6.221852448027008
        },
        {
          x: 4.199014954647794,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.271890931210294,
          y: -6.221852448027008
        },
        {
          x: 4.126138978085294,
          y: -6.094594147245758
        },
        {
          x: 3.9257300425384187,
          y: -5.890980865995758
        },
        {
          x: 3.7981970835540437,
          y: -5.623738434355133
        },
        {
          x: 3.5977881480071687,
          y: -5.356496002714508
        },
        {
          x: 3.3973792124602937,
          y: -5.025624420683258
        },
        {
          x: 3.1423132944915437,
          y: -4.631123688261383
        },
        {
          x: 2.8143713999602937,
          y: -4.172993805448883
        },
        {
          x: 2.4864295054290437,
          y: -3.6385089421676327
        },
        {
          x: 2.0856116343352937,
          y: -2.9767657781051327
        },
        {
          x: 1.6119177866790437,
          y: -2.3150226140426327
        },
        {
          x: 1.1564429331634187,
          y: -1.5896502995895077
        },
        {
          x: 0.6280921030852937,
          y: -0.7242938542770077
        },
        {
          x: 0.02686529644466873,
          y: 0.12833676095736735
        },
        {
          x: -0.5743615101959563,
          y: 1.0573223566604923
        },
        {
          x: -1.3031212758209563,
          y: 2.1135662531448673
        },
        {
          x: -1.9590050648834563,
          y: 3.1061809992386173
        },
        {
          x: -2.6148888539459563,
          y: 4.098795745332367
        },
        {
          x: -3.2889916371490813,
          y: 5.167765471894867
        },
        {
          x: -4.017751402774081,
          y: 6.096751067597992
        },
        {
          x: -4.746511168399081,
          y: 7.152994964082367
        },
        {
          x: -5.274861998477206,
          y: 8.005625579316742
        },
        {
          x: -5.803212828555331,
          y: 8.743723723847992
        },
        {
          x: -6.258687682070956,
          y: 9.469096038301117
        },
        {
          x: -6.659505553164706,
          y: 10.067210051972992
        },
        {
          x: -6.987447447695956,
          y: 10.525339934785492
        },
        {
          x: -7.388265318789706,
          y: 11.123453948457367
        },
        {
          x: -7.588674254336581,
          y: 11.454325530488617
        },
        {
          x: -7.716207213320956,
          y: 11.721567962129242
        },
        {
          x: -7.843740172305331,
          y: 11.912455413301117
        },
        {
          x: -7.989492125430331,
          y: 12.116068694551117
        },
        {
          x: -8.044149107852206,
          y: 12.243326995332367
        },
        {
          x: -8.117025084414706,
          y: 12.383311126191742
        },
        {
          x: -8.117025084414706,
          y: 12.446940276582367
        },
        {
          x: -8.117025084414706,
          y: 12.446940276582367
        },
        {
          x: -8.117025084414706,
          y: 12.446940276582367
        }
      ]
    ]
  },
  {
    name: "5",
    strokes: [
      [
        {
          x: -2.491489235414292,
          y: -5.318813218982939
        },
        {
          x: -2.491489235414292,
          y: -5.446071519764189
        },
        {
          x: -2.491489235414292,
          y: -5.649684801014189
        },
        {
          x: -2.418613258851792,
          y: -5.840572252186064
        },
        {
          x: -2.363956276429917,
          y: -6.044185533436064
        },
        {
          x: -2.363956276429917,
          y: -6.171443834217314
        },
        {
          x: -2.291080299867417,
          y: -6.375057115467314
        },
        {
          x: -2.291080299867417,
          y: -6.502315416248564
        },
        {
          x: -2.218204323304917,
          y: -6.642299547107939
        },
        {
          x: -2.218204323304917,
          y: -6.705928697498564
        },
        {
          x: -2.163547340883042,
          y: -6.833186998279814
        },
        {
          x: -2.163547340883042,
          y: -6.909541978748564
        },
        {
          x: -2.163547340883042,
          y: -6.973171129139189
        },
        {
          x: -2.163547340883042,
          y: -7.036800279529814
        },
        {
          x: -2.163547340883042,
          y: -7.036800279529814
        },
        {
          x: -2.163547340883042,
          y: -7.036800279529814
        },
        {
          x: -2.163547340883042,
          y: -7.036800279529814
        },
        {
          x: -2.163547340883042,
          y: -6.769557847889189
        },
        {
          x: -2.218204323304917,
          y: -6.438686265857939
        },
        {
          x: -2.418613258851792,
          y: -5.980556383045439
        },
        {
          x: -2.619022194398667,
          y: -5.446071519764189
        },
        {
          x: -2.819431129945542,
          y: -4.847957506092314
        },
        {
          x: -3.092716042054917,
          y: -4.249843492420439
        },
        {
          x: -3.293124977601792,
          y: -3.664455308826689
        },
        {
          x: -3.420657936586167,
          y: -3.066341295154814
        },
        {
          x: -3.621066872133042,
          y: -2.531856431873564
        },
        {
          x: -3.748599831117417,
          y: -1.933742418201689
        },
        {
          x: -3.821475807679917,
          y: -1.475612535389189
        },
        {
          x: -3.876132790101792,
          y: -0.9411276721079389
        },
        {
          x: -3.876132790101792,
          y: -0.4829977892954389
        },
        {
          x: -3.876132790101792,
          y: -0.0884970568735639
        },
        {
          x: -3.876132790101792,
          y: 0.2423745251576861
        },
        {
          x: -3.748599831117417,
          y: 0.5732461071889361
        },
        {
          x: -3.347781960023667,
          y: 0.8404885388295611
        },
        {
          x: -2.819431129945542,
          y: 1.171360120860811
        },
        {
          x: -2.163547340883042,
          y: 1.374973402110811
        },
        {
          x: -1.4347875752580421,
          y: 1.565860853282686
        },
        {
          x: -0.6331518330705421,
          y: 1.833103284923311
        },
        {
          x: 0.22314089153883288,
          y: 2.036716566173311
        },
        {
          x: 1.2251855692732079,
          y: 2.367588148204561
        },
        {
          x: 2.081478293882583,
          y: 2.634830579845186
        },
        {
          x: 2.864895041929458,
          y: 2.965702161876436
        },
        {
          x: 3.739406760679458,
          y: 3.296573743907686
        },
        {
          x: 4.395290549741958,
          y: 3.691074476329561
        },
        {
          x: 5.051174338804458,
          y: 4.085575208751436
        },
        {
          x: 5.725277122007583,
          y: 4.543705091563936
        },
        {
          x: 6.107875998960708,
          y: 5.014560804454561
        },
        {
          x: 6.381160911070083,
          y: 5.472690687267061
        },
        {
          x: 6.581569846616958,
          y: 5.943546400157686
        },
        {
          x: 6.654445823179458,
          y: 6.465305433360811
        },
        {
          x: 6.654445823179458,
          y: 6.999790296642061
        },
        {
          x: 6.654445823179458,
          y: 7.597904310313936
        },
        {
          x: 6.654445823179458,
          y: 8.056034193126436
        },
        {
          x: 6.308284934507583,
          y: 8.590519056407686
        },
        {
          x: 5.852810080991958,
          y: 9.048648939220186
        },
        {
          x: 5.251583274351333,
          y: 9.519504652110811
        },
        {
          x: 4.668575461851333,
          y: 9.977634534923311
        },
        {
          x: 3.994472678648208,
          y: 10.435764417735811
        },
        {
          x: 3.265712913023208,
          y: 10.842990980235811
        },
        {
          x: 2.536953147398208,
          y: 11.237491712657686
        },
        {
          x: 1.7535363993513329,
          y: 11.568363294688936
        },
        {
          x: 0.9519006571638329,
          y: 11.962864027110811
        },
        {
          x: 0.15026491497633288,
          y: 12.230106458751436
        },
        {
          x: -0.7060278096330421,
          y: 12.560978040782686
        },
        {
          x: -1.3619115986955421,
          y: 12.751865491954561
        },
        {
          x: -2.036014381898667,
          y: 12.955478773204561
        },
        {
          x: -2.691898170961167,
          y: 13.019107923595186
        },
        {
          x: -3.220249001039292,
          y: 13.082737073985811
        },
        {
          x: -3.748599831117417,
          y: 13.082737073985811
        },
        {
          x: -4.349826637758042,
          y: 13.082737073985811
        },
        {
          x: -4.677768532289292,
          y: 13.082737073985811
        },
        {
          x: -4.951053444398667,
          y: 12.955478773204561
        },
        {
          x: -5.133243385804917,
          y: 12.560978040782686
        },
        {
          x: -5.206119362367417,
          y: 12.026493177501436
        },
        {
          x: -5.206119362367417,
          y: 11.428379163829561
        },
        {
          x: -5.206119362367417,
          y: 10.703006849376436
        },
        {
          x: -5.206119362367417,
          y: 10.041263685313936
        },
        {
          x: -5.206119362367417,
          y: 9.252262220470186
        }
      ],
      [
        {
          x: -1.6898534932267921,
          y: -6.171443834217314
        },
        {
          x: -1.6898534932267921,
          y: -6.375057115467314
        },
        {
          x: -1.6898534932267921,
          y: -6.578670396717314
        },
        {
          x: -1.6898534932267921,
          y: -6.769557847889189
        },
        {
          x: -1.6898534932267921,
          y: -6.973171129139189
        },
        {
          x: -1.6898534932267921,
          y: -7.100429429920439
        },
        {
          x: -1.6898534932267921,
          y: -7.304042711170439
        },
        {
          x: -1.7627294697892921,
          y: -7.367671861561064
        },
        {
          x: -1.7627294697892921,
          y: -7.431301011951689
        },
        {
          x: -1.7627294697892921,
          y: -7.494930162342314
        },
        {
          x: -1.7627294697892921,
          y: -7.494930162342314
        },
        {
          x: -1.7627294697892921,
          y: -7.494930162342314
        },
        {
          x: -1.7627294697892921,
          y: -7.494930162342314
        },
        {
          x: -1.7627294697892921,
          y: -7.494930162342314
        },
        {
          x: -1.5623205342424171,
          y: -7.494930162342314
        },
        {
          x: -1.1615026631486671,
          y: -7.367671861561064
        },
        {
          x: -0.7060278096330421,
          y: -7.164058580311064
        },
        {
          x: -0.10480100299241712,
          y: -6.973171129139189
        },
        {
          x: 0.5510827860700829,
          y: -6.769557847889189
        },
        {
          x: 1.2798425516950829,
          y: -6.642299547107939
        },
        {
          x: 2.081478293882583,
          y: -6.438686265857939
        },
        {
          x: 3.010646995054458,
          y: -6.311427965076689
        },
        {
          x: 3.939815696226333,
          y: -6.171443834217314
        },
        {
          x: 5.051174338804458,
          y: -6.107814683826689
        },
        {
          x: 6.107875998960708,
          y: -6.044185533436064
        },
        {
          x: 7.237453635679458,
          y: -6.044185533436064
        },
        {
          x: 8.367031272398208,
          y: -6.044185533436064
        },
        {
          x: 9.551265891538833,
          y: -6.044185533436064
        },
        {
          x: 10.680843528257583,
          y: -6.044185533436064
        },
        {
          x: 11.883297141538833,
          y: -6.044185533436064
        },
        {
          x: 12.812465842710708,
          y: -6.044185533436064
        }
      ]
    ]
  }
];
var WritingRecognizerChars_default = strokes;

// app/recognizers/WritingRecognizer.js
var WritingRecognizer = class {
  constructor() {
    this.qdollar = new qdollar_default();
    WritingRecognizerChars_default.forEach((gesture) => {
      this.qdollar.AddGestureLoad(gesture.name, gesture.strokes);
    });
  }
  recognize(strokes2) {
    const r = this.qdollar.RecognizeStrokes(strokes2);
    const isNumeric2 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].indexOf(r.Name) > -1;
    r.isNumeric = isNumeric2;
    return r;
  }
  addGesture(name, strokes2) {
    this.qdollar.AddGestureStrokes(name, strokes2);
    let gesture = {
      name,
      strokes: strokes2.map((points2) => {
        return points2.map((pt) => {
          return {x: pt.x, y: pt.y};
        });
      })
    };
    let total = gesture.strokes.reduce((acc, st) => {
      return vec_default.add(st.reduce((acc2, v) => vec_default.add(acc2, v), vec_default(0, 0)), acc);
    }, vec_default(0, 0));
    let totalLen = gesture.strokes.reduce((acc, st) => acc + st.length, 0);
    let midPoint = vec_default.divS(total, totalLen);
    gesture.strokes = gesture.strokes.map((st) => {
      return st.map((pt) => vec_default.sub(pt, midPoint));
    });
    WritingRecognizerChars_default.push(gesture);
  }
  printGestures() {
    console.log(JSON.stringify(WritingRecognizerChars_default));
  }
};
var WritingRecognizer_default = WritingRecognizer;

// app/meta/WritingCell.js
var writingRecognizer = new WritingRecognizer_default();
var WritingCell = class extends GameObject {
  constructor() {
    super(...arguments);
    this.width = 24;
    this.height = 30;
    this.position = {x: 100, y: 100};
    this.timer = null;
    this.stringValue = "";
    this.svgCell = Svg_default.add("rect", Svg_default.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "formula-editor-cell"
    });
  }
  render(dt, t) {
    if (this.timer) {
      this.timer -= dt;
      if (this.timer < 0) {
        this.recognizeStrokes();
        this.timer = null;
      }
    }
    Svg_default.update(this.svgCell, {
      x: this.position.x,
      y: this.position.y,
      width: this.width
    });
  }
  captureStroke(stroke) {
    this.adopt(stroke);
    this.timer = 0.5;
  }
  recognizeStrokes() {
    const strokes2 = this.findAll({what: aStroke}).map((s) => s.points);
    if (strokes2.length === 0) {
      return;
    }
    const result = writingRecognizer.recognize(strokes2);
    this.stringValue = result.Name;
    this.children.forEach((child) => {
      child.remove();
    });
  }
  distanceToPoint(point) {
    return signedDistanceToBox(this.position.x, this.position.y, this.width, this.height, point.x, point.y);
  }
  remove() {
    this.svgCell.remove();
    for (const child of this.children) {
      child.remove();
    }
    super.remove();
  }
};
var WritingCell_default = WritingCell;
var aWritingCell = (gameObj) => gameObj instanceof WritingCell ? gameObj : null;

// lib/bounding_box.js
function boundingBoxFromStrokes(strokes2) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes2) {
    for (const pt of stroke) {
      if (pt.x < minX) {
        minX = pt.x;
      }
      if (pt.x > maxX) {
        maxX = pt.x;
      }
      if (pt.y < minY) {
        minY = pt.y;
      }
      if (pt.y > maxY) {
        maxY = pt.y;
      }
    }
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// app/meta/LabelToken.js
var LabelToken = class extends Token_default {
  constructor(label, source) {
    super(source);
    this.label = label;
    this.id = generateId();
    this.lastRenderedValue = "";
    this.boxElement = Svg_default.add("rect", Svg_default.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "label-box"
    });
    this.textElement = Svg_default.add("text", Svg_default.metaElm, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      class: "label-text"
    });
    this.strokeElements = [];
    if (typeof label.display === "string") {
      const content = label.display;
      if (content !== this.lastRenderedValue) {
        this.lastRenderedValue = content;
        Svg_default.update(this.textElement, {content});
        this.width = this.textElement.getComputedTextLength() + 10;
      }
    } else {
      for (const stroke of label.display) {
        const strokeElement = Svg_default.add("polyline", Svg_default.labelElm, {
          class: "label-stroke",
          points: Svg_default.points(stroke),
          transform: Svg_default.positionToTransform(this.position)
        });
        this.strokeElements.push(strokeElement);
      }
      const bb = boundingBoxFromStrokes(label.display);
      const leftPadding = bb.minX;
      this.width = bb.width + leftPadding * 2;
    }
    Svg_default.update(this.boxElement, {width: this.width});
    this.wirePort = this.adopt(new WirePort(this.position, this.label));
  }
  isPrimary() {
    return true;
  }
  render() {
    Svg_default.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      "is-hidden": this.hidden
    });
    Svg_default.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      "is-hidden": this.hidden
    });
    for (const strokeElement of this.strokeElements) {
      Svg_default.update(strokeElement, {
        transform: Svg_default.positionToTransform(this.position),
        "is-hidden": this.hidden
      });
    }
    this.wirePort.position = this.midPoint();
  }
  getVariable() {
    return this.label.variable;
  }
};
var LabelToken_default = LabelToken;
var aLabelToken = (gameObj) => gameObj instanceof LabelToken ? gameObj : null;

// app/meta/PropertyPicker.js
var TAB_SIZE = 5;
function PropertyPickerPath(pos, w, h) {
  return `
    M ${pos.x + TAB_SIZE} ${pos.y}
    L ${pos.x + w} ${pos.y}
    L ${pos.x + w} ${pos.y + h}
    L ${pos.x + TAB_SIZE} ${pos.y + h}
    L ${pos.x} ${pos.y + h / 2}
    L ${pos.x + TAB_SIZE} ${pos.y}
  `;
}
var PropertyPicker = class extends Token_default {
  constructor() {
    super(...arguments);
    this.id = generateId();
    this.lastRenderedValue = "";
    this.boxElement = Svg_default.add("path", Svg_default.metaElm, {
      d: PropertyPickerPath(this.position, this.width, this.height),
      class: "property-picker-box"
    });
    this.textElement = Svg_default.add("text", Svg_default.metaElm, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21,
      class: "property-picker-text"
    });
    this.inputVariable = new MetaStruct([]);
    this.inputPort = this.adopt(new WirePort(this.position, this.inputVariable));
    this.outputVariable = new MetaNumber(variable());
    this.wirePort = this.adopt(new WirePort(this.position, this.outputVariable));
    this.property = null;
    this.internalConnection = null;
  }
  isPrimary() {
    return true;
  }
  getVariable() {
    return this.outputVariable.variable;
  }
  render() {
    const content = this.property?.display;
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content;
      Svg_default.update(this.textElement, {content});
      this.width = this.textElement.getComputedTextLength() + 10 + TAB_SIZE;
    }
    Svg_default.update(this.boxElement, {
      d: PropertyPickerPath(this.position, this.width, this.height),
      "is-embedded": this.embedded
    });
    Svg_default.update(this.textElement, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21
    });
    this.inputPort.position = vec_default.add(this.position, vec_default(0, this.height / 2));
    this.wirePort.position = this.midPoint();
  }
  setProperty(newValue) {
    this.property = newValue;
    this.update();
  }
  update() {
    if (!this.property) {
      return;
    }
    this.internalConnection = new MetaNumberConnection(this.property, this.outputVariable);
  }
  remove() {
    this.boxElement.remove();
    this.textElement.remove();
    super.remove();
  }
};
var PropertyPicker_default = PropertyPicker;
var aPropertyPicker = (gameObj) => gameObj instanceof PropertyPicker ? gameObj : null;

// _snowpack/pkg/ohm-js.js
function abstract(optMethodName) {
  const methodName = optMethodName || "";
  return function() {
    throw new Error("this method " + methodName + " is abstract! (it has no implementation in class " + this.constructor.name + ")");
  };
}
function assert(cond, message) {
  if (!cond) {
    throw new Error(message || "Assertion failed");
  }
}
function defineLazyProperty(obj, propName, getterFn) {
  let memo;
  Object.defineProperty(obj, propName, {
    get() {
      if (!memo) {
        memo = getterFn.call(this);
      }
      return memo;
    }
  });
}
function clone(obj) {
  if (obj) {
    return Object.assign({}, obj);
  }
  return obj;
}
function repeatFn(fn, n) {
  const arr = [];
  while (n-- > 0) {
    arr.push(fn());
  }
  return arr;
}
function repeatStr(str, n) {
  return new Array(n + 1).join(str);
}
function repeat(x, n) {
  return repeatFn(() => x, n);
}
function getDuplicates(array) {
  const duplicates = [];
  for (let idx = 0; idx < array.length; idx++) {
    const x = array[idx];
    if (array.lastIndexOf(x) !== idx && duplicates.indexOf(x) < 0) {
      duplicates.push(x);
    }
  }
  return duplicates;
}
function copyWithoutDuplicates(array) {
  const noDuplicates = [];
  array.forEach((entry) => {
    if (noDuplicates.indexOf(entry) < 0) {
      noDuplicates.push(entry);
    }
  });
  return noDuplicates;
}
function isSyntactic(ruleName) {
  const firstChar = ruleName[0];
  return firstChar === firstChar.toUpperCase();
}
function isLexical(ruleName) {
  return !isSyntactic(ruleName);
}
function padLeft(str, len, optChar) {
  const ch = optChar || " ";
  if (str.length < len) {
    return repeatStr(ch, len - str.length) + str;
  }
  return str;
}
function StringBuffer() {
  this.strings = [];
}
StringBuffer.prototype.append = function(str) {
  this.strings.push(str);
};
StringBuffer.prototype.contents = function() {
  return this.strings.join("");
};
var escapeUnicode = (str) => String.fromCodePoint(parseInt(str, 16));
function unescapeCodePoint(s) {
  if (s.charAt(0) === "\\") {
    switch (s.charAt(1)) {
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "	";
      case "v":
        return "\v";
      case "x":
        return escapeUnicode(s.slice(2, 4));
      case "u":
        return s.charAt(2) === "{" ? escapeUnicode(s.slice(3, -1)) : escapeUnicode(s.slice(2, 6));
      default:
        return s.charAt(1);
    }
  } else {
    return s;
  }
}
function unexpectedObjToString(obj) {
  if (obj == null) {
    return String(obj);
  }
  const baseToString = Object.prototype.toString.call(obj);
  try {
    let typeName;
    if (obj.constructor && obj.constructor.name) {
      typeName = obj.constructor.name;
    } else if (baseToString.indexOf("[object ") === 0) {
      typeName = baseToString.slice(8, -1);
    } else {
      typeName = typeof obj;
    }
    return typeName + ": " + JSON.stringify(String(obj));
  } catch (e) {
    return baseToString;
  }
}
var common = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  abstract,
  assert,
  defineLazyProperty,
  clone,
  repeatFn,
  repeatStr,
  repeat,
  getDuplicates,
  copyWithoutDuplicates,
  isSyntactic,
  isLexical,
  padLeft,
  StringBuffer,
  unescapeCodePoint,
  unexpectedObjToString
});
var UnicodeCategories = {
  Lu: /\p{Lu}/u,
  Ll: /\p{Ll}/u,
  Lt: /\p{Lt}/u,
  Lm: /\p{Lm}/u,
  Lo: /\p{Lo}/u,
  Nl: /\p{Nl}/u,
  Nd: /\p{Nd}/u,
  Mn: /\p{Mn}/u,
  Mc: /\p{Mc}/u,
  Pc: /\p{Pc}/u,
  Zs: /\p{Zs}/u,
  L: /\p{Letter}/u,
  Ltmo: /\p{Lt}|\p{Lm}|\p{Lo}/u
};
var PExpr = class {
  constructor() {
    if (this.constructor === PExpr) {
      throw new Error("PExpr cannot be instantiated -- it's abstract");
    }
  }
  withSource(interval) {
    if (interval) {
      this.source = interval.trimmed();
    }
    return this;
  }
};
var any = Object.create(PExpr.prototype);
var end = Object.create(PExpr.prototype);
var Terminal = class extends PExpr {
  constructor(obj) {
    super();
    this.obj = obj;
  }
};
var Range = class extends PExpr {
  constructor(from, to) {
    super();
    this.from = from;
    this.to = to;
    this.matchCodePoint = from.length > 1 || to.length > 1;
  }
};
var Param = class extends PExpr {
  constructor(index) {
    super();
    this.index = index;
  }
};
var Alt = class extends PExpr {
  constructor(terms) {
    super();
    this.terms = terms;
  }
};
var Extend = class extends Alt {
  constructor(superGrammar, name, body) {
    const origBody = superGrammar.rules[name].body;
    super([body, origBody]);
    this.superGrammar = superGrammar;
    this.name = name;
    this.body = body;
  }
};
var Splice = class extends Alt {
  constructor(superGrammar, ruleName, beforeTerms, afterTerms) {
    const origBody = superGrammar.rules[ruleName].body;
    super([...beforeTerms, origBody, ...afterTerms]);
    this.superGrammar = superGrammar;
    this.ruleName = ruleName;
    this.expansionPos = beforeTerms.length;
  }
};
var Seq = class extends PExpr {
  constructor(factors) {
    super();
    this.factors = factors;
  }
};
var Iter = class extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
};
var Star = class extends Iter {
};
var Plus = class extends Iter {
};
var Opt = class extends Iter {
};
Star.prototype.operator = "*";
Plus.prototype.operator = "+";
Opt.prototype.operator = "?";
Star.prototype.minNumMatches = 0;
Plus.prototype.minNumMatches = 1;
Opt.prototype.minNumMatches = 0;
Star.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
Plus.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
Opt.prototype.maxNumMatches = 1;
var Not = class extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
};
var Lookahead = class extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
};
var Lex = class extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
};
var Apply = class extends PExpr {
  constructor(ruleName, args = []) {
    super();
    this.ruleName = ruleName;
    this.args = args;
  }
  isSyntactic() {
    return isSyntactic(this.ruleName);
  }
  toMemoKey() {
    if (!this._memoKey) {
      Object.defineProperty(this, "_memoKey", {value: this.toString()});
    }
    return this._memoKey;
  }
};
var UnicodeChar = class extends PExpr {
  constructor(category) {
    super();
    this.category = category;
    this.pattern = UnicodeCategories[category];
  }
};
function createError(message, optInterval) {
  let e;
  if (optInterval) {
    e = new Error(optInterval.getLineAndColumnMessage() + message);
    e.shortMessage = message;
    e.interval = optInterval;
  } else {
    e = new Error(message);
  }
  return e;
}
function intervalSourcesDontMatch() {
  return createError("Interval sources don't match");
}
function grammarSyntaxError(matchFailure) {
  const e = new Error();
  Object.defineProperty(e, "message", {
    enumerable: true,
    get() {
      return matchFailure.message;
    }
  });
  Object.defineProperty(e, "shortMessage", {
    enumerable: true,
    get() {
      return "Expected " + matchFailure.getExpectedText();
    }
  });
  e.interval = matchFailure.getInterval();
  return e;
}
function undeclaredGrammar(grammarName, namespace, interval) {
  const message = namespace ? `Grammar ${grammarName} is not declared in namespace '${namespace}'` : "Undeclared grammar " + grammarName;
  return createError(message, interval);
}
function duplicateGrammarDeclaration(grammar2, namespace) {
  return createError("Grammar " + grammar2.name + " is already declared in this namespace");
}
function grammarDoesNotSupportIncrementalParsing(grammar2) {
  return createError(`Grammar '${grammar2.name}' does not support incremental parsing`);
}
function undeclaredRule(ruleName, grammarName, optInterval) {
  return createError("Rule " + ruleName + " is not declared in grammar " + grammarName, optInterval);
}
function cannotOverrideUndeclaredRule(ruleName, grammarName, optSource) {
  return createError("Cannot override rule " + ruleName + " because it is not declared in " + grammarName, optSource);
}
function cannotExtendUndeclaredRule(ruleName, grammarName, optSource) {
  return createError("Cannot extend rule " + ruleName + " because it is not declared in " + grammarName, optSource);
}
function duplicateRuleDeclaration(ruleName, grammarName, declGrammarName, optSource) {
  let message = "Duplicate declaration for rule '" + ruleName + "' in grammar '" + grammarName + "'";
  if (grammarName !== declGrammarName) {
    message += " (originally declared in '" + declGrammarName + "')";
  }
  return createError(message, optSource);
}
function wrongNumberOfParameters(ruleName, expected, actual, source) {
  return createError("Wrong number of parameters for rule " + ruleName + " (expected " + expected + ", got " + actual + ")", source);
}
function wrongNumberOfArguments(ruleName, expected, actual, expr) {
  return createError("Wrong number of arguments for rule " + ruleName + " (expected " + expected + ", got " + actual + ")", expr);
}
function duplicateParameterNames(ruleName, duplicates, source) {
  return createError("Duplicate parameter names in rule " + ruleName + ": " + duplicates.join(", "), source);
}
function invalidParameter(ruleName, expr) {
  return createError("Invalid parameter to rule " + ruleName + ": " + expr + " has arity " + expr.getArity() + ", but parameter expressions must have arity 1", expr.source);
}
var syntacticVsLexicalNote = "NOTE: A _syntactic rule_ is a rule whose name begins with a capital letter. See https://ohmjs.org/d/svl for more details.";
function applicationOfSyntacticRuleFromLexicalContext(ruleName, applyExpr) {
  return createError("Cannot apply syntactic rule " + ruleName + " from here (inside a lexical context)", applyExpr.source);
}
function applySyntacticWithLexicalRuleApplication(applyExpr) {
  const {ruleName} = applyExpr;
  return createError(`applySyntactic is for syntactic rules, but '${ruleName}' is a lexical rule. ` + syntacticVsLexicalNote, applyExpr.source);
}
function unnecessaryExperimentalApplySyntactic(applyExpr) {
  return createError("applySyntactic is not required here (in a syntactic context)", applyExpr.source);
}
function incorrectArgumentType(expectedType, expr) {
  return createError("Incorrect argument type: expected " + expectedType, expr.source);
}
function multipleSuperSplices(expr) {
  return createError("'...' can appear at most once in a rule body", expr.source);
}
function invalidCodePoint(applyWrapper) {
  const node = applyWrapper._node;
  assert(node && node.isNonterminal() && node.ctorName === "escapeChar_unicodeCodePoint");
  const digitIntervals = applyWrapper.children.slice(1, -1).map((d) => d.source);
  const fullInterval = digitIntervals[0].coverageWith(...digitIntervals.slice(1));
  return createError(`U+${fullInterval.contents} is not a valid Unicode code point`, fullInterval);
}
function kleeneExprHasNullableOperand(kleeneExpr, applicationStack) {
  const actuals = applicationStack.length > 0 ? applicationStack[applicationStack.length - 1].args : [];
  const expr = kleeneExpr.expr.substituteParams(actuals);
  let message = "Nullable expression " + expr + " is not allowed inside '" + kleeneExpr.operator + "' (possible infinite loop)";
  if (applicationStack.length > 0) {
    const stackTrace = applicationStack.map((app) => new Apply(app.ruleName, app.args)).join("\n");
    message += "\nApplication stack (most recent application last):\n" + stackTrace;
  }
  return createError(message, kleeneExpr.expr.source);
}
function inconsistentArity(ruleName, expected, actual, expr) {
  return createError("Rule " + ruleName + " involves an alternation which has inconsistent arity (expected " + expected + ", got " + actual + ")", expr.source);
}
function multipleErrors(errors) {
  const messages = errors.map((e) => e.message);
  return createError(["Errors:"].concat(messages).join("\n- "), errors[0].interval);
}
function missingSemanticAction(ctorName, name, type, stack) {
  let stackTrace = stack.slice(0, -1).map((info) => {
    const ans = "  " + info[0].name + " > " + info[1];
    return info.length === 3 ? ans + " for '" + info[2] + "'" : ans;
  }).join("\n");
  stackTrace += "\n  " + name + " > " + ctorName;
  let moreInfo = "";
  if (ctorName === "_iter") {
    moreInfo = [
      "\nNOTE: as of Ohm v16, there is no default action for iteration nodes \u2014 see ",
      "  https://ohmjs.org/d/dsa for details."
    ].join("\n");
  }
  const message = [
    `Missing semantic action for '${ctorName}' in ${type} '${name}'.${moreInfo}`,
    "Action stack (most recent call last):",
    stackTrace
  ].join("\n");
  const e = createError(message);
  e.name = "missingSemanticAction";
  return e;
}
function throwErrors(errors) {
  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw multipleErrors(errors);
  }
}
function padNumbersToEqualLength(arr) {
  let maxLen = 0;
  const strings = arr.map((n) => {
    const str = n.toString();
    maxLen = Math.max(maxLen, str.length);
    return str;
  });
  return strings.map((s) => padLeft(s, maxLen));
}
function strcpy(dest, src, offset) {
  const origDestLen = dest.length;
  const start = dest.slice(0, offset);
  const end2 = dest.slice(offset + src.length);
  return (start + src + end2).substr(0, origDestLen);
}
function lineAndColumnToMessage(...ranges) {
  const lineAndCol = this;
  const {offset} = lineAndCol;
  const {repeatStr: repeatStr2} = common;
  const sb = new StringBuffer();
  sb.append("Line " + lineAndCol.lineNum + ", col " + lineAndCol.colNum + ":\n");
  const lineNumbers = padNumbersToEqualLength([
    lineAndCol.prevLine == null ? 0 : lineAndCol.lineNum - 1,
    lineAndCol.lineNum,
    lineAndCol.nextLine == null ? 0 : lineAndCol.lineNum + 1
  ]);
  const appendLine = (num, content, prefix) => {
    sb.append(prefix + lineNumbers[num] + " | " + content + "\n");
  };
  if (lineAndCol.prevLine != null) {
    appendLine(0, lineAndCol.prevLine, "  ");
  }
  appendLine(1, lineAndCol.line, "> ");
  const lineLen = lineAndCol.line.length;
  let indicationLine = repeatStr2(" ", lineLen + 1);
  for (let i = 0; i < ranges.length; ++i) {
    let startIdx = ranges[i][0];
    let endIdx = ranges[i][1];
    assert(startIdx >= 0 && startIdx <= endIdx, "range start must be >= 0 and <= end");
    const lineStartOffset = offset - lineAndCol.colNum + 1;
    startIdx = Math.max(0, startIdx - lineStartOffset);
    endIdx = Math.min(endIdx - lineStartOffset, lineLen);
    indicationLine = strcpy(indicationLine, repeatStr2("~", endIdx - startIdx), startIdx);
  }
  const gutterWidth = 2 + lineNumbers[1].length + 3;
  sb.append(repeatStr2(" ", gutterWidth));
  indicationLine = strcpy(indicationLine, "^", lineAndCol.colNum - 1);
  sb.append(indicationLine.replace(/ +$/, "") + "\n");
  if (lineAndCol.nextLine != null) {
    appendLine(2, lineAndCol.nextLine, "  ");
  }
  return sb.contents();
}
var builtInRulesCallbacks = [];
function awaitBuiltInRules(cb) {
  builtInRulesCallbacks.push(cb);
}
function announceBuiltInRules(grammar2) {
  builtInRulesCallbacks.forEach((cb) => {
    cb(grammar2);
  });
  builtInRulesCallbacks = null;
}
function getLineAndColumn(str, offset) {
  let lineNum = 1;
  let colNum = 1;
  let currOffset = 0;
  let lineStartOffset = 0;
  let nextLine = null;
  let prevLine = null;
  let prevLineStartOffset = -1;
  while (currOffset < offset) {
    const c = str.charAt(currOffset++);
    if (c === "\n") {
      lineNum++;
      colNum = 1;
      prevLineStartOffset = lineStartOffset;
      lineStartOffset = currOffset;
    } else if (c !== "\r") {
      colNum++;
    }
  }
  let lineEndOffset = str.indexOf("\n", lineStartOffset);
  if (lineEndOffset === -1) {
    lineEndOffset = str.length;
  } else {
    const nextLineEndOffset = str.indexOf("\n", lineEndOffset + 1);
    nextLine = nextLineEndOffset === -1 ? str.slice(lineEndOffset) : str.slice(lineEndOffset, nextLineEndOffset);
    nextLine = nextLine.replace(/^\r?\n/, "").replace(/\r$/, "");
  }
  if (prevLineStartOffset >= 0) {
    prevLine = str.slice(prevLineStartOffset, lineStartOffset).replace(/\r?\n$/, "");
  }
  const line = str.slice(lineStartOffset, lineEndOffset).replace(/\r$/, "");
  return {
    offset,
    lineNum,
    colNum,
    line,
    prevLine,
    nextLine,
    toString: lineAndColumnToMessage
  };
}
function getLineAndColumnMessage(str, offset, ...ranges) {
  return getLineAndColumn(str, offset).toString(...ranges);
}
var uniqueId = (() => {
  let idCounter = 0;
  return (prefix) => "" + prefix + idCounter++;
})();
var Interval = class {
  constructor(sourceString, startIdx, endIdx) {
    this.sourceString = sourceString;
    this.startIdx = startIdx;
    this.endIdx = endIdx;
  }
  get contents() {
    if (this._contents === void 0) {
      this._contents = this.sourceString.slice(this.startIdx, this.endIdx);
    }
    return this._contents;
  }
  get length() {
    return this.endIdx - this.startIdx;
  }
  coverageWith(...intervals) {
    return Interval.coverage(...intervals, this);
  }
  collapsedLeft() {
    return new Interval(this.sourceString, this.startIdx, this.startIdx);
  }
  collapsedRight() {
    return new Interval(this.sourceString, this.endIdx, this.endIdx);
  }
  getLineAndColumn() {
    return getLineAndColumn(this.sourceString, this.startIdx);
  }
  getLineAndColumnMessage() {
    const range = [this.startIdx, this.endIdx];
    return getLineAndColumnMessage(this.sourceString, this.startIdx, range);
  }
  minus(that) {
    if (this.sourceString !== that.sourceString) {
      throw intervalSourcesDontMatch();
    } else if (this.startIdx === that.startIdx && this.endIdx === that.endIdx) {
      return [];
    } else if (this.startIdx < that.startIdx && that.endIdx < this.endIdx) {
      return [
        new Interval(this.sourceString, this.startIdx, that.startIdx),
        new Interval(this.sourceString, that.endIdx, this.endIdx)
      ];
    } else if (this.startIdx < that.endIdx && that.endIdx < this.endIdx) {
      return [new Interval(this.sourceString, that.endIdx, this.endIdx)];
    } else if (this.startIdx < that.startIdx && that.startIdx < this.endIdx) {
      return [new Interval(this.sourceString, this.startIdx, that.startIdx)];
    } else {
      return [this];
    }
  }
  relativeTo(that) {
    if (this.sourceString !== that.sourceString) {
      throw intervalSourcesDontMatch();
    }
    assert(this.startIdx >= that.startIdx && this.endIdx <= that.endIdx, "other interval does not cover this one");
    return new Interval(this.sourceString, this.startIdx - that.startIdx, this.endIdx - that.startIdx);
  }
  trimmed() {
    const {contents} = this;
    const startIdx = this.startIdx + contents.match(/^\s*/)[0].length;
    const endIdx = this.endIdx - contents.match(/\s*$/)[0].length;
    return new Interval(this.sourceString, startIdx, endIdx);
  }
  subInterval(offset, len) {
    const newStartIdx = this.startIdx + offset;
    return new Interval(this.sourceString, newStartIdx, newStartIdx + len);
  }
};
Interval.coverage = function(firstInterval, ...intervals) {
  let {startIdx, endIdx} = firstInterval;
  for (const interval of intervals) {
    if (interval.sourceString !== firstInterval.sourceString) {
      throw intervalSourcesDontMatch();
    } else {
      startIdx = Math.min(startIdx, interval.startIdx);
      endIdx = Math.max(endIdx, interval.endIdx);
    }
  }
  return new Interval(firstInterval.sourceString, startIdx, endIdx);
};
var MAX_CHAR_CODE = 65535;
var InputStream = class {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.examinedLength = 0;
  }
  atEnd() {
    const ans = this.pos >= this.source.length;
    this.examinedLength = Math.max(this.examinedLength, this.pos + 1);
    return ans;
  }
  next() {
    const ans = this.source[this.pos++];
    this.examinedLength = Math.max(this.examinedLength, this.pos);
    return ans;
  }
  nextCharCode() {
    const nextChar = this.next();
    return nextChar && nextChar.charCodeAt(0);
  }
  nextCodePoint() {
    const cp = this.source.slice(this.pos++).codePointAt(0);
    if (cp > MAX_CHAR_CODE) {
      this.pos += 1;
    }
    this.examinedLength = Math.max(this.examinedLength, this.pos);
    return cp;
  }
  matchString(s, optIgnoreCase) {
    let idx;
    if (optIgnoreCase) {
      for (idx = 0; idx < s.length; idx++) {
        const actual = this.next();
        const expected = s[idx];
        if (actual == null || actual.toUpperCase() !== expected.toUpperCase()) {
          return false;
        }
      }
      return true;
    }
    for (idx = 0; idx < s.length; idx++) {
      if (this.next() !== s[idx]) {
        return false;
      }
    }
    return true;
  }
  sourceSlice(startIdx, endIdx) {
    return this.source.slice(startIdx, endIdx);
  }
  interval(startIdx, optEndIdx) {
    return new Interval(this.source, startIdx, optEndIdx ? optEndIdx : this.pos);
  }
};
var MatchResult = class {
  constructor(matcher, input, startExpr, cst, cstOffset, rightmostFailurePosition, optRecordedFailures) {
    this.matcher = matcher;
    this.input = input;
    this.startExpr = startExpr;
    this._cst = cst;
    this._cstOffset = cstOffset;
    this._rightmostFailurePosition = rightmostFailurePosition;
    this._rightmostFailures = optRecordedFailures;
    if (this.failed()) {
      defineLazyProperty(this, "message", function() {
        const detail = "Expected " + this.getExpectedText();
        return getLineAndColumnMessage(this.input, this.getRightmostFailurePosition()) + detail;
      });
      defineLazyProperty(this, "shortMessage", function() {
        const detail = "expected " + this.getExpectedText();
        const errorInfo = getLineAndColumn(this.input, this.getRightmostFailurePosition());
        return "Line " + errorInfo.lineNum + ", col " + errorInfo.colNum + ": " + detail;
      });
    }
  }
  succeeded() {
    return !!this._cst;
  }
  failed() {
    return !this.succeeded();
  }
  getRightmostFailurePosition() {
    return this._rightmostFailurePosition;
  }
  getRightmostFailures() {
    if (!this._rightmostFailures) {
      this.matcher.setInput(this.input);
      const matchResultWithFailures = this.matcher._match(this.startExpr, {
        tracing: false,
        positionToRecordFailures: this.getRightmostFailurePosition()
      });
      this._rightmostFailures = matchResultWithFailures.getRightmostFailures();
    }
    return this._rightmostFailures;
  }
  toString() {
    return this.succeeded() ? "[match succeeded]" : "[match failed at position " + this.getRightmostFailurePosition() + "]";
  }
  getExpectedText() {
    if (this.succeeded()) {
      throw new Error("cannot get expected text of a successful MatchResult");
    }
    const sb = new StringBuffer();
    let failures = this.getRightmostFailures();
    failures = failures.filter((failure) => !failure.isFluffy());
    for (let idx = 0; idx < failures.length; idx++) {
      if (idx > 0) {
        if (idx === failures.length - 1) {
          sb.append(failures.length > 2 ? ", or " : " or ");
        } else {
          sb.append(", ");
        }
      }
      sb.append(failures[idx].toString());
    }
    return sb.contents();
  }
  getInterval() {
    const pos = this.getRightmostFailurePosition();
    return new Interval(this.input, pos, pos);
  }
};
var PosInfo = class {
  constructor() {
    this.applicationMemoKeyStack = [];
    this.memo = {};
    this.maxExaminedLength = 0;
    this.maxRightmostFailureOffset = -1;
    this.currentLeftRecursion = void 0;
  }
  isActive(application) {
    return this.applicationMemoKeyStack.indexOf(application.toMemoKey()) >= 0;
  }
  enter(application) {
    this.applicationMemoKeyStack.push(application.toMemoKey());
  }
  exit() {
    this.applicationMemoKeyStack.pop();
  }
  startLeftRecursion(headApplication, memoRec) {
    memoRec.isLeftRecursion = true;
    memoRec.headApplication = headApplication;
    memoRec.nextLeftRecursion = this.currentLeftRecursion;
    this.currentLeftRecursion = memoRec;
    const {applicationMemoKeyStack} = this;
    const indexOfFirstInvolvedRule = applicationMemoKeyStack.indexOf(headApplication.toMemoKey()) + 1;
    const involvedApplicationMemoKeys = applicationMemoKeyStack.slice(indexOfFirstInvolvedRule);
    memoRec.isInvolved = function(applicationMemoKey) {
      return involvedApplicationMemoKeys.indexOf(applicationMemoKey) >= 0;
    };
    memoRec.updateInvolvedApplicationMemoKeys = function() {
      for (let idx = indexOfFirstInvolvedRule; idx < applicationMemoKeyStack.length; idx++) {
        const applicationMemoKey = applicationMemoKeyStack[idx];
        if (!this.isInvolved(applicationMemoKey)) {
          involvedApplicationMemoKeys.push(applicationMemoKey);
        }
      }
    };
  }
  endLeftRecursion() {
    this.currentLeftRecursion = this.currentLeftRecursion.nextLeftRecursion;
  }
  shouldUseMemoizedResult(memoRec) {
    if (!memoRec.isLeftRecursion) {
      return true;
    }
    const {applicationMemoKeyStack} = this;
    for (let idx = 0; idx < applicationMemoKeyStack.length; idx++) {
      const applicationMemoKey = applicationMemoKeyStack[idx];
      if (memoRec.isInvolved(applicationMemoKey)) {
        return false;
      }
    }
    return true;
  }
  memoize(memoKey, memoRec) {
    this.memo[memoKey] = memoRec;
    this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
    this.maxRightmostFailureOffset = Math.max(this.maxRightmostFailureOffset, memoRec.rightmostFailureOffset);
    return memoRec;
  }
  clearObsoleteEntries(pos, invalidatedIdx) {
    if (pos + this.maxExaminedLength <= invalidatedIdx) {
      return;
    }
    const {memo} = this;
    this.maxExaminedLength = 0;
    this.maxRightmostFailureOffset = -1;
    Object.keys(memo).forEach((k) => {
      const memoRec = memo[k];
      if (pos + memoRec.examinedLength > invalidatedIdx) {
        delete memo[k];
      } else {
        this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
        this.maxRightmostFailureOffset = Math.max(this.maxRightmostFailureOffset, memoRec.rightmostFailureOffset);
      }
    });
  }
};
var BALLOT_X = "\u2717";
var CHECK_MARK = "\u2713";
var DOT_OPERATOR = "\u22C5";
var RIGHTWARDS_DOUBLE_ARROW = "\u21D2";
var SYMBOL_FOR_HORIZONTAL_TABULATION = "\u2409";
var SYMBOL_FOR_LINE_FEED = "\u240A";
var SYMBOL_FOR_CARRIAGE_RETURN = "\u240D";
var Flags = {
  succeeded: 1 << 0,
  isRootNode: 1 << 1,
  isImplicitSpaces: 1 << 2,
  isMemoized: 1 << 3,
  isHeadOfLeftRecursion: 1 << 4,
  terminatesLR: 1 << 5
};
function spaces(n) {
  return repeat(" ", n).join("");
}
function getInputExcerpt(input, pos, len) {
  const excerpt = asEscapedString(input.slice(pos, pos + len));
  if (excerpt.length < len) {
    return excerpt + repeat(" ", len - excerpt.length).join("");
  }
  return excerpt;
}
function asEscapedString(obj) {
  if (typeof obj === "string") {
    return obj.replace(/ /g, DOT_OPERATOR).replace(/\t/g, SYMBOL_FOR_HORIZONTAL_TABULATION).replace(/\n/g, SYMBOL_FOR_LINE_FEED).replace(/\r/g, SYMBOL_FOR_CARRIAGE_RETURN);
  }
  return String(obj);
}
var Trace = class {
  constructor(input, pos1, pos2, expr, succeeded, bindings, optChildren) {
    this.input = input;
    this.pos = this.pos1 = pos1;
    this.pos2 = pos2;
    this.source = new Interval(input, pos1, pos2);
    this.expr = expr;
    this.bindings = bindings;
    this.children = optChildren || [];
    this.terminatingLREntry = null;
    this._flags = succeeded ? Flags.succeeded : 0;
  }
  get displayString() {
    return this.expr.toDisplayString();
  }
  clone() {
    return this.cloneWithExpr(this.expr);
  }
  cloneWithExpr(expr) {
    const ans = new Trace(this.input, this.pos, this.pos2, expr, this.succeeded, this.bindings, this.children);
    ans.isHeadOfLeftRecursion = this.isHeadOfLeftRecursion;
    ans.isImplicitSpaces = this.isImplicitSpaces;
    ans.isMemoized = this.isMemoized;
    ans.isRootNode = this.isRootNode;
    ans.terminatesLR = this.terminatesLR;
    ans.terminatingLREntry = this.terminatingLREntry;
    return ans;
  }
  recordLRTermination(ruleBodyTrace, value) {
    this.terminatingLREntry = new Trace(this.input, this.pos, this.pos2, this.expr, false, [value], [ruleBodyTrace]);
    this.terminatingLREntry.terminatesLR = true;
  }
  walk(visitorObjOrFn, optThisArg) {
    let visitor = visitorObjOrFn;
    if (typeof visitor === "function") {
      visitor = {enter: visitor};
    }
    function _walk(node, parent, depth) {
      let recurse = true;
      if (visitor.enter) {
        if (visitor.enter.call(optThisArg, node, parent, depth) === Trace.prototype.SKIP) {
          recurse = false;
        }
      }
      if (recurse) {
        node.children.forEach((child) => {
          _walk(child, node, depth + 1);
        });
        if (visitor.exit) {
          visitor.exit.call(optThisArg, node, parent, depth);
        }
      }
    }
    if (this.isRootNode) {
      this.children.forEach((c) => {
        _walk(c, null, 0);
      });
    } else {
      _walk(this, null, 0);
    }
  }
  toString() {
    const sb = new StringBuffer();
    this.walk((node, parent, depth) => {
      if (!node) {
        return this.SKIP;
      }
      const ctorName = node.expr.constructor.name;
      if (ctorName === "Alt") {
        return;
      }
      sb.append(getInputExcerpt(node.input, node.pos, 10) + spaces(depth * 2 + 1));
      sb.append((node.succeeded ? CHECK_MARK : BALLOT_X) + " " + node.displayString);
      if (node.isHeadOfLeftRecursion) {
        sb.append(" (LR)");
      }
      if (node.succeeded) {
        const contents = asEscapedString(node.source.contents);
        sb.append(" " + RIGHTWARDS_DOUBLE_ARROW + "  ");
        sb.append(typeof contents === "string" ? '"' + contents + '"' : contents);
      }
      sb.append("\n");
    });
    return sb.contents();
  }
};
Trace.prototype.SKIP = {};
Object.keys(Flags).forEach((name) => {
  const mask = Flags[name];
  Object.defineProperty(Trace.prototype, name, {
    get() {
      return (this._flags & mask) !== 0;
    },
    set(val) {
      if (val) {
        this._flags |= mask;
      } else {
        this._flags &= ~mask;
      }
    }
  });
});
PExpr.prototype.allowsSkippingPrecedingSpace = abstract("allowsSkippingPrecedingSpace");
any.allowsSkippingPrecedingSpace = end.allowsSkippingPrecedingSpace = Apply.prototype.allowsSkippingPrecedingSpace = Terminal.prototype.allowsSkippingPrecedingSpace = Range.prototype.allowsSkippingPrecedingSpace = UnicodeChar.prototype.allowsSkippingPrecedingSpace = function() {
  return true;
};
Alt.prototype.allowsSkippingPrecedingSpace = Iter.prototype.allowsSkippingPrecedingSpace = Lex.prototype.allowsSkippingPrecedingSpace = Lookahead.prototype.allowsSkippingPrecedingSpace = Not.prototype.allowsSkippingPrecedingSpace = Param.prototype.allowsSkippingPrecedingSpace = Seq.prototype.allowsSkippingPrecedingSpace = function() {
  return false;
};
var BuiltInRules$1;
awaitBuiltInRules((g) => {
  BuiltInRules$1 = g;
});
var lexifyCount;
PExpr.prototype.assertAllApplicationsAreValid = function(ruleName, grammar2) {
  lexifyCount = 0;
  this._assertAllApplicationsAreValid(ruleName, grammar2);
};
PExpr.prototype._assertAllApplicationsAreValid = abstract("_assertAllApplicationsAreValid");
any._assertAllApplicationsAreValid = end._assertAllApplicationsAreValid = Terminal.prototype._assertAllApplicationsAreValid = Range.prototype._assertAllApplicationsAreValid = Param.prototype._assertAllApplicationsAreValid = UnicodeChar.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
};
Lex.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  lexifyCount++;
  this.expr._assertAllApplicationsAreValid(ruleName, grammar2);
  lexifyCount--;
};
Alt.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  for (let idx = 0; idx < this.terms.length; idx++) {
    this.terms[idx]._assertAllApplicationsAreValid(ruleName, grammar2);
  }
};
Seq.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx]._assertAllApplicationsAreValid(ruleName, grammar2);
  }
};
Iter.prototype._assertAllApplicationsAreValid = Not.prototype._assertAllApplicationsAreValid = Lookahead.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  this.expr._assertAllApplicationsAreValid(ruleName, grammar2);
};
Apply.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2, skipSyntacticCheck = false) {
  const ruleInfo = grammar2.rules[this.ruleName];
  const isContextSyntactic = isSyntactic(ruleName) && lexifyCount === 0;
  if (!ruleInfo) {
    throw undeclaredRule(this.ruleName, grammar2.name, this.source);
  }
  if (!skipSyntacticCheck && isSyntactic(this.ruleName) && !isContextSyntactic) {
    throw applicationOfSyntacticRuleFromLexicalContext(this.ruleName, this);
  }
  const actual = this.args.length;
  const expected = ruleInfo.formals.length;
  if (actual !== expected) {
    throw wrongNumberOfArguments(this.ruleName, expected, actual, this.source);
  }
  const isBuiltInApplySyntactic = BuiltInRules$1 && ruleInfo === BuiltInRules$1.rules.applySyntactic;
  const isBuiltInCaseInsensitive = BuiltInRules$1 && ruleInfo === BuiltInRules$1.rules.caseInsensitive;
  if (isBuiltInCaseInsensitive) {
    if (!(this.args[0] instanceof Terminal)) {
      throw incorrectArgumentType('a Terminal (e.g. "abc")', this.args[0]);
    }
  }
  if (isBuiltInApplySyntactic) {
    const arg = this.args[0];
    if (!(arg instanceof Apply)) {
      throw incorrectArgumentType("a syntactic rule application", arg);
    }
    if (!isSyntactic(arg.ruleName)) {
      throw applySyntacticWithLexicalRuleApplication(arg);
    }
    if (isContextSyntactic) {
      throw unnecessaryExperimentalApplySyntactic(this);
    }
  }
  this.args.forEach((arg) => {
    arg._assertAllApplicationsAreValid(ruleName, grammar2, isBuiltInApplySyntactic);
    if (arg.getArity() !== 1) {
      throw invalidParameter(this.ruleName, arg);
    }
  });
};
PExpr.prototype.assertChoicesHaveUniformArity = abstract("assertChoicesHaveUniformArity");
any.assertChoicesHaveUniformArity = end.assertChoicesHaveUniformArity = Terminal.prototype.assertChoicesHaveUniformArity = Range.prototype.assertChoicesHaveUniformArity = Param.prototype.assertChoicesHaveUniformArity = Lex.prototype.assertChoicesHaveUniformArity = UnicodeChar.prototype.assertChoicesHaveUniformArity = function(ruleName) {
};
Alt.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  if (this.terms.length === 0) {
    return;
  }
  const arity = this.terms[0].getArity();
  for (let idx = 0; idx < this.terms.length; idx++) {
    const term = this.terms[idx];
    term.assertChoicesHaveUniformArity();
    const otherArity = term.getArity();
    if (arity !== otherArity) {
      throw inconsistentArity(ruleName, arity, otherArity, term);
    }
  }
};
Extend.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  const actualArity = this.terms[0].getArity();
  const expectedArity = this.terms[1].getArity();
  if (actualArity !== expectedArity) {
    throw inconsistentArity(ruleName, expectedArity, actualArity, this.terms[0]);
  }
};
Seq.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx].assertChoicesHaveUniformArity(ruleName);
  }
};
Iter.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  this.expr.assertChoicesHaveUniformArity(ruleName);
};
Not.prototype.assertChoicesHaveUniformArity = function(ruleName) {
};
Lookahead.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  this.expr.assertChoicesHaveUniformArity(ruleName);
};
Apply.prototype.assertChoicesHaveUniformArity = function(ruleName) {
};
PExpr.prototype.assertIteratedExprsAreNotNullable = abstract("assertIteratedExprsAreNotNullable");
any.assertIteratedExprsAreNotNullable = end.assertIteratedExprsAreNotNullable = Terminal.prototype.assertIteratedExprsAreNotNullable = Range.prototype.assertIteratedExprsAreNotNullable = Param.prototype.assertIteratedExprsAreNotNullable = UnicodeChar.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
};
Alt.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  for (let idx = 0; idx < this.terms.length; idx++) {
    this.terms[idx].assertIteratedExprsAreNotNullable(grammar2);
  }
};
Seq.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx].assertIteratedExprsAreNotNullable(grammar2);
  }
};
Iter.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  this.expr.assertIteratedExprsAreNotNullable(grammar2);
  if (this.expr.isNullable(grammar2)) {
    throw kleeneExprHasNullableOperand(this, []);
  }
};
Opt.prototype.assertIteratedExprsAreNotNullable = Not.prototype.assertIteratedExprsAreNotNullable = Lookahead.prototype.assertIteratedExprsAreNotNullable = Lex.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  this.expr.assertIteratedExprsAreNotNullable(grammar2);
};
Apply.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  this.args.forEach((arg) => {
    arg.assertIteratedExprsAreNotNullable(grammar2);
  });
};
var Node = class {
  constructor(matchLength) {
    this.matchLength = matchLength;
  }
  get ctorName() {
    throw new Error("subclass responsibility");
  }
  numChildren() {
    return this.children ? this.children.length : 0;
  }
  childAt(idx) {
    if (this.children) {
      return this.children[idx];
    }
  }
  indexOfChild(arg) {
    return this.children.indexOf(arg);
  }
  hasChildren() {
    return this.numChildren() > 0;
  }
  hasNoChildren() {
    return !this.hasChildren();
  }
  onlyChild() {
    if (this.numChildren() !== 1) {
      throw new Error("cannot get only child of a node of type " + this.ctorName + " (it has " + this.numChildren() + " children)");
    } else {
      return this.firstChild();
    }
  }
  firstChild() {
    if (this.hasNoChildren()) {
      throw new Error("cannot get first child of a " + this.ctorName + " node, which has no children");
    } else {
      return this.childAt(0);
    }
  }
  lastChild() {
    if (this.hasNoChildren()) {
      throw new Error("cannot get last child of a " + this.ctorName + " node, which has no children");
    } else {
      return this.childAt(this.numChildren() - 1);
    }
  }
  childBefore(child) {
    const childIdx = this.indexOfChild(child);
    if (childIdx < 0) {
      throw new Error("Node.childBefore() called w/ an argument that is not a child");
    } else if (childIdx === 0) {
      throw new Error("cannot get child before first child");
    } else {
      return this.childAt(childIdx - 1);
    }
  }
  childAfter(child) {
    const childIdx = this.indexOfChild(child);
    if (childIdx < 0) {
      throw new Error("Node.childAfter() called w/ an argument that is not a child");
    } else if (childIdx === this.numChildren() - 1) {
      throw new Error("cannot get child after last child");
    } else {
      return this.childAt(childIdx + 1);
    }
  }
  isTerminal() {
    return false;
  }
  isNonterminal() {
    return false;
  }
  isIteration() {
    return false;
  }
  isOptional() {
    return false;
  }
};
var TerminalNode = class extends Node {
  get ctorName() {
    return "_terminal";
  }
  isTerminal() {
    return true;
  }
  get primitiveValue() {
    throw new Error("The `primitiveValue` property was removed in Ohm v17.");
  }
};
var NonterminalNode = class extends Node {
  constructor(ruleName, children, childOffsets, matchLength) {
    super(matchLength);
    this.ruleName = ruleName;
    this.children = children;
    this.childOffsets = childOffsets;
  }
  get ctorName() {
    return this.ruleName;
  }
  isNonterminal() {
    return true;
  }
  isLexical() {
    return isLexical(this.ctorName);
  }
  isSyntactic() {
    return isSyntactic(this.ctorName);
  }
};
var IterationNode = class extends Node {
  constructor(children, childOffsets, matchLength, isOptional) {
    super(matchLength);
    this.children = children;
    this.childOffsets = childOffsets;
    this.optional = isOptional;
  }
  get ctorName() {
    return "_iter";
  }
  isIteration() {
    return true;
  }
  isOptional() {
    return this.optional;
  }
};
PExpr.prototype.eval = abstract("eval");
any.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const cp = inputStream.nextCodePoint();
  if (cp !== void 0) {
    state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
end.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (inputStream.atEnd()) {
    state.pushBinding(new TerminalNode(0), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
Terminal.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (!inputStream.matchString(this.obj)) {
    state.processFailure(origPos, this);
    return false;
  } else {
    state.pushBinding(new TerminalNode(this.obj.length), origPos);
    return true;
  }
};
Range.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const cp = this.matchCodePoint ? inputStream.nextCodePoint() : inputStream.nextCharCode();
  if (cp !== void 0 && this.from.codePointAt(0) <= cp && cp <= this.to.codePointAt(0)) {
    state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
Param.prototype.eval = function(state) {
  return state.eval(state.currentApplication().args[this.index]);
};
Lex.prototype.eval = function(state) {
  state.enterLexifiedContext();
  const ans = state.eval(this.expr);
  state.exitLexifiedContext();
  return ans;
};
Alt.prototype.eval = function(state) {
  for (let idx = 0; idx < this.terms.length; idx++) {
    if (state.eval(this.terms[idx])) {
      return true;
    }
  }
  return false;
};
Seq.prototype.eval = function(state) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    const factor = this.factors[idx];
    if (!state.eval(factor)) {
      return false;
    }
  }
  return true;
};
Iter.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const arity = this.getArity();
  const cols = [];
  const colOffsets = [];
  while (cols.length < arity) {
    cols.push([]);
    colOffsets.push([]);
  }
  let numMatches = 0;
  let prevPos = origPos;
  let idx;
  while (numMatches < this.maxNumMatches && state.eval(this.expr)) {
    if (inputStream.pos === prevPos) {
      throw kleeneExprHasNullableOperand(this, state._applicationStack);
    }
    prevPos = inputStream.pos;
    numMatches++;
    const row = state._bindings.splice(state._bindings.length - arity, arity);
    const rowOffsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
    for (idx = 0; idx < row.length; idx++) {
      cols[idx].push(row[idx]);
      colOffsets[idx].push(rowOffsets[idx]);
    }
  }
  if (numMatches < this.minNumMatches) {
    return false;
  }
  let offset = state.posToOffset(origPos);
  let matchLength = 0;
  if (numMatches > 0) {
    const lastCol = cols[arity - 1];
    const lastColOffsets = colOffsets[arity - 1];
    const endOffset = lastColOffsets[lastColOffsets.length - 1] + lastCol[lastCol.length - 1].matchLength;
    offset = colOffsets[0][0];
    matchLength = endOffset - offset;
  }
  const isOptional = this instanceof Opt;
  for (idx = 0; idx < cols.length; idx++) {
    state._bindings.push(new IterationNode(cols[idx], colOffsets[idx], matchLength, isOptional));
    state._bindingOffsets.push(offset);
  }
  return true;
};
Not.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  state.pushFailuresInfo();
  const ans = state.eval(this.expr);
  state.popFailuresInfo();
  if (ans) {
    state.processFailure(origPos, this);
    return false;
  }
  inputStream.pos = origPos;
  return true;
};
Lookahead.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (state.eval(this.expr)) {
    inputStream.pos = origPos;
    return true;
  } else {
    return false;
  }
};
Apply.prototype.eval = function(state) {
  const caller = state.currentApplication();
  const actuals = caller ? caller.args : [];
  const app = this.substituteParams(actuals);
  const posInfo = state.getCurrentPosInfo();
  if (posInfo.isActive(app)) {
    return app.handleCycle(state);
  }
  const memoKey = app.toMemoKey();
  const memoRec = posInfo.memo[memoKey];
  if (memoRec && posInfo.shouldUseMemoizedResult(memoRec)) {
    if (state.hasNecessaryInfo(memoRec)) {
      return state.useMemoizedResult(state.inputStream.pos, memoRec);
    }
    delete posInfo.memo[memoKey];
  }
  return app.reallyEval(state);
};
Apply.prototype.handleCycle = function(state) {
  const posInfo = state.getCurrentPosInfo();
  const {currentLeftRecursion} = posInfo;
  const memoKey = this.toMemoKey();
  let memoRec = posInfo.memo[memoKey];
  if (currentLeftRecursion && currentLeftRecursion.headApplication.toMemoKey() === memoKey) {
    memoRec.updateInvolvedApplicationMemoKeys();
  } else if (!memoRec) {
    memoRec = posInfo.memoize(memoKey, {
      matchLength: 0,
      examinedLength: 0,
      value: false,
      rightmostFailureOffset: -1
    });
    posInfo.startLeftRecursion(this, memoRec);
  }
  return state.useMemoizedResult(state.inputStream.pos, memoRec);
};
Apply.prototype.reallyEval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const origPosInfo = state.getCurrentPosInfo();
  const ruleInfo = state.grammar.rules[this.ruleName];
  const {body} = ruleInfo;
  const {description} = ruleInfo;
  state.enterApplication(origPosInfo, this);
  if (description) {
    state.pushFailuresInfo();
  }
  const origInputStreamExaminedLength = inputStream.examinedLength;
  inputStream.examinedLength = 0;
  let value = this.evalOnce(body, state);
  const currentLR = origPosInfo.currentLeftRecursion;
  const memoKey = this.toMemoKey();
  const isHeadOfLeftRecursion = currentLR && currentLR.headApplication.toMemoKey() === memoKey;
  let memoRec;
  if (state.doNotMemoize) {
    state.doNotMemoize = false;
  } else if (isHeadOfLeftRecursion) {
    value = this.growSeedResult(body, state, origPos, currentLR, value);
    origPosInfo.endLeftRecursion();
    memoRec = currentLR;
    memoRec.examinedLength = inputStream.examinedLength - origPos;
    memoRec.rightmostFailureOffset = state._getRightmostFailureOffset();
    origPosInfo.memoize(memoKey, memoRec);
  } else if (!currentLR || !currentLR.isInvolved(memoKey)) {
    memoRec = origPosInfo.memoize(memoKey, {
      matchLength: inputStream.pos - origPos,
      examinedLength: inputStream.examinedLength - origPos,
      value,
      failuresAtRightmostPosition: state.cloneRecordedFailures(),
      rightmostFailureOffset: state._getRightmostFailureOffset()
    });
  }
  const succeeded = !!value;
  if (description) {
    state.popFailuresInfo();
    if (!succeeded) {
      state.processFailure(origPos, this);
    }
    if (memoRec) {
      memoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
    }
  }
  if (state.isTracing() && memoRec) {
    const entry = state.getTraceEntry(origPos, this, succeeded, succeeded ? [value] : []);
    if (isHeadOfLeftRecursion) {
      assert(entry.terminatingLREntry != null || !succeeded);
      entry.isHeadOfLeftRecursion = true;
    }
    memoRec.traceEntry = entry;
  }
  inputStream.examinedLength = Math.max(inputStream.examinedLength, origInputStreamExaminedLength);
  state.exitApplication(origPosInfo, value);
  return succeeded;
};
Apply.prototype.evalOnce = function(expr, state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (state.eval(expr)) {
    const arity = expr.getArity();
    const bindings = state._bindings.splice(state._bindings.length - arity, arity);
    const offsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
    const matchLength = inputStream.pos - origPos;
    return new NonterminalNode(this.ruleName, bindings, offsets, matchLength);
  } else {
    return false;
  }
};
Apply.prototype.growSeedResult = function(body, state, origPos, lrMemoRec, newValue) {
  if (!newValue) {
    return false;
  }
  const {inputStream} = state;
  while (true) {
    lrMemoRec.matchLength = inputStream.pos - origPos;
    lrMemoRec.value = newValue;
    lrMemoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
    if (state.isTracing()) {
      const seedTrace = state.trace[state.trace.length - 1];
      lrMemoRec.traceEntry = new Trace(state.input, origPos, inputStream.pos, this, true, [newValue], [seedTrace.clone()]);
    }
    inputStream.pos = origPos;
    newValue = this.evalOnce(body, state);
    if (inputStream.pos - origPos <= lrMemoRec.matchLength) {
      break;
    }
    if (state.isTracing()) {
      state.trace.splice(-2, 1);
    }
  }
  if (state.isTracing()) {
    lrMemoRec.traceEntry.recordLRTermination(state.trace.pop(), newValue);
  }
  inputStream.pos = origPos + lrMemoRec.matchLength;
  return lrMemoRec.value;
};
UnicodeChar.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const ch = inputStream.next();
  if (ch && this.pattern.test(ch)) {
    state.pushBinding(new TerminalNode(ch.length), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
PExpr.prototype.getArity = abstract("getArity");
any.getArity = end.getArity = Terminal.prototype.getArity = Range.prototype.getArity = Param.prototype.getArity = Apply.prototype.getArity = UnicodeChar.prototype.getArity = function() {
  return 1;
};
Alt.prototype.getArity = function() {
  return this.terms.length === 0 ? 0 : this.terms[0].getArity();
};
Seq.prototype.getArity = function() {
  let arity = 0;
  for (let idx = 0; idx < this.factors.length; idx++) {
    arity += this.factors[idx].getArity();
  }
  return arity;
};
Iter.prototype.getArity = function() {
  return this.expr.getArity();
};
Not.prototype.getArity = function() {
  return 0;
};
Lookahead.prototype.getArity = Lex.prototype.getArity = function() {
  return this.expr.getArity();
};
function getMetaInfo(expr, grammarInterval) {
  const metaInfo = {};
  if (expr.source && grammarInterval) {
    const adjusted = expr.source.relativeTo(grammarInterval);
    metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
  }
  return metaInfo;
}
PExpr.prototype.outputRecipe = abstract("outputRecipe");
any.outputRecipe = function(formals, grammarInterval) {
  return ["any", getMetaInfo(this, grammarInterval)];
};
end.outputRecipe = function(formals, grammarInterval) {
  return ["end", getMetaInfo(this, grammarInterval)];
};
Terminal.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["terminal", getMetaInfo(this, grammarInterval), this.obj];
};
Range.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["range", getMetaInfo(this, grammarInterval), this.from, this.to];
};
Param.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["param", getMetaInfo(this, grammarInterval), this.index];
};
Alt.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["alt", getMetaInfo(this, grammarInterval)].concat(this.terms.map((term) => term.outputRecipe(formals, grammarInterval)));
};
Extend.prototype.outputRecipe = function(formals, grammarInterval) {
  const extension = this.terms[0];
  return extension.outputRecipe(formals, grammarInterval);
};
Splice.prototype.outputRecipe = function(formals, grammarInterval) {
  const beforeTerms = this.terms.slice(0, this.expansionPos);
  const afterTerms = this.terms.slice(this.expansionPos + 1);
  return [
    "splice",
    getMetaInfo(this, grammarInterval),
    beforeTerms.map((term) => term.outputRecipe(formals, grammarInterval)),
    afterTerms.map((term) => term.outputRecipe(formals, grammarInterval))
  ];
};
Seq.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["seq", getMetaInfo(this, grammarInterval)].concat(this.factors.map((factor) => factor.outputRecipe(formals, grammarInterval)));
};
Star.prototype.outputRecipe = Plus.prototype.outputRecipe = Opt.prototype.outputRecipe = Not.prototype.outputRecipe = Lookahead.prototype.outputRecipe = Lex.prototype.outputRecipe = function(formals, grammarInterval) {
  return [
    this.constructor.name.toLowerCase(),
    getMetaInfo(this, grammarInterval),
    this.expr.outputRecipe(formals, grammarInterval)
  ];
};
Apply.prototype.outputRecipe = function(formals, grammarInterval) {
  return [
    "app",
    getMetaInfo(this, grammarInterval),
    this.ruleName,
    this.args.map((arg) => arg.outputRecipe(formals, grammarInterval))
  ];
};
UnicodeChar.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["unicodeChar", getMetaInfo(this, grammarInterval), this.category];
};
PExpr.prototype.introduceParams = abstract("introduceParams");
any.introduceParams = end.introduceParams = Terminal.prototype.introduceParams = Range.prototype.introduceParams = Param.prototype.introduceParams = UnicodeChar.prototype.introduceParams = function(formals) {
  return this;
};
Alt.prototype.introduceParams = function(formals) {
  this.terms.forEach((term, idx, terms) => {
    terms[idx] = term.introduceParams(formals);
  });
  return this;
};
Seq.prototype.introduceParams = function(formals) {
  this.factors.forEach((factor, idx, factors) => {
    factors[idx] = factor.introduceParams(formals);
  });
  return this;
};
Iter.prototype.introduceParams = Not.prototype.introduceParams = Lookahead.prototype.introduceParams = Lex.prototype.introduceParams = function(formals) {
  this.expr = this.expr.introduceParams(formals);
  return this;
};
Apply.prototype.introduceParams = function(formals) {
  const index = formals.indexOf(this.ruleName);
  if (index >= 0) {
    if (this.args.length > 0) {
      throw new Error("Parameterized rules cannot be passed as arguments to another rule.");
    }
    return new Param(index).withSource(this.source);
  } else {
    this.args.forEach((arg, idx, args) => {
      args[idx] = arg.introduceParams(formals);
    });
    return this;
  }
};
PExpr.prototype.isNullable = function(grammar2) {
  return this._isNullable(grammar2, Object.create(null));
};
PExpr.prototype._isNullable = abstract("_isNullable");
any._isNullable = Range.prototype._isNullable = Param.prototype._isNullable = Plus.prototype._isNullable = UnicodeChar.prototype._isNullable = function(grammar2, memo) {
  return false;
};
end._isNullable = function(grammar2, memo) {
  return true;
};
Terminal.prototype._isNullable = function(grammar2, memo) {
  if (typeof this.obj === "string") {
    return this.obj === "";
  } else {
    return false;
  }
};
Alt.prototype._isNullable = function(grammar2, memo) {
  return this.terms.length === 0 || this.terms.some((term) => term._isNullable(grammar2, memo));
};
Seq.prototype._isNullable = function(grammar2, memo) {
  return this.factors.every((factor) => factor._isNullable(grammar2, memo));
};
Star.prototype._isNullable = Opt.prototype._isNullable = Not.prototype._isNullable = Lookahead.prototype._isNullable = function(grammar2, memo) {
  return true;
};
Lex.prototype._isNullable = function(grammar2, memo) {
  return this.expr._isNullable(grammar2, memo);
};
Apply.prototype._isNullable = function(grammar2, memo) {
  const key = this.toMemoKey();
  if (!Object.prototype.hasOwnProperty.call(memo, key)) {
    const {body} = grammar2.rules[this.ruleName];
    const inlined = body.substituteParams(this.args);
    memo[key] = false;
    memo[key] = inlined._isNullable(grammar2, memo);
  }
  return memo[key];
};
PExpr.prototype.substituteParams = abstract("substituteParams");
any.substituteParams = end.substituteParams = Terminal.prototype.substituteParams = Range.prototype.substituteParams = UnicodeChar.prototype.substituteParams = function(actuals) {
  return this;
};
Param.prototype.substituteParams = function(actuals) {
  return actuals[this.index];
};
Alt.prototype.substituteParams = function(actuals) {
  return new Alt(this.terms.map((term) => term.substituteParams(actuals)));
};
Seq.prototype.substituteParams = function(actuals) {
  return new Seq(this.factors.map((factor) => factor.substituteParams(actuals)));
};
Iter.prototype.substituteParams = Not.prototype.substituteParams = Lookahead.prototype.substituteParams = Lex.prototype.substituteParams = function(actuals) {
  return new this.constructor(this.expr.substituteParams(actuals));
};
Apply.prototype.substituteParams = function(actuals) {
  if (this.args.length === 0) {
    return this;
  } else {
    const args = this.args.map((arg) => arg.substituteParams(actuals));
    return new Apply(this.ruleName, args);
  }
};
function isRestrictedJSIdentifier(str) {
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str);
}
function resolveDuplicatedNames(argumentNameList) {
  const count = Object.create(null);
  argumentNameList.forEach((argName) => {
    count[argName] = (count[argName] || 0) + 1;
  });
  Object.keys(count).forEach((dupArgName) => {
    if (count[dupArgName] <= 1) {
      return;
    }
    let subscript = 1;
    argumentNameList.forEach((argName, idx) => {
      if (argName === dupArgName) {
        argumentNameList[idx] = argName + "_" + subscript++;
      }
    });
  });
}
PExpr.prototype.toArgumentNameList = abstract("toArgumentNameList");
any.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["any"];
};
end.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["end"];
};
Terminal.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  if (typeof this.obj === "string" && /^[_a-zA-Z0-9]+$/.test(this.obj)) {
    return ["_" + this.obj];
  } else {
    return ["$" + firstArgIndex];
  }
};
Range.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  let argName = this.from + "_to_" + this.to;
  if (!isRestrictedJSIdentifier(argName)) {
    argName = "_" + argName;
  }
  if (!isRestrictedJSIdentifier(argName)) {
    argName = "$" + firstArgIndex;
  }
  return [argName];
};
Alt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  const termArgNameLists = this.terms.map((term) => term.toArgumentNameList(firstArgIndex, true));
  const argumentNameList = [];
  const numArgs = termArgNameLists[0].length;
  for (let colIdx = 0; colIdx < numArgs; colIdx++) {
    const col = [];
    for (let rowIdx = 0; rowIdx < this.terms.length; rowIdx++) {
      col.push(termArgNameLists[rowIdx][colIdx]);
    }
    const uniqueNames = copyWithoutDuplicates(col);
    argumentNameList.push(uniqueNames.join("_or_"));
  }
  if (!noDupCheck) {
    resolveDuplicatedNames(argumentNameList);
  }
  return argumentNameList;
};
Seq.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  let argumentNameList = [];
  this.factors.forEach((factor) => {
    const factorArgumentNameList = factor.toArgumentNameList(firstArgIndex, true);
    argumentNameList = argumentNameList.concat(factorArgumentNameList);
    firstArgIndex += factorArgumentNameList.length;
  });
  if (!noDupCheck) {
    resolveDuplicatedNames(argumentNameList);
  }
  return argumentNameList;
};
Iter.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  const argumentNameList = this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map((exprArgumentString) => exprArgumentString[exprArgumentString.length - 1] === "s" ? exprArgumentString + "es" : exprArgumentString + "s");
  if (!noDupCheck) {
    resolveDuplicatedNames(argumentNameList);
  }
  return argumentNameList;
};
Opt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map((argName) => {
    return "opt" + argName[0].toUpperCase() + argName.slice(1);
  });
};
Not.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return [];
};
Lookahead.prototype.toArgumentNameList = Lex.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return this.expr.toArgumentNameList(firstArgIndex, noDupCheck);
};
Apply.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return [this.ruleName];
};
UnicodeChar.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["$" + firstArgIndex];
};
Param.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["param" + this.index];
};
PExpr.prototype.toDisplayString = abstract("toDisplayString");
Alt.prototype.toDisplayString = Seq.prototype.toDisplayString = function() {
  if (this.source) {
    return this.source.trimmed().contents;
  }
  return "[" + this.constructor.name + "]";
};
any.toDisplayString = end.toDisplayString = Iter.prototype.toDisplayString = Not.prototype.toDisplayString = Lookahead.prototype.toDisplayString = Lex.prototype.toDisplayString = Terminal.prototype.toDisplayString = Range.prototype.toDisplayString = Param.prototype.toDisplayString = function() {
  return this.toString();
};
Apply.prototype.toDisplayString = function() {
  if (this.args.length > 0) {
    const ps = this.args.map((arg) => arg.toDisplayString());
    return this.ruleName + "<" + ps.join(",") + ">";
  } else {
    return this.ruleName;
  }
};
UnicodeChar.prototype.toDisplayString = function() {
  return "Unicode [" + this.category + "] character";
};
function isValidType(type) {
  return type === "description" || type === "string" || type === "code";
}
var Failure = class {
  constructor(pexpr, text, type) {
    if (!isValidType(type)) {
      throw new Error("invalid Failure type: " + type);
    }
    this.pexpr = pexpr;
    this.text = text;
    this.type = type;
    this.fluffy = false;
  }
  getPExpr() {
    return this.pexpr;
  }
  getText() {
    return this.text;
  }
  getType() {
    return this.type;
  }
  isDescription() {
    return this.type === "description";
  }
  isStringTerminal() {
    return this.type === "string";
  }
  isCode() {
    return this.type === "code";
  }
  isFluffy() {
    return this.fluffy;
  }
  makeFluffy() {
    this.fluffy = true;
  }
  clearFluffy() {
    this.fluffy = false;
  }
  subsumes(that) {
    return this.getText() === that.getText() && this.type === that.type && (!this.isFluffy() || this.isFluffy() && that.isFluffy());
  }
  toString() {
    return this.type === "string" ? JSON.stringify(this.getText()) : this.getText();
  }
  clone() {
    const failure = new Failure(this.pexpr, this.text, this.type);
    if (this.isFluffy()) {
      failure.makeFluffy();
    }
    return failure;
  }
  toKey() {
    return this.toString() + "#" + this.type;
  }
};
PExpr.prototype.toFailure = abstract("toFailure");
any.toFailure = function(grammar2) {
  return new Failure(this, "any object", "description");
};
end.toFailure = function(grammar2) {
  return new Failure(this, "end of input", "description");
};
Terminal.prototype.toFailure = function(grammar2) {
  return new Failure(this, this.obj, "string");
};
Range.prototype.toFailure = function(grammar2) {
  return new Failure(this, JSON.stringify(this.from) + ".." + JSON.stringify(this.to), "code");
};
Not.prototype.toFailure = function(grammar2) {
  const description = this.expr === any ? "nothing" : "not " + this.expr.toFailure(grammar2);
  return new Failure(this, description, "description");
};
Lookahead.prototype.toFailure = function(grammar2) {
  return this.expr.toFailure(grammar2);
};
Apply.prototype.toFailure = function(grammar2) {
  let {description} = grammar2.rules[this.ruleName];
  if (!description) {
    const article = /^[aeiouAEIOU]/.test(this.ruleName) ? "an" : "a";
    description = article + " " + this.ruleName;
  }
  return new Failure(this, description, "description");
};
UnicodeChar.prototype.toFailure = function(grammar2) {
  return new Failure(this, "a Unicode [" + this.category + "] character", "description");
};
Alt.prototype.toFailure = function(grammar2) {
  const fs = this.terms.map((t) => t.toFailure(grammar2));
  const description = "(" + fs.join(" or ") + ")";
  return new Failure(this, description, "description");
};
Seq.prototype.toFailure = function(grammar2) {
  const fs = this.factors.map((f) => f.toFailure(grammar2));
  const description = "(" + fs.join(" ") + ")";
  return new Failure(this, description, "description");
};
Iter.prototype.toFailure = function(grammar2) {
  const description = "(" + this.expr.toFailure(grammar2) + this.operator + ")";
  return new Failure(this, description, "description");
};
PExpr.prototype.toString = abstract("toString");
any.toString = function() {
  return "any";
};
end.toString = function() {
  return "end";
};
Terminal.prototype.toString = function() {
  return JSON.stringify(this.obj);
};
Range.prototype.toString = function() {
  return JSON.stringify(this.from) + ".." + JSON.stringify(this.to);
};
Param.prototype.toString = function() {
  return "$" + this.index;
};
Lex.prototype.toString = function() {
  return "#(" + this.expr.toString() + ")";
};
Alt.prototype.toString = function() {
  return this.terms.length === 1 ? this.terms[0].toString() : "(" + this.terms.map((term) => term.toString()).join(" | ") + ")";
};
Seq.prototype.toString = function() {
  return this.factors.length === 1 ? this.factors[0].toString() : "(" + this.factors.map((factor) => factor.toString()).join(" ") + ")";
};
Iter.prototype.toString = function() {
  return this.expr + this.operator;
};
Not.prototype.toString = function() {
  return "~" + this.expr;
};
Lookahead.prototype.toString = function() {
  return "&" + this.expr;
};
Apply.prototype.toString = function() {
  if (this.args.length > 0) {
    const ps = this.args.map((arg) => arg.toString());
    return this.ruleName + "<" + ps.join(",") + ">";
  } else {
    return this.ruleName;
  }
};
UnicodeChar.prototype.toString = function() {
  return "\\p{" + this.category + "}";
};
var CaseInsensitiveTerminal = class extends PExpr {
  constructor(param) {
    super();
    this.obj = param;
  }
  _getString(state) {
    const terminal = state.currentApplication().args[this.obj.index];
    assert(terminal instanceof Terminal, "expected a Terminal expression");
    return terminal.obj;
  }
  allowsSkippingPrecedingSpace() {
    return true;
  }
  eval(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const matchStr = this._getString(state);
    if (!inputStream.matchString(matchStr, true)) {
      state.processFailure(origPos, this);
      return false;
    } else {
      state.pushBinding(new TerminalNode(matchStr.length), origPos);
      return true;
    }
  }
  getArity() {
    return 1;
  }
  substituteParams(actuals) {
    return new CaseInsensitiveTerminal(this.obj.substituteParams(actuals));
  }
  toDisplayString() {
    return this.obj.toDisplayString() + " (case-insensitive)";
  }
  toFailure(grammar2) {
    return new Failure(this, this.obj.toFailure(grammar2) + " (case-insensitive)", "description");
  }
  _isNullable(grammar2, memo) {
    return this.obj._isNullable(grammar2, memo);
  }
};
var builtInApplySyntacticBody;
awaitBuiltInRules((builtInRules) => {
  builtInApplySyntacticBody = builtInRules.rules.applySyntactic.body;
});
var applySpaces = new Apply("spaces");
var MatchState = class {
  constructor(matcher, startExpr, optPositionToRecordFailures) {
    this.matcher = matcher;
    this.startExpr = startExpr;
    this.grammar = matcher.grammar;
    this.input = matcher.getInput();
    this.inputStream = new InputStream(this.input);
    this.memoTable = matcher._memoTable;
    this.userData = void 0;
    this.doNotMemoize = false;
    this._bindings = [];
    this._bindingOffsets = [];
    this._applicationStack = [];
    this._posStack = [0];
    this.inLexifiedContextStack = [false];
    this.rightmostFailurePosition = -1;
    this._rightmostFailurePositionStack = [];
    this._recordedFailuresStack = [];
    if (optPositionToRecordFailures !== void 0) {
      this.positionToRecordFailures = optPositionToRecordFailures;
      this.recordedFailures = Object.create(null);
    }
  }
  posToOffset(pos) {
    return pos - this._posStack[this._posStack.length - 1];
  }
  enterApplication(posInfo, app) {
    this._posStack.push(this.inputStream.pos);
    this._applicationStack.push(app);
    this.inLexifiedContextStack.push(false);
    posInfo.enter(app);
    this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
    this.rightmostFailurePosition = -1;
  }
  exitApplication(posInfo, optNode) {
    const origPos = this._posStack.pop();
    this._applicationStack.pop();
    this.inLexifiedContextStack.pop();
    posInfo.exit();
    this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, this._rightmostFailurePositionStack.pop());
    if (optNode) {
      this.pushBinding(optNode, origPos);
    }
  }
  enterLexifiedContext() {
    this.inLexifiedContextStack.push(true);
  }
  exitLexifiedContext() {
    this.inLexifiedContextStack.pop();
  }
  currentApplication() {
    return this._applicationStack[this._applicationStack.length - 1];
  }
  inSyntacticContext() {
    const currentApplication = this.currentApplication();
    if (currentApplication) {
      return currentApplication.isSyntactic() && !this.inLexifiedContext();
    } else {
      return this.startExpr.factors[0].isSyntactic();
    }
  }
  inLexifiedContext() {
    return this.inLexifiedContextStack[this.inLexifiedContextStack.length - 1];
  }
  skipSpaces() {
    this.pushFailuresInfo();
    this.eval(applySpaces);
    this.popBinding();
    this.popFailuresInfo();
    return this.inputStream.pos;
  }
  skipSpacesIfInSyntacticContext() {
    return this.inSyntacticContext() ? this.skipSpaces() : this.inputStream.pos;
  }
  maybeSkipSpacesBefore(expr) {
    if (expr.allowsSkippingPrecedingSpace() && expr !== applySpaces) {
      return this.skipSpacesIfInSyntacticContext();
    } else {
      return this.inputStream.pos;
    }
  }
  pushBinding(node, origPos) {
    this._bindings.push(node);
    this._bindingOffsets.push(this.posToOffset(origPos));
  }
  popBinding() {
    this._bindings.pop();
    this._bindingOffsets.pop();
  }
  numBindings() {
    return this._bindings.length;
  }
  truncateBindings(newLength) {
    while (this._bindings.length > newLength) {
      this.popBinding();
    }
  }
  getCurrentPosInfo() {
    return this.getPosInfo(this.inputStream.pos);
  }
  getPosInfo(pos) {
    let posInfo = this.memoTable[pos];
    if (!posInfo) {
      posInfo = this.memoTable[pos] = new PosInfo();
    }
    return posInfo;
  }
  processFailure(pos, expr) {
    this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, pos);
    if (this.recordedFailures && pos === this.positionToRecordFailures) {
      const app = this.currentApplication();
      if (app) {
        expr = expr.substituteParams(app.args);
      }
      this.recordFailure(expr.toFailure(this.grammar), false);
    }
  }
  recordFailure(failure, shouldCloneIfNew) {
    const key = failure.toKey();
    if (!this.recordedFailures[key]) {
      this.recordedFailures[key] = shouldCloneIfNew ? failure.clone() : failure;
    } else if (this.recordedFailures[key].isFluffy() && !failure.isFluffy()) {
      this.recordedFailures[key].clearFluffy();
    }
  }
  recordFailures(failures, shouldCloneIfNew) {
    Object.keys(failures).forEach((key) => {
      this.recordFailure(failures[key], shouldCloneIfNew);
    });
  }
  cloneRecordedFailures() {
    if (!this.recordedFailures) {
      return void 0;
    }
    const ans = Object.create(null);
    Object.keys(this.recordedFailures).forEach((key) => {
      ans[key] = this.recordedFailures[key].clone();
    });
    return ans;
  }
  getRightmostFailurePosition() {
    return this.rightmostFailurePosition;
  }
  _getRightmostFailureOffset() {
    return this.rightmostFailurePosition >= 0 ? this.posToOffset(this.rightmostFailurePosition) : -1;
  }
  getMemoizedTraceEntry(pos, expr) {
    const posInfo = this.memoTable[pos];
    if (posInfo && expr instanceof Apply) {
      const memoRec = posInfo.memo[expr.toMemoKey()];
      if (memoRec && memoRec.traceEntry) {
        const entry = memoRec.traceEntry.cloneWithExpr(expr);
        entry.isMemoized = true;
        return entry;
      }
    }
    return null;
  }
  getTraceEntry(pos, expr, succeeded, bindings) {
    if (expr instanceof Apply) {
      const app = this.currentApplication();
      const actuals = app ? app.args : [];
      expr = expr.substituteParams(actuals);
    }
    return this.getMemoizedTraceEntry(pos, expr) || new Trace(this.input, pos, this.inputStream.pos, expr, succeeded, bindings, this.trace);
  }
  isTracing() {
    return !!this.trace;
  }
  hasNecessaryInfo(memoRec) {
    if (this.trace && !memoRec.traceEntry) {
      return false;
    }
    if (this.recordedFailures && this.inputStream.pos + memoRec.rightmostFailureOffset === this.positionToRecordFailures) {
      return !!memoRec.failuresAtRightmostPosition;
    }
    return true;
  }
  useMemoizedResult(origPos, memoRec) {
    if (this.trace) {
      this.trace.push(memoRec.traceEntry);
    }
    const memoRecRightmostFailurePosition = this.inputStream.pos + memoRec.rightmostFailureOffset;
    this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, memoRecRightmostFailurePosition);
    if (this.recordedFailures && this.positionToRecordFailures === memoRecRightmostFailurePosition && memoRec.failuresAtRightmostPosition) {
      this.recordFailures(memoRec.failuresAtRightmostPosition, true);
    }
    this.inputStream.examinedLength = Math.max(this.inputStream.examinedLength, memoRec.examinedLength + origPos);
    if (memoRec.value) {
      this.inputStream.pos += memoRec.matchLength;
      this.pushBinding(memoRec.value, origPos);
      return true;
    }
    return false;
  }
  eval(expr) {
    const {inputStream} = this;
    const origNumBindings = this._bindings.length;
    const origUserData = this.userData;
    let origRecordedFailures;
    if (this.recordedFailures) {
      origRecordedFailures = this.recordedFailures;
      this.recordedFailures = Object.create(null);
    }
    const origPos = inputStream.pos;
    const memoPos = this.maybeSkipSpacesBefore(expr);
    let origTrace;
    if (this.trace) {
      origTrace = this.trace;
      this.trace = [];
    }
    const ans = expr.eval(this);
    if (this.trace) {
      const bindings = this._bindings.slice(origNumBindings);
      const traceEntry = this.getTraceEntry(memoPos, expr, ans, bindings);
      traceEntry.isImplicitSpaces = expr === applySpaces;
      traceEntry.isRootNode = expr === this.startExpr;
      origTrace.push(traceEntry);
      this.trace = origTrace;
    }
    if (ans) {
      if (this.recordedFailures && inputStream.pos === this.positionToRecordFailures) {
        Object.keys(this.recordedFailures).forEach((key) => {
          this.recordedFailures[key].makeFluffy();
        });
      }
    } else {
      inputStream.pos = origPos;
      this.truncateBindings(origNumBindings);
      this.userData = origUserData;
    }
    if (this.recordedFailures) {
      this.recordFailures(origRecordedFailures, false);
    }
    if (expr === builtInApplySyntacticBody) {
      this.skipSpaces();
    }
    return ans;
  }
  getMatchResult() {
    this.grammar._setUpMatchState(this);
    this.eval(this.startExpr);
    let rightmostFailures;
    if (this.recordedFailures) {
      rightmostFailures = Object.keys(this.recordedFailures).map((key) => this.recordedFailures[key]);
    }
    const cst = this._bindings[0];
    if (cst) {
      cst.grammar = this.grammar;
    }
    return new MatchResult(this.matcher, this.input, this.startExpr, cst, this._bindingOffsets[0], this.rightmostFailurePosition, rightmostFailures);
  }
  getTrace() {
    this.trace = [];
    const matchResult = this.getMatchResult();
    const rootTrace = this.trace[this.trace.length - 1];
    rootTrace.result = matchResult;
    return rootTrace;
  }
  pushFailuresInfo() {
    this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
    this._recordedFailuresStack.push(this.recordedFailures);
  }
  popFailuresInfo() {
    this.rightmostFailurePosition = this._rightmostFailurePositionStack.pop();
    this.recordedFailures = this._recordedFailuresStack.pop();
  }
};
var Matcher = class {
  constructor(grammar2) {
    this.grammar = grammar2;
    this._memoTable = [];
    this._input = "";
    this._isMemoTableStale = false;
  }
  _resetMemoTable() {
    this._memoTable = [];
    this._isMemoTableStale = false;
  }
  getInput() {
    return this._input;
  }
  setInput(str) {
    if (this._input !== str) {
      this.replaceInputRange(0, this._input.length, str);
    }
    return this;
  }
  replaceInputRange(startIdx, endIdx, str) {
    const prevInput = this._input;
    const memoTable = this._memoTable;
    if (startIdx < 0 || startIdx > prevInput.length || endIdx < 0 || endIdx > prevInput.length || startIdx > endIdx) {
      throw new Error("Invalid indices: " + startIdx + " and " + endIdx);
    }
    this._input = prevInput.slice(0, startIdx) + str + prevInput.slice(endIdx);
    if (this._input !== prevInput && memoTable.length > 0) {
      this._isMemoTableStale = true;
    }
    const restOfMemoTable = memoTable.slice(endIdx);
    memoTable.length = startIdx;
    for (let idx = 0; idx < str.length; idx++) {
      memoTable.push(void 0);
    }
    for (const posInfo of restOfMemoTable) {
      memoTable.push(posInfo);
    }
    for (let pos = 0; pos < startIdx; pos++) {
      const posInfo = memoTable[pos];
      if (posInfo) {
        posInfo.clearObsoleteEntries(pos, startIdx);
      }
    }
    return this;
  }
  match(optStartApplicationStr, options = {incremental: true}) {
    return this._match(this._getStartExpr(optStartApplicationStr), {
      incremental: options.incremental,
      tracing: false
    });
  }
  trace(optStartApplicationStr, options = {incremental: true}) {
    return this._match(this._getStartExpr(optStartApplicationStr), {
      incremental: options.incremental,
      tracing: true
    });
  }
  _match(startExpr, options = {}) {
    const opts = {
      tracing: false,
      incremental: true,
      positionToRecordFailures: void 0,
      ...options
    };
    if (!opts.incremental) {
      this._resetMemoTable();
    } else if (this._isMemoTableStale && !this.grammar.supportsIncrementalParsing) {
      throw grammarDoesNotSupportIncrementalParsing(this.grammar);
    }
    const state = new MatchState(this, startExpr, opts.positionToRecordFailures);
    return opts.tracing ? state.getTrace() : state.getMatchResult();
  }
  _getStartExpr(optStartApplicationStr) {
    const applicationStr = optStartApplicationStr || this.grammar.defaultStartRule;
    if (!applicationStr) {
      throw new Error("Missing start rule argument -- the grammar has no default start rule.");
    }
    const startApp = this.grammar.parseApplication(applicationStr);
    return new Seq([startApp, end]);
  }
};
var globalActionStack = [];
var hasOwnProperty = (x, prop) => Object.prototype.hasOwnProperty.call(x, prop);
var Wrapper = class {
  constructor(node, sourceInterval, baseInterval) {
    this._node = node;
    this.source = sourceInterval;
    this._baseInterval = baseInterval;
    if (node.isNonterminal()) {
      assert(sourceInterval === baseInterval);
    }
    this._childWrappers = [];
  }
  _forgetMemoizedResultFor(attributeName) {
    delete this._node[this._semantics.attributeKeys[attributeName]];
    this.children.forEach((child) => {
      child._forgetMemoizedResultFor(attributeName);
    });
  }
  child(idx) {
    if (!(0 <= idx && idx < this._node.numChildren())) {
      return void 0;
    }
    let childWrapper = this._childWrappers[idx];
    if (!childWrapper) {
      const childNode = this._node.childAt(idx);
      const offset = this._node.childOffsets[idx];
      const source = this._baseInterval.subInterval(offset, childNode.matchLength);
      const base = childNode.isNonterminal() ? source : this._baseInterval;
      childWrapper = this._childWrappers[idx] = this._semantics.wrap(childNode, source, base);
    }
    return childWrapper;
  }
  _children() {
    for (let idx = 0; idx < this._node.numChildren(); idx++) {
      this.child(idx);
    }
    return this._childWrappers;
  }
  isIteration() {
    return this._node.isIteration();
  }
  isTerminal() {
    return this._node.isTerminal();
  }
  isNonterminal() {
    return this._node.isNonterminal();
  }
  isSyntactic() {
    return this.isNonterminal() && this._node.isSyntactic();
  }
  isLexical() {
    return this.isNonterminal() && this._node.isLexical();
  }
  isOptional() {
    return this._node.isOptional();
  }
  iteration(optChildWrappers) {
    const childWrappers = optChildWrappers || [];
    const childNodes = childWrappers.map((c) => c._node);
    const iter = new IterationNode(childNodes, [], -1, false);
    const wrapper = this._semantics.wrap(iter, null, null);
    wrapper._childWrappers = childWrappers;
    return wrapper;
  }
  get children() {
    return this._children();
  }
  get ctorName() {
    return this._node.ctorName;
  }
  get numChildren() {
    return this._node.numChildren();
  }
  get sourceString() {
    return this.source.contents;
  }
};
var Semantics = class {
  constructor(grammar2, superSemantics) {
    const self2 = this;
    this.grammar = grammar2;
    this.checkedActionDicts = false;
    this.Wrapper = class extends (superSemantics ? superSemantics.Wrapper : Wrapper) {
      constructor(node, sourceInterval, baseInterval) {
        super(node, sourceInterval, baseInterval);
        self2.checkActionDictsIfHaventAlready();
        this._semantics = self2;
      }
      toString() {
        return "[semantics wrapper for " + self2.grammar.name + "]";
      }
    };
    this.super = superSemantics;
    if (superSemantics) {
      if (!(grammar2.equals(this.super.grammar) || grammar2._inheritsFrom(this.super.grammar))) {
        throw new Error("Cannot extend a semantics for grammar '" + this.super.grammar.name + "' for use with grammar '" + grammar2.name + "' (not a sub-grammar)");
      }
      this.operations = Object.create(this.super.operations);
      this.attributes = Object.create(this.super.attributes);
      this.attributeKeys = Object.create(null);
      for (const attributeName in this.attributes) {
        Object.defineProperty(this.attributeKeys, attributeName, {
          value: uniqueId(attributeName)
        });
      }
    } else {
      this.operations = Object.create(null);
      this.attributes = Object.create(null);
      this.attributeKeys = Object.create(null);
    }
  }
  toString() {
    return "[semantics for " + this.grammar.name + "]";
  }
  checkActionDictsIfHaventAlready() {
    if (!this.checkedActionDicts) {
      this.checkActionDicts();
      this.checkedActionDicts = true;
    }
  }
  checkActionDicts() {
    let name;
    for (name in this.operations) {
      this.operations[name].checkActionDict(this.grammar);
    }
    for (name in this.attributes) {
      this.attributes[name].checkActionDict(this.grammar);
    }
  }
  toRecipe(semanticsOnly) {
    function hasSuperSemantics(s) {
      return s.super !== Semantics.BuiltInSemantics._getSemantics();
    }
    let str = "(function(g) {\n";
    if (hasSuperSemantics(this)) {
      str += "  var semantics = " + this.super.toRecipe(true) + "(g";
      const superSemanticsGrammar = this.super.grammar;
      let relatedGrammar = this.grammar;
      while (relatedGrammar !== superSemanticsGrammar) {
        str += ".superGrammar";
        relatedGrammar = relatedGrammar.superGrammar;
      }
      str += ");\n";
      str += "  return g.extendSemantics(semantics)";
    } else {
      str += "  return g.createSemantics()";
    }
    ["Operation", "Attribute"].forEach((type) => {
      const semanticOperations = this[type.toLowerCase() + "s"];
      Object.keys(semanticOperations).forEach((name) => {
        const {actionDict, formals, builtInDefault} = semanticOperations[name];
        let signature = name;
        if (formals.length > 0) {
          signature += "(" + formals.join(", ") + ")";
        }
        let method;
        if (hasSuperSemantics(this) && this.super[type.toLowerCase() + "s"][name]) {
          method = "extend" + type;
        } else {
          method = "add" + type;
        }
        str += "\n    ." + method + "(" + JSON.stringify(signature) + ", {";
        const srcArray = [];
        Object.keys(actionDict).forEach((actionName) => {
          if (actionDict[actionName] !== builtInDefault) {
            let source = actionDict[actionName].toString().trim();
            source = source.replace(/^.*\(/, "function(");
            srcArray.push("\n      " + JSON.stringify(actionName) + ": " + source);
          }
        });
        str += srcArray.join(",") + "\n    })";
      });
    });
    str += ";\n  })";
    if (!semanticsOnly) {
      str = "(function() {\n  var grammar = this.fromRecipe(" + this.grammar.toRecipe() + ");\n  var semantics = " + str + "(grammar);\n  return semantics;\n});\n";
    }
    return str;
  }
  addOperationOrAttribute(type, signature, actionDict) {
    const typePlural = type + "s";
    const parsedNameAndFormalArgs = parseSignature(signature, type);
    const {name} = parsedNameAndFormalArgs;
    const {formals} = parsedNameAndFormalArgs;
    this.assertNewName(name, type);
    const builtInDefault = newDefaultAction(type, name, doIt);
    const realActionDict = {_default: builtInDefault};
    Object.keys(actionDict).forEach((name2) => {
      realActionDict[name2] = actionDict[name2];
    });
    const entry = type === "operation" ? new Operation(name, formals, realActionDict, builtInDefault) : new Attribute(name, realActionDict, builtInDefault);
    entry.checkActionDict(this.grammar);
    this[typePlural][name] = entry;
    function doIt(...args) {
      const thisThing = this._semantics[typePlural][name];
      if (arguments.length !== thisThing.formals.length) {
        throw new Error("Invalid number of arguments passed to " + name + " " + type + " (expected " + thisThing.formals.length + ", got " + arguments.length + ")");
      }
      const argsObj = Object.create(null);
      for (const [idx, val] of Object.entries(args)) {
        const formal = thisThing.formals[idx];
        argsObj[formal] = val;
      }
      const oldArgs = this.args;
      this.args = argsObj;
      const ans = thisThing.execute(this._semantics, this);
      this.args = oldArgs;
      return ans;
    }
    if (type === "operation") {
      this.Wrapper.prototype[name] = doIt;
      this.Wrapper.prototype[name].toString = function() {
        return "[" + name + " operation]";
      };
    } else {
      Object.defineProperty(this.Wrapper.prototype, name, {
        get: doIt,
        configurable: true
      });
      Object.defineProperty(this.attributeKeys, name, {
        value: uniqueId(name)
      });
    }
  }
  extendOperationOrAttribute(type, name, actionDict) {
    const typePlural = type + "s";
    parseSignature(name, "attribute");
    if (!(this.super && name in this.super[typePlural])) {
      throw new Error("Cannot extend " + type + " '" + name + "': did not inherit an " + type + " with that name");
    }
    if (hasOwnProperty(this[typePlural], name)) {
      throw new Error("Cannot extend " + type + " '" + name + "' again");
    }
    const inheritedFormals = this[typePlural][name].formals;
    const inheritedActionDict = this[typePlural][name].actionDict;
    const newActionDict = Object.create(inheritedActionDict);
    Object.keys(actionDict).forEach((name2) => {
      newActionDict[name2] = actionDict[name2];
    });
    this[typePlural][name] = type === "operation" ? new Operation(name, inheritedFormals, newActionDict) : new Attribute(name, newActionDict);
    this[typePlural][name].checkActionDict(this.grammar);
  }
  assertNewName(name, type) {
    if (hasOwnProperty(Wrapper.prototype, name)) {
      throw new Error("Cannot add " + type + " '" + name + "': that's a reserved name");
    }
    if (name in this.operations) {
      throw new Error("Cannot add " + type + " '" + name + "': an operation with that name already exists");
    }
    if (name in this.attributes) {
      throw new Error("Cannot add " + type + " '" + name + "': an attribute with that name already exists");
    }
  }
  wrap(node, source, optBaseInterval) {
    const baseInterval = optBaseInterval || source;
    return node instanceof this.Wrapper ? node : new this.Wrapper(node, source, baseInterval);
  }
};
function parseSignature(signature, type) {
  if (!Semantics.prototypeGrammar) {
    assert(signature.indexOf("(") === -1);
    return {
      name: signature,
      formals: []
    };
  }
  const r = Semantics.prototypeGrammar.match(signature, type === "operation" ? "OperationSignature" : "AttributeSignature");
  if (r.failed()) {
    throw new Error(r.message);
  }
  return Semantics.prototypeGrammarSemantics(r).parse();
}
function newDefaultAction(type, name, doIt) {
  return function(...children) {
    const thisThing = this._semantics.operations[name] || this._semantics.attributes[name];
    const args = thisThing.formals.map((formal) => this.args[formal]);
    if (!this.isIteration() && children.length === 1) {
      return doIt.apply(children[0], args);
    } else {
      throw missingSemanticAction(this.ctorName, name, type, globalActionStack);
    }
  };
}
Semantics.createSemantics = function(grammar2, optSuperSemantics) {
  const s = new Semantics(grammar2, optSuperSemantics !== void 0 ? optSuperSemantics : Semantics.BuiltInSemantics._getSemantics());
  const proxy = function ASemantics(matchResult) {
    if (!(matchResult instanceof MatchResult)) {
      throw new TypeError("Semantics expected a MatchResult, but got " + unexpectedObjToString(matchResult));
    }
    if (matchResult.failed()) {
      throw new TypeError("cannot apply Semantics to " + matchResult.toString());
    }
    const cst = matchResult._cst;
    if (cst.grammar !== grammar2) {
      throw new Error("Cannot use a MatchResult from grammar '" + cst.grammar.name + "' with a semantics for '" + grammar2.name + "'");
    }
    const inputStream = new InputStream(matchResult.input);
    return s.wrap(cst, inputStream.interval(matchResult._cstOffset, matchResult.input.length));
  };
  proxy.addOperation = function(signature, actionDict) {
    s.addOperationOrAttribute("operation", signature, actionDict);
    return proxy;
  };
  proxy.extendOperation = function(name, actionDict) {
    s.extendOperationOrAttribute("operation", name, actionDict);
    return proxy;
  };
  proxy.addAttribute = function(name, actionDict) {
    s.addOperationOrAttribute("attribute", name, actionDict);
    return proxy;
  };
  proxy.extendAttribute = function(name, actionDict) {
    s.extendOperationOrAttribute("attribute", name, actionDict);
    return proxy;
  };
  proxy._getActionDict = function(operationOrAttributeName) {
    const action = s.operations[operationOrAttributeName] || s.attributes[operationOrAttributeName];
    if (!action) {
      throw new Error('"' + operationOrAttributeName + '" is not a valid operation or attribute name in this semantics for "' + grammar2.name + '"');
    }
    return action.actionDict;
  };
  proxy._remove = function(operationOrAttributeName) {
    let semantic;
    if (operationOrAttributeName in s.operations) {
      semantic = s.operations[operationOrAttributeName];
      delete s.operations[operationOrAttributeName];
    } else if (operationOrAttributeName in s.attributes) {
      semantic = s.attributes[operationOrAttributeName];
      delete s.attributes[operationOrAttributeName];
    }
    delete s.Wrapper.prototype[operationOrAttributeName];
    return semantic;
  };
  proxy.getOperationNames = function() {
    return Object.keys(s.operations);
  };
  proxy.getAttributeNames = function() {
    return Object.keys(s.attributes);
  };
  proxy.getGrammar = function() {
    return s.grammar;
  };
  proxy.toRecipe = function(semanticsOnly) {
    return s.toRecipe(semanticsOnly);
  };
  proxy.toString = s.toString.bind(s);
  proxy._getSemantics = function() {
    return s;
  };
  return proxy;
};
var Operation = class {
  constructor(name, formals, actionDict, builtInDefault) {
    this.name = name;
    this.formals = formals;
    this.actionDict = actionDict;
    this.builtInDefault = builtInDefault;
  }
  checkActionDict(grammar2) {
    grammar2._checkTopDownActionDict(this.typeName, this.name, this.actionDict);
  }
  execute(semantics, nodeWrapper) {
    try {
      const {ctorName} = nodeWrapper._node;
      let actionFn = this.actionDict[ctorName];
      if (actionFn) {
        globalActionStack.push([this, ctorName]);
        return actionFn.apply(nodeWrapper, nodeWrapper._children());
      }
      if (nodeWrapper.isNonterminal()) {
        actionFn = this.actionDict._nonterminal;
        if (actionFn) {
          globalActionStack.push([this, "_nonterminal", ctorName]);
          return actionFn.apply(nodeWrapper, nodeWrapper._children());
        }
      }
      globalActionStack.push([this, "default action", ctorName]);
      return this.actionDict._default.apply(nodeWrapper, nodeWrapper._children());
    } finally {
      globalActionStack.pop();
    }
  }
};
Operation.prototype.typeName = "operation";
var Attribute = class extends Operation {
  constructor(name, actionDict, builtInDefault) {
    super(name, [], actionDict, builtInDefault);
  }
  execute(semantics, nodeWrapper) {
    const node = nodeWrapper._node;
    const key = semantics.attributeKeys[this.name];
    if (!hasOwnProperty(node, key)) {
      node[key] = Operation.prototype.execute.call(this, semantics, nodeWrapper);
    }
    return node[key];
  }
};
Attribute.prototype.typeName = "attribute";
var SPECIAL_ACTION_NAMES = ["_iter", "_terminal", "_nonterminal", "_default"];
function getSortedRuleValues(grammar2) {
  return Object.keys(grammar2.rules).sort().map((name) => grammar2.rules[name]);
}
var jsonToJS = (str) => str.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
var ohmGrammar$1;
var buildGrammar$1;
var Grammar = class {
  constructor(name, superGrammar, rules, optDefaultStartRule) {
    this.name = name;
    this.superGrammar = superGrammar;
    this.rules = rules;
    if (optDefaultStartRule) {
      if (!(optDefaultStartRule in rules)) {
        throw new Error("Invalid start rule: '" + optDefaultStartRule + "' is not a rule in grammar '" + name + "'");
      }
      this.defaultStartRule = optDefaultStartRule;
    }
    this._matchStateInitializer = void 0;
    this.supportsIncrementalParsing = true;
  }
  matcher() {
    return new Matcher(this);
  }
  isBuiltIn() {
    return this === Grammar.ProtoBuiltInRules || this === Grammar.BuiltInRules;
  }
  equals(g) {
    if (this === g) {
      return true;
    }
    if (g == null || this.name !== g.name || this.defaultStartRule !== g.defaultStartRule || !(this.superGrammar === g.superGrammar || this.superGrammar.equals(g.superGrammar))) {
      return false;
    }
    const myRules = getSortedRuleValues(this);
    const otherRules = getSortedRuleValues(g);
    return myRules.length === otherRules.length && myRules.every((rule, i) => {
      return rule.description === otherRules[i].description && rule.formals.join(",") === otherRules[i].formals.join(",") && rule.body.toString() === otherRules[i].body.toString();
    });
  }
  match(input, optStartApplication) {
    const m = this.matcher();
    m.replaceInputRange(0, 0, input);
    return m.match(optStartApplication);
  }
  trace(input, optStartApplication) {
    const m = this.matcher();
    m.replaceInputRange(0, 0, input);
    return m.trace(optStartApplication);
  }
  createSemantics() {
    return Semantics.createSemantics(this);
  }
  extendSemantics(superSemantics) {
    return Semantics.createSemantics(this, superSemantics._getSemantics());
  }
  _checkTopDownActionDict(what, name, actionDict) {
    const problems = [];
    for (const k in actionDict) {
      const v = actionDict[k];
      const isSpecialAction = SPECIAL_ACTION_NAMES.includes(k);
      if (!isSpecialAction && !(k in this.rules)) {
        problems.push(`'${k}' is not a valid semantic action for '${this.name}'`);
        continue;
      }
      if (typeof v !== "function") {
        problems.push(`'${k}' must be a function in an action dictionary for '${this.name}'`);
        continue;
      }
      const actual = v.length;
      const expected = this._topDownActionArity(k);
      if (actual !== expected) {
        let details;
        if (k === "_iter" || k === "_nonterminal") {
          details = `it should use a rest parameter, e.g. \`${k}(...children) {}\`. NOTE: this is new in Ohm v16 \u2014 see https://ohmjs.org/d/ati for details.`;
        } else {
          details = `expected ${expected}, got ${actual}`;
        }
        problems.push(`Semantic action '${k}' has the wrong arity: ${details}`);
      }
    }
    if (problems.length > 0) {
      const prettyProblems = problems.map((problem) => "- " + problem);
      const error = new Error([
        `Found errors in the action dictionary of the '${name}' ${what}:`,
        ...prettyProblems
      ].join("\n"));
      error.problems = problems;
      throw error;
    }
  }
  _topDownActionArity(actionName) {
    return SPECIAL_ACTION_NAMES.includes(actionName) ? 0 : this.rules[actionName].body.getArity();
  }
  _inheritsFrom(grammar2) {
    let g = this.superGrammar;
    while (g) {
      if (g.equals(grammar2, true)) {
        return true;
      }
      g = g.superGrammar;
    }
    return false;
  }
  toRecipe(superGrammarExpr = void 0) {
    const metaInfo = {};
    if (this.source) {
      metaInfo.source = this.source.contents;
    }
    let startRule = null;
    if (this.defaultStartRule) {
      startRule = this.defaultStartRule;
    }
    const rules = {};
    Object.keys(this.rules).forEach((ruleName) => {
      const ruleInfo = this.rules[ruleName];
      const {body} = ruleInfo;
      const isDefinition = !this.superGrammar || !this.superGrammar.rules[ruleName];
      let operation;
      if (isDefinition) {
        operation = "define";
      } else {
        operation = body instanceof Extend ? "extend" : "override";
      }
      const metaInfo2 = {};
      if (ruleInfo.source && this.source) {
        const adjusted = ruleInfo.source.relativeTo(this.source);
        metaInfo2.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
      }
      const description = isDefinition ? ruleInfo.description : null;
      const bodyRecipe = body.outputRecipe(ruleInfo.formals, this.source);
      rules[ruleName] = [
        operation,
        metaInfo2,
        description,
        ruleInfo.formals,
        bodyRecipe
      ];
    });
    let superGrammarOutput = "null";
    if (superGrammarExpr) {
      superGrammarOutput = superGrammarExpr;
    } else if (this.superGrammar && !this.superGrammar.isBuiltIn()) {
      superGrammarOutput = this.superGrammar.toRecipe();
    }
    const recipeElements = [
      ...["grammar", metaInfo, this.name].map(JSON.stringify),
      superGrammarOutput,
      ...[startRule, rules].map(JSON.stringify)
    ];
    return jsonToJS(`[${recipeElements.join(",")}]`);
  }
  toOperationActionDictionaryTemplate() {
    return this._toOperationOrAttributeActionDictionaryTemplate();
  }
  toAttributeActionDictionaryTemplate() {
    return this._toOperationOrAttributeActionDictionaryTemplate();
  }
  _toOperationOrAttributeActionDictionaryTemplate() {
    const sb = new StringBuffer();
    sb.append("{");
    let first = true;
    for (const ruleName in this.rules) {
      const {body} = this.rules[ruleName];
      if (first) {
        first = false;
      } else {
        sb.append(",");
      }
      sb.append("\n");
      sb.append("  ");
      this.addSemanticActionTemplate(ruleName, body, sb);
    }
    sb.append("\n}");
    return sb.contents();
  }
  addSemanticActionTemplate(ruleName, body, sb) {
    sb.append(ruleName);
    sb.append(": function(");
    const arity = this._topDownActionArity(ruleName);
    sb.append(repeat("_", arity).join(", "));
    sb.append(") {\n");
    sb.append("  }");
  }
  parseApplication(str) {
    let app;
    if (str.indexOf("<") === -1) {
      app = new Apply(str);
    } else {
      const cst = ohmGrammar$1.match(str, "Base_application");
      app = buildGrammar$1(cst, {});
    }
    if (!(app.ruleName in this.rules)) {
      throw undeclaredRule(app.ruleName, this.name);
    }
    const {formals} = this.rules[app.ruleName];
    if (formals.length !== app.args.length) {
      const {source} = this.rules[app.ruleName];
      throw wrongNumberOfParameters(app.ruleName, formals.length, app.args.length, source);
    }
    return app;
  }
  _setUpMatchState(state) {
    if (this._matchStateInitializer) {
      this._matchStateInitializer(state);
    }
  }
};
Grammar.ProtoBuiltInRules = new Grammar("ProtoBuiltInRules", void 0, {
  any: {
    body: any,
    formals: [],
    description: "any character",
    primitive: true
  },
  end: {
    body: end,
    formals: [],
    description: "end of input",
    primitive: true
  },
  caseInsensitive: {
    body: new CaseInsensitiveTerminal(new Param(0)),
    formals: ["str"],
    primitive: true
  },
  lower: {
    body: new UnicodeChar("Ll"),
    formals: [],
    description: "a lowercase letter",
    primitive: true
  },
  upper: {
    body: new UnicodeChar("Lu"),
    formals: [],
    description: "an uppercase letter",
    primitive: true
  },
  unicodeLtmo: {
    body: new UnicodeChar("Ltmo"),
    formals: [],
    description: "a Unicode character in Lt, Lm, or Lo",
    primitive: true
  },
  spaces: {
    body: new Star(new Apply("space")),
    formals: []
  },
  space: {
    body: new Range("\0", " "),
    formals: [],
    description: "a space"
  }
});
Grammar.initApplicationParser = function(grammar2, builderFn) {
  ohmGrammar$1 = grammar2;
  buildGrammar$1 = builderFn;
};
var GrammarDecl = class {
  constructor(name) {
    this.name = name;
  }
  sourceInterval(startIdx, endIdx) {
    return this.source.subInterval(startIdx, endIdx - startIdx);
  }
  ensureSuperGrammar() {
    if (!this.superGrammar) {
      this.withSuperGrammar(this.name === "BuiltInRules" ? Grammar.ProtoBuiltInRules : Grammar.BuiltInRules);
    }
    return this.superGrammar;
  }
  ensureSuperGrammarRuleForOverriding(name, source) {
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    if (!ruleInfo) {
      throw cannotOverrideUndeclaredRule(name, this.superGrammar.name, source);
    }
    return ruleInfo;
  }
  installOverriddenOrExtendedRule(name, formals, body, source) {
    const duplicateParameterNames$1 = getDuplicates(formals);
    if (duplicateParameterNames$1.length > 0) {
      throw duplicateParameterNames(name, duplicateParameterNames$1, source);
    }
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    const expectedFormals = ruleInfo.formals;
    const expectedNumFormals = expectedFormals ? expectedFormals.length : 0;
    if (formals.length !== expectedNumFormals) {
      throw wrongNumberOfParameters(name, expectedNumFormals, formals.length, source);
    }
    return this.install(name, formals, body, ruleInfo.description, source);
  }
  install(name, formals, body, description, source, primitive = false) {
    this.rules[name] = {
      body: body.introduceParams(formals),
      formals,
      description,
      source,
      primitive
    };
    return this;
  }
  withSuperGrammar(superGrammar) {
    if (this.superGrammar) {
      throw new Error("the super grammar of a GrammarDecl cannot be set more than once");
    }
    this.superGrammar = superGrammar;
    this.rules = Object.create(superGrammar.rules);
    if (!superGrammar.isBuiltIn()) {
      this.defaultStartRule = superGrammar.defaultStartRule;
    }
    return this;
  }
  withDefaultStartRule(ruleName) {
    this.defaultStartRule = ruleName;
    return this;
  }
  withSource(source) {
    this.source = new InputStream(source).interval(0, source.length);
    return this;
  }
  build() {
    const grammar2 = new Grammar(this.name, this.ensureSuperGrammar(), this.rules, this.defaultStartRule);
    grammar2._matchStateInitializer = grammar2.superGrammar._matchStateInitializer;
    grammar2.supportsIncrementalParsing = grammar2.superGrammar.supportsIncrementalParsing;
    const grammarErrors = [];
    let grammarHasInvalidApplications = false;
    Object.keys(grammar2.rules).forEach((ruleName) => {
      const {body} = grammar2.rules[ruleName];
      try {
        body.assertChoicesHaveUniformArity(ruleName);
      } catch (e) {
        grammarErrors.push(e);
      }
      try {
        body.assertAllApplicationsAreValid(ruleName, grammar2);
      } catch (e) {
        grammarErrors.push(e);
        grammarHasInvalidApplications = true;
      }
    });
    if (!grammarHasInvalidApplications) {
      Object.keys(grammar2.rules).forEach((ruleName) => {
        const {body} = grammar2.rules[ruleName];
        try {
          body.assertIteratedExprsAreNotNullable(grammar2, []);
        } catch (e) {
          grammarErrors.push(e);
        }
      });
    }
    if (grammarErrors.length > 0) {
      throwErrors(grammarErrors);
    }
    if (this.source) {
      grammar2.source = this.source;
    }
    return grammar2;
  }
  define(name, formals, body, description, source, primitive) {
    this.ensureSuperGrammar();
    if (this.superGrammar.rules[name]) {
      throw duplicateRuleDeclaration(name, this.name, this.superGrammar.name, source);
    } else if (this.rules[name]) {
      throw duplicateRuleDeclaration(name, this.name, this.name, source);
    }
    const duplicateParameterNames$1 = getDuplicates(formals);
    if (duplicateParameterNames$1.length > 0) {
      throw duplicateParameterNames(name, duplicateParameterNames$1, source);
    }
    return this.install(name, formals, body, description, source, primitive);
  }
  override(name, formals, body, descIgnored, source) {
    this.ensureSuperGrammarRuleForOverriding(name, source);
    this.installOverriddenOrExtendedRule(name, formals, body, source);
    return this;
  }
  extend(name, formals, fragment, descIgnored, source) {
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    if (!ruleInfo) {
      throw cannotExtendUndeclaredRule(name, this.superGrammar.name, source);
    }
    const body = new Extend(this.superGrammar, name, fragment);
    body.source = fragment.source;
    this.installOverriddenOrExtendedRule(name, formals, body, source);
    return this;
  }
};
var Builder = class {
  constructor() {
    this.currentDecl = null;
    this.currentRuleName = null;
  }
  newGrammar(name) {
    return new GrammarDecl(name);
  }
  grammar(metaInfo, name, superGrammar, defaultStartRule, rules) {
    const gDecl = new GrammarDecl(name);
    if (superGrammar) {
      gDecl.withSuperGrammar(superGrammar instanceof Grammar ? superGrammar : this.fromRecipe(superGrammar));
    }
    if (defaultStartRule) {
      gDecl.withDefaultStartRule(defaultStartRule);
    }
    if (metaInfo && metaInfo.source) {
      gDecl.withSource(metaInfo.source);
    }
    this.currentDecl = gDecl;
    Object.keys(rules).forEach((ruleName) => {
      this.currentRuleName = ruleName;
      const ruleRecipe = rules[ruleName];
      const action = ruleRecipe[0];
      const metaInfo2 = ruleRecipe[1];
      const description = ruleRecipe[2];
      const formals = ruleRecipe[3];
      const body = this.fromRecipe(ruleRecipe[4]);
      let source;
      if (gDecl.source && metaInfo2 && metaInfo2.sourceInterval) {
        source = gDecl.source.subInterval(metaInfo2.sourceInterval[0], metaInfo2.sourceInterval[1] - metaInfo2.sourceInterval[0]);
      }
      gDecl[action](ruleName, formals, body, description, source);
    });
    this.currentRuleName = this.currentDecl = null;
    return gDecl.build();
  }
  terminal(x) {
    return new Terminal(x);
  }
  range(from, to) {
    return new Range(from, to);
  }
  param(index) {
    return new Param(index);
  }
  alt(...termArgs) {
    let terms = [];
    for (let arg of termArgs) {
      if (!(arg instanceof PExpr)) {
        arg = this.fromRecipe(arg);
      }
      if (arg instanceof Alt) {
        terms = terms.concat(arg.terms);
      } else {
        terms.push(arg);
      }
    }
    return terms.length === 1 ? terms[0] : new Alt(terms);
  }
  seq(...factorArgs) {
    let factors = [];
    for (let arg of factorArgs) {
      if (!(arg instanceof PExpr)) {
        arg = this.fromRecipe(arg);
      }
      if (arg instanceof Seq) {
        factors = factors.concat(arg.factors);
      } else {
        factors.push(arg);
      }
    }
    return factors.length === 1 ? factors[0] : new Seq(factors);
  }
  star(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Star(expr);
  }
  plus(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Plus(expr);
  }
  opt(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Opt(expr);
  }
  not(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Not(expr);
  }
  lookahead(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Lookahead(expr);
  }
  lex(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Lex(expr);
  }
  app(ruleName, optParams) {
    if (optParams && optParams.length > 0) {
      optParams = optParams.map(function(param) {
        return param instanceof PExpr ? param : this.fromRecipe(param);
      }, this);
    }
    return new Apply(ruleName, optParams);
  }
  splice(beforeTerms, afterTerms) {
    return new Splice(this.currentDecl.superGrammar, this.currentRuleName, beforeTerms.map((term) => this.fromRecipe(term)), afterTerms.map((term) => this.fromRecipe(term)));
  }
  fromRecipe(recipe) {
    const args = recipe[0] === "grammar" ? recipe.slice(1) : recipe.slice(2);
    const result = this[recipe[0]](...args);
    const metaInfo = recipe[1];
    if (metaInfo) {
      if (metaInfo.sourceInterval && this.currentDecl) {
        result.withSource(this.currentDecl.sourceInterval(...metaInfo.sourceInterval));
      }
    }
    return result;
  }
};
function makeRecipe(recipe) {
  if (typeof recipe === "function") {
    return recipe.call(new Builder());
  } else {
    if (typeof recipe === "string") {
      recipe = JSON.parse(recipe);
    }
    return new Builder().fromRecipe(recipe);
  }
}
var BuiltInRules = makeRecipe(["grammar", {source: 'BuiltInRules {\n\n  alnum  (an alpha-numeric character)\n    = letter\n    | digit\n\n  letter  (a letter)\n    = lower\n    | upper\n    | unicodeLtmo\n\n  digit  (a digit)\n    = "0".."9"\n\n  hexDigit  (a hexadecimal digit)\n    = digit\n    | "a".."f"\n    | "A".."F"\n\n  ListOf<elem, sep>\n    = NonemptyListOf<elem, sep>\n    | EmptyListOf<elem, sep>\n\n  NonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  EmptyListOf<elem, sep>\n    = /* nothing */\n\n  listOf<elem, sep>\n    = nonemptyListOf<elem, sep>\n    | emptyListOf<elem, sep>\n\n  nonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  emptyListOf<elem, sep>\n    = /* nothing */\n\n  // Allows a syntactic rule application within a lexical context.\n  applySyntactic<app> = app\n}'}, "BuiltInRules", null, null, {alnum: ["define", {sourceInterval: [18, 78]}, "an alpha-numeric character", [], ["alt", {sourceInterval: [60, 78]}, ["app", {sourceInterval: [60, 66]}, "letter", []], ["app", {sourceInterval: [73, 78]}, "digit", []]]], letter: ["define", {sourceInterval: [82, 142]}, "a letter", [], ["alt", {sourceInterval: [107, 142]}, ["app", {sourceInterval: [107, 112]}, "lower", []], ["app", {sourceInterval: [119, 124]}, "upper", []], ["app", {sourceInterval: [131, 142]}, "unicodeLtmo", []]]], digit: ["define", {sourceInterval: [146, 177]}, "a digit", [], ["range", {sourceInterval: [169, 177]}, "0", "9"]], hexDigit: ["define", {sourceInterval: [181, 254]}, "a hexadecimal digit", [], ["alt", {sourceInterval: [219, 254]}, ["app", {sourceInterval: [219, 224]}, "digit", []], ["range", {sourceInterval: [231, 239]}, "a", "f"], ["range", {sourceInterval: [246, 254]}, "A", "F"]]], ListOf: ["define", {sourceInterval: [258, 336]}, null, ["elem", "sep"], ["alt", {sourceInterval: [282, 336]}, ["app", {sourceInterval: [282, 307]}, "NonemptyListOf", [["param", {sourceInterval: [297, 301]}, 0], ["param", {sourceInterval: [303, 306]}, 1]]], ["app", {sourceInterval: [314, 336]}, "EmptyListOf", [["param", {sourceInterval: [326, 330]}, 0], ["param", {sourceInterval: [332, 335]}, 1]]]]], NonemptyListOf: ["define", {sourceInterval: [340, 388]}, null, ["elem", "sep"], ["seq", {sourceInterval: [372, 388]}, ["param", {sourceInterval: [372, 376]}, 0], ["star", {sourceInterval: [377, 388]}, ["seq", {sourceInterval: [378, 386]}, ["param", {sourceInterval: [378, 381]}, 1], ["param", {sourceInterval: [382, 386]}, 0]]]]], EmptyListOf: ["define", {sourceInterval: [392, 434]}, null, ["elem", "sep"], ["seq", {sourceInterval: [438, 438]}]], listOf: ["define", {sourceInterval: [438, 516]}, null, ["elem", "sep"], ["alt", {sourceInterval: [462, 516]}, ["app", {sourceInterval: [462, 487]}, "nonemptyListOf", [["param", {sourceInterval: [477, 481]}, 0], ["param", {sourceInterval: [483, 486]}, 1]]], ["app", {sourceInterval: [494, 516]}, "emptyListOf", [["param", {sourceInterval: [506, 510]}, 0], ["param", {sourceInterval: [512, 515]}, 1]]]]], nonemptyListOf: ["define", {sourceInterval: [520, 568]}, null, ["elem", "sep"], ["seq", {sourceInterval: [552, 568]}, ["param", {sourceInterval: [552, 556]}, 0], ["star", {sourceInterval: [557, 568]}, ["seq", {sourceInterval: [558, 566]}, ["param", {sourceInterval: [558, 561]}, 1], ["param", {sourceInterval: [562, 566]}, 0]]]]], emptyListOf: ["define", {sourceInterval: [572, 682]}, null, ["elem", "sep"], ["seq", {sourceInterval: [685, 685]}]], applySyntactic: ["define", {sourceInterval: [685, 710]}, null, ["app"], ["param", {sourceInterval: [707, 710]}, 0]]}]);
Grammar.BuiltInRules = BuiltInRules;
announceBuiltInRules(Grammar.BuiltInRules);
var ohmGrammar = makeRecipe(["grammar", {source: `Ohm {

  Grammars
    = Grammar*

  Grammar
    = ident SuperGrammar? "{" Rule* "}"

  SuperGrammar
    = "<:" ident

  Rule
    = ident Formals? ruleDescr? "="  RuleBody  -- define
    | ident Formals?            ":=" OverrideRuleBody  -- override
    | ident Formals?            "+=" RuleBody  -- extend

  RuleBody
    = "|"? NonemptyListOf<TopLevelTerm, "|">

  TopLevelTerm
    = Seq caseName  -- inline
    | Seq

  OverrideRuleBody
    = "|"? NonemptyListOf<OverrideTopLevelTerm, "|">

  OverrideTopLevelTerm
    = "..."  -- superSplice
    | TopLevelTerm

  Formals
    = "<" ListOf<ident, ","> ">"

  Params
    = "<" ListOf<Seq, ","> ">"

  Alt
    = NonemptyListOf<Seq, "|">

  Seq
    = Iter*

  Iter
    = Pred "*"  -- star
    | Pred "+"  -- plus
    | Pred "?"  -- opt
    | Pred

  Pred
    = "~" Lex  -- not
    | "&" Lex  -- lookahead
    | Lex

  Lex
    = "#" Base  -- lex
    | Base

  Base
    = ident Params? ~(ruleDescr? "=" | ":=" | "+=")  -- application
    | oneCharTerminal ".." oneCharTerminal           -- range
    | terminal                                       -- terminal
    | "(" Alt ")"                                    -- paren

  ruleDescr  (a rule description)
    = "(" ruleDescrText ")"

  ruleDescrText
    = (~")" any)*

  caseName
    = "--" (~"\\n" space)* name (~"\\n" space)* ("\\n" | &"}")

  name  (a name)
    = nameFirst nameRest*

  nameFirst
    = "_"
    | letter

  nameRest
    = "_"
    | alnum

  ident  (an identifier)
    = name

  terminal
    = "\\"" terminalChar* "\\""

  oneCharTerminal
    = "\\"" terminalChar "\\""

  terminalChar
    = escapeChar
      | ~"\\\\" ~"\\"" ~"\\n" "\\u{0}".."\\u{10FFFF}"

  escapeChar  (an escape sequence)
    = "\\\\\\\\"                                     -- backslash
    | "\\\\\\""                                     -- doubleQuote
    | "\\\\\\'"                                     -- singleQuote
    | "\\\\b"                                      -- backspace
    | "\\\\n"                                      -- lineFeed
    | "\\\\r"                                      -- carriageReturn
    | "\\\\t"                                      -- tab
    | "\\\\u{" hexDigit hexDigit? hexDigit?
             hexDigit? hexDigit? hexDigit? "}"   -- unicodeCodePoint
    | "\\\\u" hexDigit hexDigit hexDigit hexDigit  -- unicodeEscape
    | "\\\\x" hexDigit hexDigit                    -- hexEscape

  space
   += comment

  comment
    = "//" (~"\\n" any)* &("\\n" | end)  -- singleLine
    | "/*" (~"*/" any)* "*/"  -- multiLine

  tokens = token*

  token = caseName | comment | ident | operator | punctuation | terminal | any

  operator = "<:" | "=" | ":=" | "+=" | "*" | "+" | "?" | "~" | "&"

  punctuation = "<" | ">" | "," | "--"
}`}, "Ohm", null, "Grammars", {Grammars: ["define", {sourceInterval: [9, 32]}, null, [], ["star", {sourceInterval: [24, 32]}, ["app", {sourceInterval: [24, 31]}, "Grammar", []]]], Grammar: ["define", {sourceInterval: [36, 83]}, null, [], ["seq", {sourceInterval: [50, 83]}, ["app", {sourceInterval: [50, 55]}, "ident", []], ["opt", {sourceInterval: [56, 69]}, ["app", {sourceInterval: [56, 68]}, "SuperGrammar", []]], ["terminal", {sourceInterval: [70, 73]}, "{"], ["star", {sourceInterval: [74, 79]}, ["app", {sourceInterval: [74, 78]}, "Rule", []]], ["terminal", {sourceInterval: [80, 83]}, "}"]]], SuperGrammar: ["define", {sourceInterval: [87, 116]}, null, [], ["seq", {sourceInterval: [106, 116]}, ["terminal", {sourceInterval: [106, 110]}, "<:"], ["app", {sourceInterval: [111, 116]}, "ident", []]]], Rule_define: ["define", {sourceInterval: [131, 181]}, null, [], ["seq", {sourceInterval: [131, 170]}, ["app", {sourceInterval: [131, 136]}, "ident", []], ["opt", {sourceInterval: [137, 145]}, ["app", {sourceInterval: [137, 144]}, "Formals", []]], ["opt", {sourceInterval: [146, 156]}, ["app", {sourceInterval: [146, 155]}, "ruleDescr", []]], ["terminal", {sourceInterval: [157, 160]}, "="], ["app", {sourceInterval: [162, 170]}, "RuleBody", []]]], Rule_override: ["define", {sourceInterval: [188, 248]}, null, [], ["seq", {sourceInterval: [188, 235]}, ["app", {sourceInterval: [188, 193]}, "ident", []], ["opt", {sourceInterval: [194, 202]}, ["app", {sourceInterval: [194, 201]}, "Formals", []]], ["terminal", {sourceInterval: [214, 218]}, ":="], ["app", {sourceInterval: [219, 235]}, "OverrideRuleBody", []]]], Rule_extend: ["define", {sourceInterval: [255, 305]}, null, [], ["seq", {sourceInterval: [255, 294]}, ["app", {sourceInterval: [255, 260]}, "ident", []], ["opt", {sourceInterval: [261, 269]}, ["app", {sourceInterval: [261, 268]}, "Formals", []]], ["terminal", {sourceInterval: [281, 285]}, "+="], ["app", {sourceInterval: [286, 294]}, "RuleBody", []]]], Rule: ["define", {sourceInterval: [120, 305]}, null, [], ["alt", {sourceInterval: [131, 305]}, ["app", {sourceInterval: [131, 170]}, "Rule_define", []], ["app", {sourceInterval: [188, 235]}, "Rule_override", []], ["app", {sourceInterval: [255, 294]}, "Rule_extend", []]]], RuleBody: ["define", {sourceInterval: [309, 362]}, null, [], ["seq", {sourceInterval: [324, 362]}, ["opt", {sourceInterval: [324, 328]}, ["terminal", {sourceInterval: [324, 327]}, "|"]], ["app", {sourceInterval: [329, 362]}, "NonemptyListOf", [["app", {sourceInterval: [344, 356]}, "TopLevelTerm", []], ["terminal", {sourceInterval: [358, 361]}, "|"]]]]], TopLevelTerm_inline: ["define", {sourceInterval: [385, 408]}, null, [], ["seq", {sourceInterval: [385, 397]}, ["app", {sourceInterval: [385, 388]}, "Seq", []], ["app", {sourceInterval: [389, 397]}, "caseName", []]]], TopLevelTerm: ["define", {sourceInterval: [366, 418]}, null, [], ["alt", {sourceInterval: [385, 418]}, ["app", {sourceInterval: [385, 397]}, "TopLevelTerm_inline", []], ["app", {sourceInterval: [415, 418]}, "Seq", []]]], OverrideRuleBody: ["define", {sourceInterval: [422, 491]}, null, [], ["seq", {sourceInterval: [445, 491]}, ["opt", {sourceInterval: [445, 449]}, ["terminal", {sourceInterval: [445, 448]}, "|"]], ["app", {sourceInterval: [450, 491]}, "NonemptyListOf", [["app", {sourceInterval: [465, 485]}, "OverrideTopLevelTerm", []], ["terminal", {sourceInterval: [487, 490]}, "|"]]]]], OverrideTopLevelTerm_superSplice: ["define", {sourceInterval: [522, 543]}, null, [], ["terminal", {sourceInterval: [522, 527]}, "..."]], OverrideTopLevelTerm: ["define", {sourceInterval: [495, 562]}, null, [], ["alt", {sourceInterval: [522, 562]}, ["app", {sourceInterval: [522, 527]}, "OverrideTopLevelTerm_superSplice", []], ["app", {sourceInterval: [550, 562]}, "TopLevelTerm", []]]], Formals: ["define", {sourceInterval: [566, 606]}, null, [], ["seq", {sourceInterval: [580, 606]}, ["terminal", {sourceInterval: [580, 583]}, "<"], ["app", {sourceInterval: [584, 602]}, "ListOf", [["app", {sourceInterval: [591, 596]}, "ident", []], ["terminal", {sourceInterval: [598, 601]}, ","]]], ["terminal", {sourceInterval: [603, 606]}, ">"]]], Params: ["define", {sourceInterval: [610, 647]}, null, [], ["seq", {sourceInterval: [623, 647]}, ["terminal", {sourceInterval: [623, 626]}, "<"], ["app", {sourceInterval: [627, 643]}, "ListOf", [["app", {sourceInterval: [634, 637]}, "Seq", []], ["terminal", {sourceInterval: [639, 642]}, ","]]], ["terminal", {sourceInterval: [644, 647]}, ">"]]], Alt: ["define", {sourceInterval: [651, 685]}, null, [], ["app", {sourceInterval: [661, 685]}, "NonemptyListOf", [["app", {sourceInterval: [676, 679]}, "Seq", []], ["terminal", {sourceInterval: [681, 684]}, "|"]]]], Seq: ["define", {sourceInterval: [689, 704]}, null, [], ["star", {sourceInterval: [699, 704]}, ["app", {sourceInterval: [699, 703]}, "Iter", []]]], Iter_star: ["define", {sourceInterval: [719, 736]}, null, [], ["seq", {sourceInterval: [719, 727]}, ["app", {sourceInterval: [719, 723]}, "Pred", []], ["terminal", {sourceInterval: [724, 727]}, "*"]]], Iter_plus: ["define", {sourceInterval: [743, 760]}, null, [], ["seq", {sourceInterval: [743, 751]}, ["app", {sourceInterval: [743, 747]}, "Pred", []], ["terminal", {sourceInterval: [748, 751]}, "+"]]], Iter_opt: ["define", {sourceInterval: [767, 783]}, null, [], ["seq", {sourceInterval: [767, 775]}, ["app", {sourceInterval: [767, 771]}, "Pred", []], ["terminal", {sourceInterval: [772, 775]}, "?"]]], Iter: ["define", {sourceInterval: [708, 794]}, null, [], ["alt", {sourceInterval: [719, 794]}, ["app", {sourceInterval: [719, 727]}, "Iter_star", []], ["app", {sourceInterval: [743, 751]}, "Iter_plus", []], ["app", {sourceInterval: [767, 775]}, "Iter_opt", []], ["app", {sourceInterval: [790, 794]}, "Pred", []]]], Pred_not: ["define", {sourceInterval: [809, 824]}, null, [], ["seq", {sourceInterval: [809, 816]}, ["terminal", {sourceInterval: [809, 812]}, "~"], ["app", {sourceInterval: [813, 816]}, "Lex", []]]], Pred_lookahead: ["define", {sourceInterval: [831, 852]}, null, [], ["seq", {sourceInterval: [831, 838]}, ["terminal", {sourceInterval: [831, 834]}, "&"], ["app", {sourceInterval: [835, 838]}, "Lex", []]]], Pred: ["define", {sourceInterval: [798, 862]}, null, [], ["alt", {sourceInterval: [809, 862]}, ["app", {sourceInterval: [809, 816]}, "Pred_not", []], ["app", {sourceInterval: [831, 838]}, "Pred_lookahead", []], ["app", {sourceInterval: [859, 862]}, "Lex", []]]], Lex_lex: ["define", {sourceInterval: [876, 892]}, null, [], ["seq", {sourceInterval: [876, 884]}, ["terminal", {sourceInterval: [876, 879]}, "#"], ["app", {sourceInterval: [880, 884]}, "Base", []]]], Lex: ["define", {sourceInterval: [866, 903]}, null, [], ["alt", {sourceInterval: [876, 903]}, ["app", {sourceInterval: [876, 884]}, "Lex_lex", []], ["app", {sourceInterval: [899, 903]}, "Base", []]]], Base_application: ["define", {sourceInterval: [918, 979]}, null, [], ["seq", {sourceInterval: [918, 963]}, ["app", {sourceInterval: [918, 923]}, "ident", []], ["opt", {sourceInterval: [924, 931]}, ["app", {sourceInterval: [924, 930]}, "Params", []]], ["not", {sourceInterval: [932, 963]}, ["alt", {sourceInterval: [934, 962]}, ["seq", {sourceInterval: [934, 948]}, ["opt", {sourceInterval: [934, 944]}, ["app", {sourceInterval: [934, 943]}, "ruleDescr", []]], ["terminal", {sourceInterval: [945, 948]}, "="]], ["terminal", {sourceInterval: [951, 955]}, ":="], ["terminal", {sourceInterval: [958, 962]}, "+="]]]]], Base_range: ["define", {sourceInterval: [986, 1041]}, null, [], ["seq", {sourceInterval: [986, 1022]}, ["app", {sourceInterval: [986, 1001]}, "oneCharTerminal", []], ["terminal", {sourceInterval: [1002, 1006]}, ".."], ["app", {sourceInterval: [1007, 1022]}, "oneCharTerminal", []]]], Base_terminal: ["define", {sourceInterval: [1048, 1106]}, null, [], ["app", {sourceInterval: [1048, 1056]}, "terminal", []]], Base_paren: ["define", {sourceInterval: [1113, 1168]}, null, [], ["seq", {sourceInterval: [1113, 1124]}, ["terminal", {sourceInterval: [1113, 1116]}, "("], ["app", {sourceInterval: [1117, 1120]}, "Alt", []], ["terminal", {sourceInterval: [1121, 1124]}, ")"]]], Base: ["define", {sourceInterval: [907, 1168]}, null, [], ["alt", {sourceInterval: [918, 1168]}, ["app", {sourceInterval: [918, 963]}, "Base_application", []], ["app", {sourceInterval: [986, 1022]}, "Base_range", []], ["app", {sourceInterval: [1048, 1056]}, "Base_terminal", []], ["app", {sourceInterval: [1113, 1124]}, "Base_paren", []]]], ruleDescr: ["define", {sourceInterval: [1172, 1231]}, "a rule description", [], ["seq", {sourceInterval: [1210, 1231]}, ["terminal", {sourceInterval: [1210, 1213]}, "("], ["app", {sourceInterval: [1214, 1227]}, "ruleDescrText", []], ["terminal", {sourceInterval: [1228, 1231]}, ")"]]], ruleDescrText: ["define", {sourceInterval: [1235, 1266]}, null, [], ["star", {sourceInterval: [1255, 1266]}, ["seq", {sourceInterval: [1256, 1264]}, ["not", {sourceInterval: [1256, 1260]}, ["terminal", {sourceInterval: [1257, 1260]}, ")"]], ["app", {sourceInterval: [1261, 1264]}, "any", []]]]], caseName: ["define", {sourceInterval: [1270, 1338]}, null, [], ["seq", {sourceInterval: [1285, 1338]}, ["terminal", {sourceInterval: [1285, 1289]}, "--"], ["star", {sourceInterval: [1290, 1304]}, ["seq", {sourceInterval: [1291, 1302]}, ["not", {sourceInterval: [1291, 1296]}, ["terminal", {sourceInterval: [1292, 1296]}, "\n"]], ["app", {sourceInterval: [1297, 1302]}, "space", []]]], ["app", {sourceInterval: [1305, 1309]}, "name", []], ["star", {sourceInterval: [1310, 1324]}, ["seq", {sourceInterval: [1311, 1322]}, ["not", {sourceInterval: [1311, 1316]}, ["terminal", {sourceInterval: [1312, 1316]}, "\n"]], ["app", {sourceInterval: [1317, 1322]}, "space", []]]], ["alt", {sourceInterval: [1326, 1337]}, ["terminal", {sourceInterval: [1326, 1330]}, "\n"], ["lookahead", {sourceInterval: [1333, 1337]}, ["terminal", {sourceInterval: [1334, 1337]}, "}"]]]]], name: ["define", {sourceInterval: [1342, 1382]}, "a name", [], ["seq", {sourceInterval: [1363, 1382]}, ["app", {sourceInterval: [1363, 1372]}, "nameFirst", []], ["star", {sourceInterval: [1373, 1382]}, ["app", {sourceInterval: [1373, 1381]}, "nameRest", []]]]], nameFirst: ["define", {sourceInterval: [1386, 1418]}, null, [], ["alt", {sourceInterval: [1402, 1418]}, ["terminal", {sourceInterval: [1402, 1405]}, "_"], ["app", {sourceInterval: [1412, 1418]}, "letter", []]]], nameRest: ["define", {sourceInterval: [1422, 1452]}, null, [], ["alt", {sourceInterval: [1437, 1452]}, ["terminal", {sourceInterval: [1437, 1440]}, "_"], ["app", {sourceInterval: [1447, 1452]}, "alnum", []]]], ident: ["define", {sourceInterval: [1456, 1489]}, "an identifier", [], ["app", {sourceInterval: [1485, 1489]}, "name", []]], terminal: ["define", {sourceInterval: [1493, 1531]}, null, [], ["seq", {sourceInterval: [1508, 1531]}, ["terminal", {sourceInterval: [1508, 1512]}, '"'], ["star", {sourceInterval: [1513, 1526]}, ["app", {sourceInterval: [1513, 1525]}, "terminalChar", []]], ["terminal", {sourceInterval: [1527, 1531]}, '"']]], oneCharTerminal: ["define", {sourceInterval: [1535, 1579]}, null, [], ["seq", {sourceInterval: [1557, 1579]}, ["terminal", {sourceInterval: [1557, 1561]}, '"'], ["app", {sourceInterval: [1562, 1574]}, "terminalChar", []], ["terminal", {sourceInterval: [1575, 1579]}, '"']]], terminalChar: ["define", {sourceInterval: [1583, 1660]}, null, [], ["alt", {sourceInterval: [1602, 1660]}, ["app", {sourceInterval: [1602, 1612]}, "escapeChar", []], ["seq", {sourceInterval: [1621, 1660]}, ["not", {sourceInterval: [1621, 1626]}, ["terminal", {sourceInterval: [1622, 1626]}, "\\"]], ["not", {sourceInterval: [1627, 1632]}, ["terminal", {sourceInterval: [1628, 1632]}, '"']], ["not", {sourceInterval: [1633, 1638]}, ["terminal", {sourceInterval: [1634, 1638]}, "\n"]], ["range", {sourceInterval: [1639, 1660]}, "\0", "\u{10FFFF}"]]]], escapeChar_backslash: ["define", {sourceInterval: [1703, 1758]}, null, [], ["terminal", {sourceInterval: [1703, 1709]}, "\\\\"]], escapeChar_doubleQuote: ["define", {sourceInterval: [1765, 1822]}, null, [], ["terminal", {sourceInterval: [1765, 1771]}, '\\"']], escapeChar_singleQuote: ["define", {sourceInterval: [1829, 1886]}, null, [], ["terminal", {sourceInterval: [1829, 1835]}, "\\'"]], escapeChar_backspace: ["define", {sourceInterval: [1893, 1948]}, null, [], ["terminal", {sourceInterval: [1893, 1898]}, "\\b"]], escapeChar_lineFeed: ["define", {sourceInterval: [1955, 2009]}, null, [], ["terminal", {sourceInterval: [1955, 1960]}, "\\n"]], escapeChar_carriageReturn: ["define", {sourceInterval: [2016, 2076]}, null, [], ["terminal", {sourceInterval: [2016, 2021]}, "\\r"]], escapeChar_tab: ["define", {sourceInterval: [2083, 2132]}, null, [], ["terminal", {sourceInterval: [2083, 2088]}, "\\t"]], escapeChar_unicodeCodePoint: ["define", {sourceInterval: [2139, 2243]}, null, [], ["seq", {sourceInterval: [2139, 2221]}, ["terminal", {sourceInterval: [2139, 2145]}, "\\u{"], ["app", {sourceInterval: [2146, 2154]}, "hexDigit", []], ["opt", {sourceInterval: [2155, 2164]}, ["app", {sourceInterval: [2155, 2163]}, "hexDigit", []]], ["opt", {sourceInterval: [2165, 2174]}, ["app", {sourceInterval: [2165, 2173]}, "hexDigit", []]], ["opt", {sourceInterval: [2188, 2197]}, ["app", {sourceInterval: [2188, 2196]}, "hexDigit", []]], ["opt", {sourceInterval: [2198, 2207]}, ["app", {sourceInterval: [2198, 2206]}, "hexDigit", []]], ["opt", {sourceInterval: [2208, 2217]}, ["app", {sourceInterval: [2208, 2216]}, "hexDigit", []]], ["terminal", {sourceInterval: [2218, 2221]}, "}"]]], escapeChar_unicodeEscape: ["define", {sourceInterval: [2250, 2309]}, null, [], ["seq", {sourceInterval: [2250, 2291]}, ["terminal", {sourceInterval: [2250, 2255]}, "\\u"], ["app", {sourceInterval: [2256, 2264]}, "hexDigit", []], ["app", {sourceInterval: [2265, 2273]}, "hexDigit", []], ["app", {sourceInterval: [2274, 2282]}, "hexDigit", []], ["app", {sourceInterval: [2283, 2291]}, "hexDigit", []]]], escapeChar_hexEscape: ["define", {sourceInterval: [2316, 2371]}, null, [], ["seq", {sourceInterval: [2316, 2339]}, ["terminal", {sourceInterval: [2316, 2321]}, "\\x"], ["app", {sourceInterval: [2322, 2330]}, "hexDigit", []], ["app", {sourceInterval: [2331, 2339]}, "hexDigit", []]]], escapeChar: ["define", {sourceInterval: [1664, 2371]}, "an escape sequence", [], ["alt", {sourceInterval: [1703, 2371]}, ["app", {sourceInterval: [1703, 1709]}, "escapeChar_backslash", []], ["app", {sourceInterval: [1765, 1771]}, "escapeChar_doubleQuote", []], ["app", {sourceInterval: [1829, 1835]}, "escapeChar_singleQuote", []], ["app", {sourceInterval: [1893, 1898]}, "escapeChar_backspace", []], ["app", {sourceInterval: [1955, 1960]}, "escapeChar_lineFeed", []], ["app", {sourceInterval: [2016, 2021]}, "escapeChar_carriageReturn", []], ["app", {sourceInterval: [2083, 2088]}, "escapeChar_tab", []], ["app", {sourceInterval: [2139, 2221]}, "escapeChar_unicodeCodePoint", []], ["app", {sourceInterval: [2250, 2291]}, "escapeChar_unicodeEscape", []], ["app", {sourceInterval: [2316, 2339]}, "escapeChar_hexEscape", []]]], space: ["extend", {sourceInterval: [2375, 2394]}, null, [], ["app", {sourceInterval: [2387, 2394]}, "comment", []]], comment_singleLine: ["define", {sourceInterval: [2412, 2458]}, null, [], ["seq", {sourceInterval: [2412, 2443]}, ["terminal", {sourceInterval: [2412, 2416]}, "//"], ["star", {sourceInterval: [2417, 2429]}, ["seq", {sourceInterval: [2418, 2427]}, ["not", {sourceInterval: [2418, 2423]}, ["terminal", {sourceInterval: [2419, 2423]}, "\n"]], ["app", {sourceInterval: [2424, 2427]}, "any", []]]], ["lookahead", {sourceInterval: [2430, 2443]}, ["alt", {sourceInterval: [2432, 2442]}, ["terminal", {sourceInterval: [2432, 2436]}, "\n"], ["app", {sourceInterval: [2439, 2442]}, "end", []]]]]], comment_multiLine: ["define", {sourceInterval: [2465, 2501]}, null, [], ["seq", {sourceInterval: [2465, 2487]}, ["terminal", {sourceInterval: [2465, 2469]}, "/*"], ["star", {sourceInterval: [2470, 2482]}, ["seq", {sourceInterval: [2471, 2480]}, ["not", {sourceInterval: [2471, 2476]}, ["terminal", {sourceInterval: [2472, 2476]}, "*/"]], ["app", {sourceInterval: [2477, 2480]}, "any", []]]], ["terminal", {sourceInterval: [2483, 2487]}, "*/"]]], comment: ["define", {sourceInterval: [2398, 2501]}, null, [], ["alt", {sourceInterval: [2412, 2501]}, ["app", {sourceInterval: [2412, 2443]}, "comment_singleLine", []], ["app", {sourceInterval: [2465, 2487]}, "comment_multiLine", []]]], tokens: ["define", {sourceInterval: [2505, 2520]}, null, [], ["star", {sourceInterval: [2514, 2520]}, ["app", {sourceInterval: [2514, 2519]}, "token", []]]], token: ["define", {sourceInterval: [2524, 2600]}, null, [], ["alt", {sourceInterval: [2532, 2600]}, ["app", {sourceInterval: [2532, 2540]}, "caseName", []], ["app", {sourceInterval: [2543, 2550]}, "comment", []], ["app", {sourceInterval: [2553, 2558]}, "ident", []], ["app", {sourceInterval: [2561, 2569]}, "operator", []], ["app", {sourceInterval: [2572, 2583]}, "punctuation", []], ["app", {sourceInterval: [2586, 2594]}, "terminal", []], ["app", {sourceInterval: [2597, 2600]}, "any", []]]], operator: ["define", {sourceInterval: [2604, 2669]}, null, [], ["alt", {sourceInterval: [2615, 2669]}, ["terminal", {sourceInterval: [2615, 2619]}, "<:"], ["terminal", {sourceInterval: [2622, 2625]}, "="], ["terminal", {sourceInterval: [2628, 2632]}, ":="], ["terminal", {sourceInterval: [2635, 2639]}, "+="], ["terminal", {sourceInterval: [2642, 2645]}, "*"], ["terminal", {sourceInterval: [2648, 2651]}, "+"], ["terminal", {sourceInterval: [2654, 2657]}, "?"], ["terminal", {sourceInterval: [2660, 2663]}, "~"], ["terminal", {sourceInterval: [2666, 2669]}, "&"]]], punctuation: ["define", {sourceInterval: [2673, 2709]}, null, [], ["alt", {sourceInterval: [2687, 2709]}, ["terminal", {sourceInterval: [2687, 2690]}, "<"], ["terminal", {sourceInterval: [2693, 2696]}, ">"], ["terminal", {sourceInterval: [2699, 2702]}, ","], ["terminal", {sourceInterval: [2705, 2709]}, "--"]]]}]);
var superSplicePlaceholder = Object.create(PExpr.prototype);
function namespaceHas(ns, name) {
  for (const prop in ns) {
    if (prop === name)
      return true;
  }
  return false;
}
function buildGrammar(match, namespace, optOhmGrammarForTesting) {
  const builder = new Builder();
  let decl;
  let currentRuleName;
  let currentRuleFormals;
  let overriding = false;
  const metaGrammar = optOhmGrammarForTesting || ohmGrammar;
  const helpers = metaGrammar.createSemantics().addOperation("visit", {
    Grammars(grammarIter) {
      return grammarIter.children.map((c) => c.visit());
    },
    Grammar(id, s, _open, rules, _close) {
      const grammarName = id.visit();
      decl = builder.newGrammar(grammarName);
      s.child(0) && s.child(0).visit();
      rules.children.map((c) => c.visit());
      const g = decl.build();
      g.source = this.source.trimmed();
      if (namespaceHas(namespace, grammarName)) {
        throw duplicateGrammarDeclaration(g);
      }
      namespace[grammarName] = g;
      return g;
    },
    SuperGrammar(_, n) {
      const superGrammarName = n.visit();
      if (superGrammarName === "null") {
        decl.withSuperGrammar(null);
      } else {
        if (!namespace || !namespaceHas(namespace, superGrammarName)) {
          throw undeclaredGrammar(superGrammarName, namespace, n.source);
        }
        decl.withSuperGrammar(namespace[superGrammarName]);
      }
    },
    Rule_define(n, fs, d, _, b) {
      currentRuleName = n.visit();
      currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
      if (!decl.defaultStartRule && decl.ensureSuperGrammar() !== Grammar.ProtoBuiltInRules) {
        decl.withDefaultStartRule(currentRuleName);
      }
      const body = b.visit();
      const description = d.children.map((c) => c.visit())[0];
      const source = this.source.trimmed();
      return decl.define(currentRuleName, currentRuleFormals, body, description, source);
    },
    Rule_override(n, fs, _, b) {
      currentRuleName = n.visit();
      currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
      const source = this.source.trimmed();
      decl.ensureSuperGrammarRuleForOverriding(currentRuleName, source);
      overriding = true;
      const body = b.visit();
      overriding = false;
      return decl.override(currentRuleName, currentRuleFormals, body, null, source);
    },
    Rule_extend(n, fs, _, b) {
      currentRuleName = n.visit();
      currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
      const body = b.visit();
      const source = this.source.trimmed();
      return decl.extend(currentRuleName, currentRuleFormals, body, null, source);
    },
    RuleBody(_, terms) {
      return builder.alt(...terms.visit()).withSource(this.source);
    },
    OverrideRuleBody(_, terms) {
      const args = terms.visit();
      const expansionPos = args.indexOf(superSplicePlaceholder);
      if (expansionPos >= 0) {
        const beforeTerms = args.slice(0, expansionPos);
        const afterTerms = args.slice(expansionPos + 1);
        afterTerms.forEach((t) => {
          if (t === superSplicePlaceholder)
            throw multipleSuperSplices(t);
        });
        return new Splice(decl.superGrammar, currentRuleName, beforeTerms, afterTerms).withSource(this.source);
      } else {
        return builder.alt(...args).withSource(this.source);
      }
    },
    Formals(opointy, fs, cpointy) {
      return fs.visit();
    },
    Params(opointy, ps, cpointy) {
      return ps.visit();
    },
    Alt(seqs) {
      return builder.alt(...seqs.visit()).withSource(this.source);
    },
    TopLevelTerm_inline(b, n) {
      const inlineRuleName = currentRuleName + "_" + n.visit();
      const body = b.visit();
      const source = this.source.trimmed();
      const isNewRuleDeclaration = !(decl.superGrammar && decl.superGrammar.rules[inlineRuleName]);
      if (overriding && !isNewRuleDeclaration) {
        decl.override(inlineRuleName, currentRuleFormals, body, null, source);
      } else {
        decl.define(inlineRuleName, currentRuleFormals, body, null, source);
      }
      const params = currentRuleFormals.map((formal) => builder.app(formal));
      return builder.app(inlineRuleName, params).withSource(body.source);
    },
    OverrideTopLevelTerm_superSplice(_) {
      return superSplicePlaceholder;
    },
    Seq(expr) {
      return builder.seq(...expr.children.map((c) => c.visit())).withSource(this.source);
    },
    Iter_star(x, _) {
      return builder.star(x.visit()).withSource(this.source);
    },
    Iter_plus(x, _) {
      return builder.plus(x.visit()).withSource(this.source);
    },
    Iter_opt(x, _) {
      return builder.opt(x.visit()).withSource(this.source);
    },
    Pred_not(_, x) {
      return builder.not(x.visit()).withSource(this.source);
    },
    Pred_lookahead(_, x) {
      return builder.lookahead(x.visit()).withSource(this.source);
    },
    Lex_lex(_, x) {
      return builder.lex(x.visit()).withSource(this.source);
    },
    Base_application(rule, ps) {
      const params = ps.children.map((c) => c.visit())[0] || [];
      return builder.app(rule.visit(), params).withSource(this.source);
    },
    Base_range(from, _, to) {
      return builder.range(from.visit(), to.visit()).withSource(this.source);
    },
    Base_terminal(expr) {
      return builder.terminal(expr.visit()).withSource(this.source);
    },
    Base_paren(open, x, close) {
      return x.visit();
    },
    ruleDescr(open, t, close) {
      return t.visit();
    },
    ruleDescrText(_) {
      return this.sourceString.trim();
    },
    caseName(_, space1, n, space2, end2) {
      return n.visit();
    },
    name(first, rest) {
      return this.sourceString;
    },
    nameFirst(expr) {
    },
    nameRest(expr) {
    },
    terminal(open, cs, close) {
      return cs.children.map((c) => c.visit()).join("");
    },
    oneCharTerminal(open, c, close) {
      return c.visit();
    },
    escapeChar(c) {
      try {
        return unescapeCodePoint(this.sourceString);
      } catch (err) {
        if (err instanceof RangeError && err.message.startsWith("Invalid code point ")) {
          throw invalidCodePoint(c);
        }
        throw err;
      }
    },
    NonemptyListOf(x, _, xs) {
      return [x.visit()].concat(xs.children.map((c) => c.visit()));
    },
    EmptyListOf() {
      return [];
    },
    _terminal() {
      return this.sourceString;
    }
  });
  return helpers(match).visit();
}
var operationsAndAttributesGrammar = makeRecipe(["grammar", {source: 'OperationsAndAttributes {\n\n  AttributeSignature =\n    name\n\n  OperationSignature =\n    name Formals?\n\n  Formals\n    = "(" ListOf<name, ","> ")"\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = "_"\n    | letter\n\n  nameRest\n    = "_"\n    | alnum\n\n}'}, "OperationsAndAttributes", null, "AttributeSignature", {AttributeSignature: ["define", {sourceInterval: [29, 58]}, null, [], ["app", {sourceInterval: [54, 58]}, "name", []]], OperationSignature: ["define", {sourceInterval: [62, 100]}, null, [], ["seq", {sourceInterval: [87, 100]}, ["app", {sourceInterval: [87, 91]}, "name", []], ["opt", {sourceInterval: [92, 100]}, ["app", {sourceInterval: [92, 99]}, "Formals", []]]]], Formals: ["define", {sourceInterval: [104, 143]}, null, [], ["seq", {sourceInterval: [118, 143]}, ["terminal", {sourceInterval: [118, 121]}, "("], ["app", {sourceInterval: [122, 139]}, "ListOf", [["app", {sourceInterval: [129, 133]}, "name", []], ["terminal", {sourceInterval: [135, 138]}, ","]]], ["terminal", {sourceInterval: [140, 143]}, ")"]]], name: ["define", {sourceInterval: [147, 187]}, "a name", [], ["seq", {sourceInterval: [168, 187]}, ["app", {sourceInterval: [168, 177]}, "nameFirst", []], ["star", {sourceInterval: [178, 187]}, ["app", {sourceInterval: [178, 186]}, "nameRest", []]]]], nameFirst: ["define", {sourceInterval: [191, 223]}, null, [], ["alt", {sourceInterval: [207, 223]}, ["terminal", {sourceInterval: [207, 210]}, "_"], ["app", {sourceInterval: [217, 223]}, "letter", []]]], nameRest: ["define", {sourceInterval: [227, 257]}, null, [], ["alt", {sourceInterval: [242, 257]}, ["terminal", {sourceInterval: [242, 245]}, "_"], ["app", {sourceInterval: [252, 257]}, "alnum", []]]]}]);
initBuiltInSemantics(Grammar.BuiltInRules);
initPrototypeParser(operationsAndAttributesGrammar);
function initBuiltInSemantics(builtInRules) {
  const actions = {
    empty() {
      return this.iteration();
    },
    nonEmpty(first, _, rest) {
      return this.iteration([first].concat(rest.children));
    }
  };
  Semantics.BuiltInSemantics = Semantics.createSemantics(builtInRules, null).addOperation("asIteration", {
    emptyListOf: actions.empty,
    nonemptyListOf: actions.nonEmpty,
    EmptyListOf: actions.empty,
    NonemptyListOf: actions.nonEmpty
  });
}
function initPrototypeParser(grammar2) {
  Semantics.prototypeGrammarSemantics = grammar2.createSemantics().addOperation("parse", {
    AttributeSignature(name) {
      return {
        name: name.parse(),
        formals: []
      };
    },
    OperationSignature(name, optFormals) {
      return {
        name: name.parse(),
        formals: optFormals.children.map((c) => c.parse())[0] || []
      };
    },
    Formals(oparen, fs, cparen) {
      return fs.asIteration().children.map((c) => c.parse());
    },
    name(first, rest) {
      return this.sourceString;
    }
  });
  Semantics.prototypeGrammar = grammar2;
}
function findIndentation(input) {
  let pos = 0;
  const stack = [0];
  const topOfStack = () => stack[stack.length - 1];
  const result = {};
  const regex = /( *).*(?:$|\r?\n|\r)/g;
  let match;
  while ((match = regex.exec(input)) != null) {
    const [line, indent] = match;
    if (line.length === 0)
      break;
    const indentSize = indent.length;
    const prevSize = topOfStack();
    const indentPos = pos + indentSize;
    if (indentSize > prevSize) {
      stack.push(indentSize);
      result[indentPos] = 1;
    } else if (indentSize < prevSize) {
      const prevLength = stack.length;
      while (topOfStack() !== indentSize) {
        stack.pop();
      }
      result[indentPos] = -1 * (prevLength - stack.length);
    }
    pos += line.length;
  }
  if (stack.length > 1) {
    result[pos] = 1 - stack.length;
  }
  return result;
}
var INDENT_DESCRIPTION = "an indented block";
var DEDENT_DESCRIPTION = "a dedent";
var INVALID_CODE_POINT = 1114111 + 1;
var InputStreamWithIndentation = class extends InputStream {
  constructor(state) {
    super(state.input);
    this.state = state;
  }
  _indentationAt(pos) {
    return this.state.userData[pos] || 0;
  }
  atEnd() {
    return super.atEnd() && this._indentationAt(this.pos) === 0;
  }
  next() {
    if (this._indentationAt(this.pos) !== 0) {
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return void 0;
    }
    return super.next();
  }
  nextCharCode() {
    if (this._indentationAt(this.pos) !== 0) {
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return INVALID_CODE_POINT;
    }
    return super.nextCharCode();
  }
  nextCodePoint() {
    if (this._indentationAt(this.pos) !== 0) {
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return INVALID_CODE_POINT;
    }
    return super.nextCodePoint();
  }
};
var Indentation = class extends PExpr {
  constructor(isIndent = true) {
    super();
    this.isIndent = isIndent;
  }
  allowsSkippingPrecedingSpace() {
    return true;
  }
  eval(state) {
    const {inputStream} = state;
    const pseudoTokens = state.userData;
    state.doNotMemoize = true;
    const origPos = inputStream.pos;
    const sign = this.isIndent ? 1 : -1;
    const count = (pseudoTokens[origPos] || 0) * sign;
    if (count > 0) {
      state.userData = Object.create(pseudoTokens);
      state.userData[origPos] -= sign;
      state.pushBinding(new TerminalNode(0), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  }
  getArity() {
    return 1;
  }
  _assertAllApplicationsAreValid(ruleName, grammar2) {
  }
  _isNullable(grammar2, memo) {
    return false;
  }
  assertChoicesHaveUniformArity(ruleName) {
  }
  assertIteratedExprsAreNotNullable(grammar2) {
  }
  introduceParams(formals) {
    return this;
  }
  substituteParams(actuals) {
    return this;
  }
  toString() {
    return this.isIndent ? "indent" : "dedent";
  }
  toDisplayString() {
    return this.toString();
  }
  toFailure(grammar2) {
    const description = this.isIndent ? INDENT_DESCRIPTION : DEDENT_DESCRIPTION;
    return new Failure(this, description, "description");
  }
};
var applyIndent = new Apply("indent");
var applyDedent = new Apply("dedent");
var newAnyBody = new Splice(BuiltInRules, "any", [applyIndent, applyDedent], []);
var IndentationSensitive = new Builder().newGrammar("IndentationSensitive").withSuperGrammar(BuiltInRules).define("indent", [], new Indentation(true), INDENT_DESCRIPTION, void 0, true).define("dedent", [], new Indentation(false), DEDENT_DESCRIPTION, void 0, true).extend("any", [], newAnyBody, "any character", void 0).build();
Object.assign(IndentationSensitive, {
  _matchStateInitializer(state) {
    state.userData = findIndentation(state.input);
    state.inputStream = new InputStreamWithIndentation(state);
  },
  supportsIncrementalParsing: false
});
Grammar.initApplicationParser(ohmGrammar, buildGrammar);
var isBuffer = (obj) => !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
function compileAndLoad(source, namespace) {
  const m = ohmGrammar.match(source, "Grammars");
  if (m.failed()) {
    throw grammarSyntaxError(m);
  }
  return buildGrammar(m, namespace);
}
function grammar(source, optNamespace) {
  const ns = grammars(source, optNamespace);
  const grammarNames = Object.keys(ns);
  if (grammarNames.length === 0) {
    throw new Error("Missing grammar definition");
  } else if (grammarNames.length > 1) {
    const secondGrammar = ns[grammarNames[1]];
    const interval = secondGrammar.source;
    throw new Error(getLineAndColumnMessage(interval.sourceString, interval.startIdx) + "Found more than one grammar definition -- use ohm.grammars() instead.");
  }
  return ns[grammarNames[0]];
}
function grammars(source, optNamespace) {
  const ns = Object.create(optNamespace || {});
  if (typeof source !== "string") {
    if (isBuffer(source)) {
      source = source.toString();
    } else {
      throw new TypeError("Expected string as first argument, got " + unexpectedObjToString(source));
    }
  }
  compileAndLoad(source, ns);
  return ns;
}

// app/meta/FormulaCompiler.js
var formulaGrammar = grammar(String.raw`

Formula {
  Formula
    = Exp "=" ref end  -- oneExp
    | Exp "=" Exp  -- twoExps

  Exp
    = AddExp

  AddExp
    = AddExp ("+" | "-") MulExp  -- add
    | MulExp

  MulExp
    = MulExp "×" UnExp  -- mul
    | UnExp

  UnExp
    = "-" PriExp  -- neg
    | PriExp

  PriExp
    = "(" Exp ")"  -- paren
    | ref

  ref
    = numberRef
    | labelRef
    | propRef

  // lexical rules

  numberRef  (a number reference)
    = "@" digit+

  labelRef (a label reference)
    = "#" digit+

  propRef (a property picker reference)
    = "!" digit+
}
`);
var FormulaCompiler = class {
  constructor(page2) {
    function getVariableByTokenId(id, type, aThing) {
      const token = page2.root.find({
        what: aThing,
        that: (thing) => thing.id === id
      });
      if (!token) {
        console.error("invalid", type, "token id", id);
        throw ":(";
      }
      return token.getVariable();
    }
    this.semantics = formulaGrammar.createSemantics().addAttribute("variable", {
      numberRef(at, idDigits) {
        const id = parseInt(idDigits.sourceString);
        return getVariableByTokenId(id, "number", aNumberToken);
      },
      labelRef(hash, idDigits) {
        const id = parseInt(idDigits.sourceString);
        return getVariableByTokenId(id, "label", aLabelToken);
      },
      propRef(bang, idDigits) {
        const id = parseInt(idDigits.sourceString);
        return getVariableByTokenId(id, "propertyPicker", aPropertyPicker);
      }
    }).addOperation("collectVars(vars)", {
      AddExp_add(a, op, b) {
        a.collectVars(this.args.vars);
        b.collectVars(this.args.vars);
      },
      MulExp_mul(a, op, b) {
        a.collectVars(this.args.vars);
        b.collectVars(this.args.vars);
      },
      UnExp_neg(op, e) {
        e.collectVars(this.args.vars);
      },
      PriExp_paren(oparen, e, cparen) {
        e.collectVars(this.args.vars);
      },
      numberRef(at, idDigits) {
        this.args.vars.add(this.variable);
      },
      labelRef(hash, idDigits) {
        this.args.vars.add(this.variable);
      },
      propRef(bang, idDigits) {
        this.args.vars.add(this.variable);
      }
    }).addAttribute("vars", {
      Exp(e) {
        const vars = new Set();
        e.collectVars(vars);
        return vars;
      }
    }).addOperation("compile", {
      AddExp_add(a, op, b) {
        return `(${a.compile()} ${op.sourceString} ${b.compile()})`;
      },
      MulExp_mul(a, op, b) {
        return `(${a.compile()} * ${b.compile()})`;
      },
      UnExp_neg(op, e) {
        return `(${op.sourceString}${e.compile()})`;
      },
      PriExp_paren(oparen, e, cparen) {
        return `(${e.compile()})`;
      },
      numberRef(at, id) {
        return `v${this.variable.id}`;
      },
      labelRef(hash, id) {
        return `v${this.variable.id}`;
      },
      propRef(bang, id) {
        return `v${this.variable.id}`;
      }
    }).addOperation("toConstraint", {
      Formula_oneExp(e, eq, ref, end2) {
        let vars;
        try {
          vars = e.vars;
        } catch {
          return null;
        }
        const formula2 = createFormulaConstraint([...vars], e.compile());
        equals(ref.variable, formula2.result);
        return formula2;
      },
      Formula_twoExps(left, eq, right) {
        let leftVars, rightVars;
        try {
          leftVars = left.vars;
          rightVars = right.vars;
        } catch {
          return null;
        }
        const leftFormula = createFormulaConstraint([...leftVars], left.compile());
        const rightFormula = createFormulaConstraint([...rightVars], right.compile());
        equals(rightFormula.result, leftFormula.result);
        return {
          remove() {
            leftFormula.remove();
            rightFormula.remove();
          }
        };
      }
    });
  }
  compile(input) {
    const m = formulaGrammar.match(input);
    if (m.succeeded()) {
      return this.semantics(m).toConstraint();
    } else {
      Svg_default.showStatus(m.shortMessage);
      console.error(m.message);
      return null;
    }
  }
};
var FormulaCompiler_default = FormulaCompiler;
function createFormulaConstraint(vars, compiledExp) {
  const argNames = vars.map((v) => `v${v.id}`);
  const func = new Function(`[${argNames}]`, `return ${compiledExp}`);
  return formula(vars, func);
}

// app/meta/Formula.js
var PADDING = 3;
var Formula2 = class extends Token_default {
  constructor() {
    super(...arguments);
    this.height = 30 + PADDING * 2;
    this.boxElement = Svg_default.add("rect", Svg_default.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "parsed-formula"
    });
    this.constraint = null;
  }
  static createFromContext(ctx, token) {
    const formula2 = new Formula2();
    ctx.page.adopt(formula2);
    if (token) {
      formula2.adopt(token);
    }
    formula2.edit();
    formula2.position = ctx.event.position;
    return formula2;
  }
  isPrimary() {
    return false;
  }
  edit() {
    if (this.constraint) {
      this.constraint.remove();
      this.constraint = null;
    }
    this.adopt(new EmptyToken_default());
    this.adopt(new EmptyToken_default());
    this.adopt(new EmptyToken_default());
    this.adopt(new EmptyToken_default());
    for (const numberToken of this.findAll({what: aNumberToken})) {
      numberToken.refreshEditValue();
    }
    this.editing = true;
    this.updateCells();
  }
  close() {
    if (!this.editing) {
      return;
    }
    const tokens = this.findAll({what: aToken});
    const filteredTokens = tokens.filter((t) => !(t instanceof EmptyToken_default));
    if (filteredTokens.length === 0) {
      this.editing = false;
      this.remove();
      return;
    }
    if (filteredTokens.length === 1) {
      const firstToken = tokens[0];
      firstToken.embedded = false;
      firstToken.editing = false;
      if (firstToken instanceof NumberToken_default) {
        firstToken.refreshValue();
      }
      this.page.adopt(firstToken);
      this.editing = false;
      this.remove();
      return;
    }
    const equalsIndex = filteredTokens.findIndex((token) => token instanceof OpToken_default && token.stringValue === "=");
    if (equalsIndex < 0) {
      this.adopt(new OpToken_default("="));
      this.adopt(new NumberToken_default());
    } else if (equalsIndex === filteredTokens.length - 1) {
      this.adopt(new NumberToken_default());
    }
    for (const numberToken of this.findAll({what: aNumberToken})) {
      numberToken.refreshValue();
    }
    const compiler = new FormulaCompiler_default(this.page);
    const newFormulaConstraint = compiler.compile(this.getFormulaAsText());
    if (!newFormulaConstraint) {
      return;
    }
    this.constraint = newFormulaConstraint;
    this.discardEmptyTokens();
    this.editing = false;
    this.updateCells();
  }
  discardEmptyTokens() {
    const emptyTokens = this.findAll({what: anEmptyToken});
    for (const token of emptyTokens) {
      token.remove();
    }
  }
  updateCells() {
    if (!this.editing) {
      for (const cell of this.findAll({what: aWritingCell})) {
        cell.remove();
      }
      return;
    }
    let totalCellCount = 0;
    for (const token of this.findAll({what: aToken})) {
      totalCellCount += token instanceof NumberToken_default ? token.editValue.length : 1;
    }
    const currentCells = this.findAll({what: aWritingCell});
    console.log(currentCells.length, totalCellCount);
    console.log(currentCells);
    if (currentCells.length < totalCellCount) {
      const diff = totalCellCount - currentCells.length;
      for (let i = 0; i < diff; i++) {
        this.adopt(new WritingCell_default());
      }
    } else if (currentCells.length > totalCellCount) {
      const diff = currentCells.length - totalCellCount;
      for (let i = 0; i < diff; i++) {
        const cell = currentCells.pop();
        cell?.remove();
      }
    }
  }
  layoutCells() {
    if (!this.editing) {
      return;
    }
    const cells = this.findAll({what: aWritingCell});
    for (const token of this.findAll({what: aToken})) {
      if (token instanceof NumberToken_default) {
        for (let i = 0; i < token.editValue.length; i++) {
          const cell = cells.shift();
          if (cell) {
            cell.position = vec_default.add(token.position, {
              x: (24 + PADDING) * i,
              y: 0
            });
          }
        }
      } else {
        const cell = cells.shift();
        if (cell) {
          cell.position = token.position;
          cell.width = token.width;
        }
      }
    }
  }
  getFormulaAsText() {
    const formula2 = [];
    for (const token of this.findAll({what: aToken})) {
      if (token instanceof OpToken_default) {
        formula2.push(token.stringValue);
      } else if (token instanceof NumberToken_default) {
        formula2.push("@" + token.id);
      } else if (token instanceof LabelToken_default) {
        formula2.push("#" + token.id);
      } else if (token instanceof PropertyPicker_default) {
        formula2.push("!" + token.id);
      } else if (token instanceof EmptyToken_default) {
      } else {
        throw new Error("unexpected token type in formula: " + token.constructor.name);
      }
    }
    return formula2.join(" ");
  }
  updateWritingCells() {
    const tokens = this.findAll({what: aToken});
    let tokenIndex = 0;
    let token = tokens[tokenIndex];
    let offsetInsideToken = -1;
    const cells = this.findAll({what: aWritingCell});
    for (const cell of cells) {
      offsetInsideToken += 1;
      const tokenSize = token instanceof NumberToken_default ? token.editValue.length : 1;
      if (offsetInsideToken === tokenSize) {
        offsetInsideToken = 0;
        tokenIndex += 1;
        token = tokens[tokenIndex];
      }
      if (cell.stringValue !== "") {
        if (token instanceof NumberToken_default) {
          if (isNumeric(cell.stringValue)) {
            token.updateCharAt(offsetInsideToken, cell.stringValue);
          } else {
            const start = token.editValue.slice(0, offsetInsideToken);
            const end2 = token.editValue.slice(offsetInsideToken + 1);
            token.editValue = start;
            tokens.splice(tokenIndex + 1, 0, new OpToken_default(cell.stringValue));
            if (end2 !== "") {
              const numToken = new NumberToken_default();
              numToken.editValue = end2;
              tokens.splice(tokenIndex + 2, 0, numToken);
            }
          }
        } else if (token instanceof EmptyToken_default || token instanceof OpToken_default) {
          if (isNumeric(cell.stringValue)) {
            const prev = tokens[tokenIndex - 1];
            const next = tokens[tokenIndex + 1];
            if (prev instanceof NumberToken_default) {
              prev.addChar(cell.stringValue);
              if (next instanceof NumberToken_default) {
                prev.editValue += next.editValue;
                tokens[tokenIndex].remove();
                tokens[tokenIndex + 1].remove();
                tokens.splice(tokenIndex, 2);
              } else {
                tokens[tokenIndex].remove();
                tokens.splice(tokenIndex, 1);
                tokens.push(new EmptyToken_default());
              }
            } else {
              const numToken = new NumberToken_default();
              numToken.addChar(cell.stringValue);
              tokens[tokenIndex].remove();
              tokens[tokenIndex] = numToken;
              tokens.push(new EmptyToken_default());
            }
          } else {
            const opToken = new OpToken_default(cell.stringValue);
            tokens[tokenIndex].remove();
            tokens[tokenIndex] = opToken;
            tokens.push(new EmptyToken_default());
          }
        }
        cell.stringValue = "";
        for (const t of tokens) {
          this.adopt(t);
        }
        this.updateCells();
      }
    }
  }
  insertInto(emptyToken, newToken) {
    const tokens = this.findAll({what: aToken});
    const idx = tokens.indexOf(emptyToken);
    if (idx < 0) {
      throw new Error("bad call to Formula.insertInto()");
    }
    tokens.splice(idx, 0, newToken);
    newToken.editing = true;
    for (const t of tokens) {
      this.adopt(t);
    }
    this.updateCells();
  }
  render(dt, t) {
    if (this.editing) {
      this.updateWritingCells();
    }
    let nextTokenPosition = vec_default.add(this.position, vec_default(PADDING, PADDING));
    for (const token of this.findAll({what: aToken})) {
      token.position = nextTokenPosition;
      token.embedded = true;
      token.editing = this.editing;
      nextTokenPosition = vec_default.add(nextTokenPosition, vec_default(token.width + PADDING, 0));
    }
    this.width = nextTokenPosition.x - this.position.x;
    if (this.children.size === 0) {
      Svg_default.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: 0
      });
      this.width -= PADDING * 2;
    } else {
      Svg_default.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: this.width
      });
    }
    this.layoutCells();
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
  erase(position) {
  }
  remove() {
    this.constraint?.remove();
    this.boxElement.remove();
    for (const child of this.children) {
      child.remove();
    }
    super.remove();
  }
};
var Formula_default = Formula2;
function isNumeric(v) {
  return "0" <= v && v <= "9";
}
var aFormula = (gameObj) => gameObj instanceof Formula2 ? gameObj : null;

// app/ink/FormulaStroke.js
var FormulaStroke = class extends Stroke_default {
  constructor() {
    super(...arguments);
    this.element = Svg_default.add("polyline", Svg_default.guiElm, {
      class: "formula stroke"
    });
  }
};
var FormulaStroke_default = FormulaStroke;

// app/gestures/Gesture.js
var Gesture = class {
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
      const elm = Svg_default.now("g", {
        class: "gesture",
        transform: Svg_default.positionToTransform(event.position)
      });
      Svg_default.add("circle", elm, {r: event.type === "pencil" ? 2 : 8});
      Svg_default.add("text", elm, {content: this.label});
    }
  }
};

// app/gestures/FormulaEditor.js
function tapFormulaLabel(ctx) {
}
function pencilFormulaEditor(ctx) {
  if (!ctx.metaToggle.active) {
    return;
  }
  const writingCell = ctx.root.find({
    what: aWritingCell,
    near: ctx.event.position,
    recursive: true
  });
  if (writingCell) {
    const stroke = ctx.page.addStroke(new FormulaStroke_default());
    return new Gesture("Writing In Formula Editor", {
      moved(ctx2) {
        stroke.points.push(ctx2.event.position);
      },
      ended(_ctx) {
        writingCell.captureStroke(stroke);
      }
    });
  }
}
function closeFormulaEditor(ctx) {
  if (ctx.pseudoCount >= 2 && ctx.event.type === "finger") {
    for (const formula2 of ctx.root.findAll({what: aFormula})) {
      formula2.close();
    }
  }
}

// app/gestures/Handle.js
function touchHandle(ctx) {
  let handle = ctx.page.find({
    what: aCanonicalHandle,
    near: ctx.event.position,
    tooFar: 40
  });
  if (handle) {
    if (ctx.pseudoCount >= 3 && handle.canonicalInstance.absorbedHandles.size > 0) {
      const handles = [...handle.canonicalInstance.absorbedHandles];
      handle = handle.breakOff(handles[handles.length - 1]);
    }
    return touchHandleHelper(handle);
  }
}
function touchHandleHelper(handle) {
  let lastPos = vec_default.clone(handle);
  let offset;
  return new Gesture("Touch Handle", {
    began(ctx) {
      offset = vec_default.sub(handle.position, ctx.event.position);
      if (Config_default.gesture.lookAt) {
        lastPos = vec_default.clone(handle);
      } else {
        finger(handle);
      }
    },
    moved(ctx) {
      handle.position = vec_default.add(ctx.event.position, offset);
      if (Config_default.gesture.lookAt) {
        lastPos = vec_default.clone(handle);
      } else {
        finger(handle);
      }
      if (ctx.pseudoCount === 2 && handle.parent instanceof StrokeGroup_default && handle.canonicalInstance.absorbedHandles.size === 0) {
        handle.parent.generatePointData();
      }
    },
    ended(ctx) {
      handle.getAbsorbedByNearestHandle();
      if (!Config_default.gesture.lookAt) {
        finger(handle).remove();
      }
      if (!ctx.state.drag && ctx.metaToggle.active) {
        handle.togglePin();
      }
    },
    render() {
      if (Config_default.gesture.lookAt) {
        const count = Math.pow(vec_default.dist(handle.position, lastPos), 1 / 3);
        let c = count;
        while (--c > 0) {
          let v = vec_default.sub(handle.position, lastPos);
          v = vec_default.add(lastPos, vec_default.mulS(v, c / count));
          Svg_default.now("circle", {
            cx: v.x,
            cy: v.y,
            r: 4,
            class: "desire"
          });
        }
      }
    }
  });
}

// lib/types.js
function isPosition(value) {
  return value instanceof Object && typeof value.x === "number" && typeof value.y === "number";
}

// app/Store.js
var Store_default = {
  init({name, isValid, def}) {
    const result = this.get(name);
    return isValid(result) ? result : def;
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    return val;
  },
  get(key) {
    return JSON.parse(localStorage.getItem(key) || "null");
  }
};

// app/gui/MetaToggle.js
var padding = 30;
var radius = 20;
var aMetaToggle = (gameObj) => gameObj instanceof MetaToggle ? gameObj : null;
var MetaToggle = class extends GameObject {
  constructor() {
    super();
    this.dragging = false;
    this.active = false;
    this.splats = [];
    this.position = Store_default.init({
      name: "Meta Toggle Position",
      isValid: isPosition,
      def: {x: padding, y: padding}
    });
    this.element = Svg_default.add("g", Svg_default.guiElm, {
      ...this.getAttrs()
    });
    Svg_default.add("circle", this.element, {class: "outer", r: radius});
    Svg_default.add("circle", this.element, {class: "inner", r: radius});
    const splatsElm = Svg_default.add("g", this.element, {class: "splats"});
    for (let i = 0; i < 50; i++) {
      const points2 = [];
      const steps = 5;
      for (let s = 0; s < steps; s++) {
        const a = TAU * (rand(-0.1, 0.1) + s) / steps;
        const d = rand(1, 3);
        points2.push(vec_default.polar(a, d));
      }
      this.splats.push(Svg_default.add("polyline", splatsElm, {
        points: Svg_default.points(points2),
        class: "splat"
      }));
    }
    Svg_default.add("circle", this.element, {class: "secret", r: radius});
    this.resplat();
  }
  resplat() {
    if (!this.active) {
      let angles = [];
      this.splats.forEach((splat) => {
        angles = [];
        for (let i = rand(2, 12); i > 0; i--) {
          angles.push(rand(0, 360));
        }
        const a = angles[rand(0, angles.length) | 0];
        const curve = rand(0, 1) ** 8;
        const mass = lerpN(curve, 1, 0.5);
        const t = 10 / mass / mass;
        const squish = rand(0, 0.7);
        Svg_default.update(splat, {
          style: `scale: .25; transition-delay: ${rand(0, 0.17)}s`,
          transform: `
            rotate(${a})
            translate(${t})
            scale(${1 + squish}, ${1 - squish})
          `
        });
      });
    } else {
      this.splats.forEach((splat) => {
        Svg_default.update(splat, {style: `scale: 0.1`});
      });
    }
  }
  toggle() {
    this.active = !this.active;
    document.documentElement.toggleAttribute("meta-mode", this.active);
    this.resplat();
  }
  distanceToPoint(point) {
    return vec_default.dist(this.position, point);
  }
  dragTo(position) {
    this.dragging = true;
    this.position = position;
  }
  remove() {
    window.location.reload();
  }
  snapToCorner() {
    this.dragging = false;
    const windowSize = vec_default(window.innerWidth, window.innerHeight);
    const normalizedPosition = vec_default.round(vec_default.div(this.position, windowSize));
    const cornerPosition = vec_default.mul(normalizedPosition, windowSize);
    const sign = vec_default.addS(vec_default.mulS(normalizedPosition, -2), 1);
    this.position = vec_default.add(cornerPosition, vec_default.mulS(sign, padding));
    Store_default.set("Meta Toggle Position", this.position);
  }
  getAttrs() {
    const classes = ["meta-toggle"];
    if (this.active) {
      classes.push("active");
    }
    if (this.dragging) {
      classes.push("dragging");
    }
    return {
      color: "black",
      class: classes.join(" "),
      style: `translate: ${this.position.x}px ${this.position.y}px`
    };
  }
  render() {
    Svg_default.update(this.element, this.getAttrs());
  }
};
var MetaToggle_default = MetaToggle;

// app/gestures/MetaToggle.js
function touchMetaToggle(ctx) {
  const metaToggle2 = ctx.root.find({
    what: aMetaToggle,
    near: ctx.event.position,
    recursive: false,
    tooFar: 50
  });
  const dragThreshold = 100;
  if (metaToggle2) {
    return new Gesture("Touch Meta Toggle", {
      moved(ctx2) {
        if (ctx2.state.dragDist > dragThreshold) {
          metaToggle2.dragTo(ctx2.event.position);
        }
      },
      ended(ctx2) {
        metaToggle2.snapToCorner();
        if (ctx2.pseudo) {
          cycleTheme();
        } else if (ctx2.state.dragDist <= dragThreshold) {
          metaToggle2.toggle();
        }
      }
    });
  }
}

// app/meta/token-helpers.js
var isTokenWithVariable = (token) => token instanceof NumberToken_default || token instanceof LabelToken_default || token instanceof PropertyPicker_default;
var isPropertyPicker = (token) => token instanceof PropertyPicker_default;
var isNumberToken = (token) => token instanceof NumberToken_default;

// app/gestures/Token.js
function touchToken(ctx) {
  if (!ctx.metaToggle.active) {
    return;
  }
  const token = ctx.page.find({
    what: aToken,
    near: ctx.event.position
  });
  if (!token) {
    return;
  }
  const offset = vec_default.sub(token.position, ctx.event.position);
  return new Gesture("Touch Token", {
    dragged(ctx2) {
      token.position = vec_default.add(ctx2.event.position, offset);
    },
    ended(ctx2) {
      if (!ctx2.state.drag) {
        const primaryToken = ctx2.page.find({
          what: aPrimaryToken,
          near: ctx2.event.position
        });
        if (isNumberToken(primaryToken)) {
          primaryToken.onTap();
        }
      }
    }
  });
}
function scrubNumberToken(ctx) {
  if (!(ctx.metaToggle.active && ctx.pseudo)) {
    return;
  }
  const token = ctx.page.find({
    what: aPrimaryToken,
    near: ctx.event.position
  });
  if (!isNumberToken(token)) {
    return;
  }
  const v = token.getVariable();
  const wasLocked = v.isLocked;
  let initialY = ctx.event.position.y;
  let initialValue = v.value;
  let fingers = 0;
  return new Gesture("Scrub Number Token", {
    moved(ctx2) {
      if (fingers !== ctx2.pseudoCount) {
        fingers = ctx2.pseudoCount;
        initialValue = v.value;
        initialY = ctx2.event.position.y;
      }
      const delta = initialY - ctx2.event.position.y;
      const m = 1 / Math.pow(10, fingers - 1);
      const value = Math.round((initialValue + delta * m) / m) * m;
      token.getVariable().lock(value, true);
    },
    ended(ctx2) {
      if (!wasLocked) {
        token.getVariable().unlock();
      }
    }
  });
}

// app/gestures/DrawInk.js
function drawInk(ctx) {
  if (!ctx.metaToggle.active) {
    if (ctx.root.find({
      what: aMetaToggle,
      near: ctx.event.position,
      recursive: false,
      tooFar: 35
    })) {
      return;
    }
    const stroke = ctx.page.addStroke(new Stroke_default());
    return new Gesture("Draw Ink", {
      moved(ctx2) {
        stroke.points.push(ctx2.event.position);
      },
      ended(ctx2) {
        if (!ctx2.state.drag && ctx2.state.dragDist < 20) {
          stroke.remove();
        }
      }
    });
  }
}

// app/meta/Gizmo.js
var arc = Svg_default.arcPath(vec_default.zero, 10, TAU / 4, Math.PI / 3);
var Gizmo = class extends GameObject {
  constructor(a, b) {
    super();
    this.elm = Svg_default.add("g", Svg_default.gizmoElm, {class: "gizmo"});
    this.thick = Svg_default.add("polyline", this.elm, {class: "thick"});
    this.arrow = Svg_default.add("polyline", this.elm, {class: "arrow"});
    this.arcs = Svg_default.add("g", this.elm, {class: "arcs"});
    this.arc1 = Svg_default.add("path", this.arcs, {d: arc, class: "arc1"});
    this.arc2 = Svg_default.add("path", this.arcs, {d: arc, class: "arc2"});
    this._a = new WeakRef(a);
    this._b = new WeakRef(b);
    this.center = this.updateCenter();
    ({distance: this.distance, angle: this.angleInRadians} = polarVector(a, b));
    this.angleInDegrees = linearRelationship(variable(this.angleInRadians.value * 180 / Math.PI), 180 / Math.PI, this.angleInRadians, 0).y;
    this.distance.represents = {
      object: this,
      property: "distance"
    };
    this.angleInRadians.represents = {
      object: this,
      property: "angle-radians"
    };
    this.angleInDegrees.represents = {
      object: this,
      property: "angle-degrees"
    };
    this.wirePort = this.adopt(new WirePort(this.center, new MetaStruct([
      new MetaLabel("distance", this.distance),
      new MetaLabel("angle", this.angleInDegrees)
    ])));
  }
  get a() {
    return this._a.deref();
  }
  get b() {
    return this._b.deref();
  }
  get handles() {
    const a = this.a;
    const b = this.b;
    return a && b ? {a, b} : null;
  }
  updateCenter() {
    const handles = this.handles;
    if (!handles) {
      return this.center;
    }
    return this.center = vec_default.avg(handles.a.position, handles.b.position);
  }
  midPoint() {
    return this.center;
  }
  cycleConstraints() {
    const aLock = this.angleInRadians.isLocked;
    const dLock = this.distance.isLocked;
    if (!aLock && !dLock) {
      this.toggleDistance();
    } else if (dLock && !aLock) {
      this.toggleAngle();
    } else if (dLock && aLock) {
      this.toggleDistance();
    } else if (!dLock && aLock) {
      this.toggleAngle();
    }
  }
  toggleDistance() {
    this.distance.toggleLock();
  }
  toggleAngle() {
    this.angleInRadians.toggleLock();
  }
  render() {
    this.updateCenter();
    this.wirePort.position = this.center;
    const handles = this.handles;
    if (!handles) {
      return;
    }
    const a = handles.a.position;
    const b = handles.b.position;
    const len = vec_default.dist(a, b);
    const angle = this.angleInDegrees.value;
    const aLock = this.angleInRadians.isLocked;
    const dLock = this.distance.isLocked;
    const fade = lerp(len, 80, 100, 0, 1);
    Svg_default.update(this.elm, {"is-constrained": aLock || dLock});
    Svg_default.update(this.thick, {points: Svg_default.points(a, b)});
    if (len > 0) {
      const ab = vec_default.sub(b, a);
      const arrow = vec_default.renormalize(ab, 4);
      const tail = vec_default.sub(this.center, vec_default.renormalize(ab, 30));
      const tip = vec_default.add(this.center, vec_default.renormalize(ab, 30));
      const port = vec_default.sub(tip, vec_default.rotate(arrow, TAU / 12));
      const starboard = vec_default.sub(tip, vec_default.rotate(arrow, -TAU / 12));
      Svg_default.update(this.arrow, {
        points: Svg_default.points(tail, tip, port, starboard, tip),
        style: `opacity: ${fade}`
      });
      Svg_default.update(this.arcs, {
        style: `
        opacity: ${fade};
        transform:
          translate(${this.center.x}px, ${this.center.y}px)
          rotate(${angle}deg)
        `
      });
      const xOffset = aLock ? 0 : dLock ? 9.4 : 12;
      const yOffset = dLock ? -3.5 : 0;
      const arcTransform = `transform: translate(${xOffset}px, ${yOffset}px)`;
      Svg_default.update(this.arc1, {style: arcTransform});
      Svg_default.update(this.arc2, {style: arcTransform});
    }
  }
  distanceToPoint(point) {
    if (!this.handles) {
      return Infinity;
    }
    const line = line_default(this.handles.a.position, this.handles.b.position);
    const l = line_default.distToPoint(line, point);
    const a = vec_default.dist(this.center, point);
    return Math.min(l, a);
  }
  centerDistanceToPoint(p) {
    return vec_default.dist(this.midPoint(), p);
  }
  remove() {
    this.elm.remove();
    this.a?.remove();
    this.b?.remove();
    super.remove();
  }
};
var Gizmo_default = Gizmo;
var aGizmo = (gameObj) => gameObj instanceof Gizmo ? gameObj : null;

// app/meta/PropertyPickerEditor.js
var LINEHEIGHT = 30;
var PropertyPickerEditor = class extends GameObject {
  constructor(propertyPicker) {
    super();
    this.width = 200;
    this.height = 44;
    this.position = {x: 100, y: 100};
    this.svgTextElements = [];
    this.propertyPicker = propertyPicker;
    this.props = propertyPicker.inputPort.value.list();
    this.height = this.props.length * LINEHEIGHT;
    this.position = propertyPicker.position;
    this.boxElement = Svg_default.add("rect", Svg_default.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      class: "property-picker-editor-box"
    });
    this.svgTextElements = this.props.map((label, index) => {
      const text = Svg_default.add("text", Svg_default.metaElm, {
        x: this.position.x + 5,
        y: this.position.y + 24 + index * LINEHEIGHT,
        class: "property-picker-editor-text",
        content: label.display
      });
      return text;
    });
  }
  onTapInside(position) {
    const index = Math.floor((position.y - this.position.y) / LINEHEIGHT);
    this.propertyPicker.setProperty(this.props[index]);
    this.remove(false);
  }
  distanceToPoint(pos) {
    return signedDistanceToBox(this.position.x, this.position.y, this.width, this.height, pos.x, pos.y);
  }
  render() {
  }
  remove(isErase = true) {
    if (isErase) {
      this.propertyPicker.remove();
    }
    for (const element of this.svgTextElements) {
      element.remove();
    }
    this.boxElement.remove();
    super.remove();
  }
};
var PropertyPickerEditor_default = PropertyPickerEditor;
var aPropertyPickerEditor = (gameObj) => gameObj instanceof PropertyPickerEditor ? gameObj : null;

// lib/polygon.js
function closestPointOnPolygon(polygon, pos) {
  let closestPoint = polygon[0];
  let closestDistance = Infinity;
  for (let idx = 0; idx < polygon.length - 1; idx++) {
    const p1 = polygon[idx];
    const p2 = polygon[idx + 1];
    const pt = line_default.closestPoint(line_default(p1, p2), pos);
    const distance = vec_default.dist(pt, pos);
    if (distance < closestDistance) {
      closestPoint = pt;
      closestDistance = distance;
    }
  }
  return closestPoint;
}

// _snowpack/pkg/@doodle3d/clipper-js.js
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function createCommonjsModule(fn, basedir, module2) {
  return module2 = {
    path: basedir,
    exports: {},
    require: function(path2, base) {
      return commonjsRequire(path2, base === void 0 || base === null ? module2.path : base);
    }
  }, fn(module2, module2.exports), module2.exports;
}
function commonjsRequire() {
  throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
}
var clipper = createCommonjsModule(function(module2) {
  (function() {
    var ClipperLib = {};
    ClipperLib.version = "6.4.2.2";
    ClipperLib.use_lines = true;
    ClipperLib.use_xyz = false;
    var isNode = false;
    if (module2.exports) {
      module2.exports = ClipperLib;
      isNode = true;
    } else {
      if (typeof document !== "undefined")
        window.ClipperLib = ClipperLib;
      else
        self["ClipperLib"] = ClipperLib;
    }
    var navigator_appName;
    if (!isNode) {
      var nav = navigator.userAgent.toString().toLowerCase();
      navigator_appName = navigator.appName;
    } else {
      var nav = "chrome";
      navigator_appName = "Netscape";
    }
    var browser = {};
    if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1)
      browser.chrome = 1;
    else
      browser.chrome = 0;
    if (nav.indexOf("chromium") != -1)
      browser.chromium = 1;
    else
      browser.chromium = 0;
    if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1)
      browser.safari = 1;
    else
      browser.safari = 0;
    if (nav.indexOf("firefox") != -1)
      browser.firefox = 1;
    else
      browser.firefox = 0;
    if (nav.indexOf("firefox/17") != -1)
      browser.firefox17 = 1;
    else
      browser.firefox17 = 0;
    if (nav.indexOf("firefox/15") != -1)
      browser.firefox15 = 1;
    else
      browser.firefox15 = 0;
    if (nav.indexOf("firefox/3") != -1)
      browser.firefox3 = 1;
    else
      browser.firefox3 = 0;
    if (nav.indexOf("opera") != -1)
      browser.opera = 1;
    else
      browser.opera = 0;
    if (nav.indexOf("msie 10") != -1)
      browser.msie10 = 1;
    else
      browser.msie10 = 0;
    if (nav.indexOf("msie 9") != -1)
      browser.msie9 = 1;
    else
      browser.msie9 = 0;
    if (nav.indexOf("msie 8") != -1)
      browser.msie8 = 1;
    else
      browser.msie8 = 0;
    if (nav.indexOf("msie 7") != -1)
      browser.msie7 = 1;
    else
      browser.msie7 = 0;
    if (nav.indexOf("msie ") != -1)
      browser.msie = 1;
    else
      browser.msie = 0;
    ClipperLib.biginteger_used = null;
    var dbits;
    function BigInteger(a, b, c) {
      ClipperLib.biginteger_used = 1;
      if (a != null)
        if (typeof a == "number" && typeof b == "undefined")
          this.fromInt(a);
        else if (typeof a == "number")
          this.fromNumber(a, b, c);
        else if (b == null && typeof a != "string")
          this.fromString(a, 256);
        else
          this.fromString(a, b);
    }
    function nbi() {
      return new BigInteger(null, void 0, void 0);
    }
    function am1(i, x, w, j, c, n) {
      while (--n >= 0) {
        var v = x * this[i++] + w[j] + c;
        c = Math.floor(v / 67108864);
        w[j++] = v & 67108863;
      }
      return c;
    }
    function am2(i, x, w, j, c, n) {
      var xl = x & 32767, xh = x >> 15;
      while (--n >= 0) {
        var l = this[i] & 32767;
        var h = this[i++] >> 15;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
        w[j++] = l & 1073741823;
      }
      return c;
    }
    function am3(i, x, w, j, c, n) {
      var xl = x & 16383, xh = x >> 14;
      while (--n >= 0) {
        var l = this[i] & 16383;
        var h = this[i++] >> 14;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 16383) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 268435455;
      }
      return c;
    }
    if (navigator_appName == "Microsoft Internet Explorer") {
      BigInteger.prototype.am = am2;
      dbits = 30;
    } else if (navigator_appName != "Netscape") {
      BigInteger.prototype.am = am1;
      dbits = 26;
    } else {
      BigInteger.prototype.am = am3;
      dbits = 28;
    }
    BigInteger.prototype.DB = dbits;
    BigInteger.prototype.DM = (1 << dbits) - 1;
    BigInteger.prototype.DV = 1 << dbits;
    var BI_FP = 52;
    BigInteger.prototype.FV = Math.pow(2, BI_FP);
    BigInteger.prototype.F1 = BI_FP - dbits;
    BigInteger.prototype.F2 = 2 * dbits - BI_FP;
    var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
    var BI_RC = new Array();
    var rr, vv;
    rr = "0".charCodeAt(0);
    for (vv = 0; vv <= 9; ++vv)
      BI_RC[rr++] = vv;
    rr = "a".charCodeAt(0);
    for (vv = 10; vv < 36; ++vv)
      BI_RC[rr++] = vv;
    rr = "A".charCodeAt(0);
    for (vv = 10; vv < 36; ++vv)
      BI_RC[rr++] = vv;
    function int2char(n) {
      return BI_RM.charAt(n);
    }
    function intAt(s, i) {
      var c = BI_RC[s.charCodeAt(i)];
      return c == null ? -1 : c;
    }
    function bnpCopyTo(r) {
      for (var i = this.t - 1; i >= 0; --i)
        r[i] = this[i];
      r.t = this.t;
      r.s = this.s;
    }
    function bnpFromInt(x) {
      this.t = 1;
      this.s = x < 0 ? -1 : 0;
      if (x > 0)
        this[0] = x;
      else if (x < -1)
        this[0] = x + this.DV;
      else
        this.t = 0;
    }
    function nbv(i) {
      var r = nbi();
      r.fromInt(i);
      return r;
    }
    function bnpFromString(s, b) {
      var k;
      if (b == 16)
        k = 4;
      else if (b == 8)
        k = 3;
      else if (b == 256)
        k = 8;
      else if (b == 2)
        k = 1;
      else if (b == 32)
        k = 5;
      else if (b == 4)
        k = 2;
      else {
        this.fromRadix(s, b);
        return;
      }
      this.t = 0;
      this.s = 0;
      var i = s.length, mi = false, sh = 0;
      while (--i >= 0) {
        var x = k == 8 ? s[i] & 255 : intAt(s, i);
        if (x < 0) {
          if (s.charAt(i) == "-")
            mi = true;
          continue;
        }
        mi = false;
        if (sh == 0)
          this[this.t++] = x;
        else if (sh + k > this.DB) {
          this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
          this[this.t++] = x >> this.DB - sh;
        } else
          this[this.t - 1] |= x << sh;
        sh += k;
        if (sh >= this.DB)
          sh -= this.DB;
      }
      if (k == 8 && (s[0] & 128) != 0) {
        this.s = -1;
        if (sh > 0)
          this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
      }
      this.clamp();
      if (mi)
        BigInteger.ZERO.subTo(this, this);
    }
    function bnpClamp() {
      var c = this.s & this.DM;
      while (this.t > 0 && this[this.t - 1] == c)
        --this.t;
    }
    function bnToString(b) {
      if (this.s < 0)
        return "-" + this.negate().toString(b);
      var k;
      if (b == 16)
        k = 4;
      else if (b == 8)
        k = 3;
      else if (b == 2)
        k = 1;
      else if (b == 32)
        k = 5;
      else if (b == 4)
        k = 2;
      else
        return this.toRadix(b);
      var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
      var p = this.DB - i * this.DB % k;
      if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) > 0) {
          m = true;
          r = int2char(d);
        }
        while (i >= 0) {
          if (p < k) {
            d = (this[i] & (1 << p) - 1) << k - p;
            d |= this[--i] >> (p += this.DB - k);
          } else {
            d = this[i] >> (p -= k) & km;
            if (p <= 0) {
              p += this.DB;
              --i;
            }
          }
          if (d > 0)
            m = true;
          if (m)
            r += int2char(d);
        }
      }
      return m ? r : "0";
    }
    function bnNegate() {
      var r = nbi();
      BigInteger.ZERO.subTo(this, r);
      return r;
    }
    function bnAbs() {
      return this.s < 0 ? this.negate() : this;
    }
    function bnCompareTo(a) {
      var r = this.s - a.s;
      if (r != 0)
        return r;
      var i = this.t;
      r = i - a.t;
      if (r != 0)
        return this.s < 0 ? -r : r;
      while (--i >= 0)
        if ((r = this[i] - a[i]) != 0)
          return r;
      return 0;
    }
    function nbits(x) {
      var r = 1, t;
      if ((t = x >>> 16) != 0) {
        x = t;
        r += 16;
      }
      if ((t = x >> 8) != 0) {
        x = t;
        r += 8;
      }
      if ((t = x >> 4) != 0) {
        x = t;
        r += 4;
      }
      if ((t = x >> 2) != 0) {
        x = t;
        r += 2;
      }
      if ((t = x >> 1) != 0) {
        x = t;
        r += 1;
      }
      return r;
    }
    function bnBitLength() {
      if (this.t <= 0)
        return 0;
      return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
    }
    function bnpDLShiftTo(n, r) {
      var i;
      for (i = this.t - 1; i >= 0; --i)
        r[i + n] = this[i];
      for (i = n - 1; i >= 0; --i)
        r[i] = 0;
      r.t = this.t + n;
      r.s = this.s;
    }
    function bnpDRShiftTo(n, r) {
      for (var i = n; i < this.t; ++i)
        r[i - n] = this[i];
      r.t = Math.max(this.t - n, 0);
      r.s = this.s;
    }
    function bnpLShiftTo(n, r) {
      var bs = n % this.DB;
      var cbs = this.DB - bs;
      var bm = (1 << cbs) - 1;
      var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
      for (i = this.t - 1; i >= 0; --i) {
        r[i + ds + 1] = this[i] >> cbs | c;
        c = (this[i] & bm) << bs;
      }
      for (i = ds - 1; i >= 0; --i)
        r[i] = 0;
      r[ds] = c;
      r.t = this.t + ds + 1;
      r.s = this.s;
      r.clamp();
    }
    function bnpRShiftTo(n, r) {
      r.s = this.s;
      var ds = Math.floor(n / this.DB);
      if (ds >= this.t) {
        r.t = 0;
        return;
      }
      var bs = n % this.DB;
      var cbs = this.DB - bs;
      var bm = (1 << bs) - 1;
      r[0] = this[ds] >> bs;
      for (var i = ds + 1; i < this.t; ++i) {
        r[i - ds - 1] |= (this[i] & bm) << cbs;
        r[i - ds] = this[i] >> bs;
      }
      if (bs > 0)
        r[this.t - ds - 1] |= (this.s & bm) << cbs;
      r.t = this.t - ds;
      r.clamp();
    }
    function bnpSubTo(a, r) {
      var i = 0, c = 0, m = Math.min(a.t, this.t);
      while (i < m) {
        c += this[i] - a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      if (a.t < this.t) {
        c -= a.s;
        while (i < this.t) {
          c += this[i];
          r[i++] = c & this.DM;
          c >>= this.DB;
        }
        c += this.s;
      } else {
        c += this.s;
        while (i < a.t) {
          c -= a[i];
          r[i++] = c & this.DM;
          c >>= this.DB;
        }
        c -= a.s;
      }
      r.s = c < 0 ? -1 : 0;
      if (c < -1)
        r[i++] = this.DV + c;
      else if (c > 0)
        r[i++] = c;
      r.t = i;
      r.clamp();
    }
    function bnpMultiplyTo(a, r) {
      var x = this.abs(), y = a.abs();
      var i = x.t;
      r.t = i + y.t;
      while (--i >= 0)
        r[i] = 0;
      for (i = 0; i < y.t; ++i)
        r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
      r.s = 0;
      r.clamp();
      if (this.s != a.s)
        BigInteger.ZERO.subTo(r, r);
    }
    function bnpSquareTo(r) {
      var x = this.abs();
      var i = r.t = 2 * x.t;
      while (--i >= 0)
        r[i] = 0;
      for (i = 0; i < x.t - 1; ++i) {
        var c = x.am(i, x[i], r, 2 * i, 0, 1);
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
          r[i + x.t] -= x.DV;
          r[i + x.t + 1] = 1;
        }
      }
      if (r.t > 0)
        r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
      r.s = 0;
      r.clamp();
    }
    function bnpDivRemTo(m, q, r) {
      var pm = m.abs();
      if (pm.t <= 0)
        return;
      var pt = this.abs();
      if (pt.t < pm.t) {
        if (q != null)
          q.fromInt(0);
        if (r != null)
          this.copyTo(r);
        return;
      }
      if (r == null)
        r = nbi();
      var y = nbi(), ts = this.s, ms = m.s;
      var nsh = this.DB - nbits(pm[pm.t - 1]);
      if (nsh > 0) {
        pm.lShiftTo(nsh, y);
        pt.lShiftTo(nsh, r);
      } else {
        pm.copyTo(y);
        pt.copyTo(r);
      }
      var ys = y.t;
      var y0 = y[ys - 1];
      if (y0 == 0)
        return;
      var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
      var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
      var i = r.t, j = i - ys, t = q == null ? nbi() : q;
      y.dlShiftTo(j, t);
      if (r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t, r);
      }
      BigInteger.ONE.dlShiftTo(ys, t);
      t.subTo(y, y);
      while (y.t < ys)
        y[y.t++] = 0;
      while (--j >= 0) {
        var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
          y.dlShiftTo(j, t);
          r.subTo(t, r);
          while (r[i] < --qd)
            r.subTo(t, r);
        }
      }
      if (q != null) {
        r.drShiftTo(ys, q);
        if (ts != ms)
          BigInteger.ZERO.subTo(q, q);
      }
      r.t = ys;
      r.clamp();
      if (nsh > 0)
        r.rShiftTo(nsh, r);
      if (ts < 0)
        BigInteger.ZERO.subTo(r, r);
    }
    function bnMod(a) {
      var r = nbi();
      this.abs().divRemTo(a, null, r);
      if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0)
        a.subTo(r, r);
      return r;
    }
    function Classic(m) {
      this.m = m;
    }
    function cConvert(x) {
      if (x.s < 0 || x.compareTo(this.m) >= 0)
        return x.mod(this.m);
      else
        return x;
    }
    function cRevert(x) {
      return x;
    }
    function cReduce(x) {
      x.divRemTo(this.m, null, x);
    }
    function cMulTo(x, y, r) {
      x.multiplyTo(y, r);
      this.reduce(r);
    }
    function cSqrTo(x, r) {
      x.squareTo(r);
      this.reduce(r);
    }
    Classic.prototype.convert = cConvert;
    Classic.prototype.revert = cRevert;
    Classic.prototype.reduce = cReduce;
    Classic.prototype.mulTo = cMulTo;
    Classic.prototype.sqrTo = cSqrTo;
    function bnpInvDigit() {
      if (this.t < 1)
        return 0;
      var x = this[0];
      if ((x & 1) == 0)
        return 0;
      var y = x & 3;
      y = y * (2 - (x & 15) * y) & 15;
      y = y * (2 - (x & 255) * y) & 255;
      y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
      y = y * (2 - x * y % this.DV) % this.DV;
      return y > 0 ? this.DV - y : -y;
    }
    function Montgomery(m) {
      this.m = m;
      this.mp = m.invDigit();
      this.mpl = this.mp & 32767;
      this.mph = this.mp >> 15;
      this.um = (1 << m.DB - 15) - 1;
      this.mt2 = 2 * m.t;
    }
    function montConvert(x) {
      var r = nbi();
      x.abs().dlShiftTo(this.m.t, r);
      r.divRemTo(this.m, null, r);
      if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0)
        this.m.subTo(r, r);
      return r;
    }
    function montRevert(x) {
      var r = nbi();
      x.copyTo(r);
      this.reduce(r);
      return r;
    }
    function montReduce(x) {
      while (x.t <= this.mt2)
        x[x.t++] = 0;
      for (var i = 0; i < this.m.t; ++i) {
        var j = x[i] & 32767;
        var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
        j = i + this.m.t;
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
        while (x[j] >= x.DV) {
          x[j] -= x.DV;
          x[++j]++;
        }
      }
      x.clamp();
      x.drShiftTo(this.m.t, x);
      if (x.compareTo(this.m) >= 0)
        x.subTo(this.m, x);
    }
    function montSqrTo(x, r) {
      x.squareTo(r);
      this.reduce(r);
    }
    function montMulTo(x, y, r) {
      x.multiplyTo(y, r);
      this.reduce(r);
    }
    Montgomery.prototype.convert = montConvert;
    Montgomery.prototype.revert = montRevert;
    Montgomery.prototype.reduce = montReduce;
    Montgomery.prototype.mulTo = montMulTo;
    Montgomery.prototype.sqrTo = montSqrTo;
    function bnpIsEven() {
      return (this.t > 0 ? this[0] & 1 : this.s) == 0;
    }
    function bnpExp(e, z) {
      if (e > 4294967295 || e < 1)
        return BigInteger.ONE;
      var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
      g.copyTo(r);
      while (--i >= 0) {
        z.sqrTo(r, r2);
        if ((e & 1 << i) > 0)
          z.mulTo(r2, g, r);
        else {
          var t = r;
          r = r2;
          r2 = t;
        }
      }
      return z.revert(r);
    }
    function bnModPowInt(e, m) {
      var z;
      if (e < 256 || m.isEven())
        z = new Classic(m);
      else
        z = new Montgomery(m);
      return this.exp(e, z);
    }
    BigInteger.prototype.copyTo = bnpCopyTo;
    BigInteger.prototype.fromInt = bnpFromInt;
    BigInteger.prototype.fromString = bnpFromString;
    BigInteger.prototype.clamp = bnpClamp;
    BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
    BigInteger.prototype.drShiftTo = bnpDRShiftTo;
    BigInteger.prototype.lShiftTo = bnpLShiftTo;
    BigInteger.prototype.rShiftTo = bnpRShiftTo;
    BigInteger.prototype.subTo = bnpSubTo;
    BigInteger.prototype.multiplyTo = bnpMultiplyTo;
    BigInteger.prototype.squareTo = bnpSquareTo;
    BigInteger.prototype.divRemTo = bnpDivRemTo;
    BigInteger.prototype.invDigit = bnpInvDigit;
    BigInteger.prototype.isEven = bnpIsEven;
    BigInteger.prototype.exp = bnpExp;
    BigInteger.prototype.toString = bnToString;
    BigInteger.prototype.negate = bnNegate;
    BigInteger.prototype.abs = bnAbs;
    BigInteger.prototype.compareTo = bnCompareTo;
    BigInteger.prototype.bitLength = bnBitLength;
    BigInteger.prototype.mod = bnMod;
    BigInteger.prototype.modPowInt = bnModPowInt;
    BigInteger.ZERO = nbv(0);
    BigInteger.ONE = nbv(1);
    function bnClone() {
      var r = nbi();
      this.copyTo(r);
      return r;
    }
    function bnIntValue() {
      if (this.s < 0) {
        if (this.t == 1)
          return this[0] - this.DV;
        else if (this.t == 0)
          return -1;
      } else if (this.t == 1)
        return this[0];
      else if (this.t == 0)
        return 0;
      return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
    }
    function bnByteValue() {
      return this.t == 0 ? this.s : this[0] << 24 >> 24;
    }
    function bnShortValue() {
      return this.t == 0 ? this.s : this[0] << 16 >> 16;
    }
    function bnpChunkSize(r) {
      return Math.floor(Math.LN2 * this.DB / Math.log(r));
    }
    function bnSigNum() {
      if (this.s < 0)
        return -1;
      else if (this.t <= 0 || this.t == 1 && this[0] <= 0)
        return 0;
      else
        return 1;
    }
    function bnpToRadix(b) {
      if (b == null)
        b = 10;
      if (this.signum() == 0 || b < 2 || b > 36)
        return "0";
      var cs = this.chunkSize(b);
      var a = Math.pow(b, cs);
      var d = nbv(a), y = nbi(), z = nbi(), r = "";
      this.divRemTo(d, y, z);
      while (y.signum() > 0) {
        r = (a + z.intValue()).toString(b).substr(1) + r;
        y.divRemTo(d, y, z);
      }
      return z.intValue().toString(b) + r;
    }
    function bnpFromRadix(s, b) {
      this.fromInt(0);
      if (b == null)
        b = 10;
      var cs = this.chunkSize(b);
      var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
      for (var i = 0; i < s.length; ++i) {
        var x = intAt(s, i);
        if (x < 0) {
          if (s.charAt(i) == "-" && this.signum() == 0)
            mi = true;
          continue;
        }
        w = b * w + x;
        if (++j >= cs) {
          this.dMultiply(d);
          this.dAddOffset(w, 0);
          j = 0;
          w = 0;
        }
      }
      if (j > 0) {
        this.dMultiply(Math.pow(b, j));
        this.dAddOffset(w, 0);
      }
      if (mi)
        BigInteger.ZERO.subTo(this, this);
    }
    function bnpFromNumber(a, b, c) {
      if (typeof b == "number") {
        if (a < 2)
          this.fromInt(1);
        else {
          this.fromNumber(a, c);
          if (!this.testBit(a - 1))
            this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
          if (this.isEven())
            this.dAddOffset(1, 0);
          while (!this.isProbablePrime(b)) {
            this.dAddOffset(2, 0);
            if (this.bitLength() > a)
              this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
          }
        }
      } else {
        var x = new Array(), t = a & 7;
        x.length = (a >> 3) + 1;
        b.nextBytes(x);
        if (t > 0)
          x[0] &= (1 << t) - 1;
        else
          x[0] = 0;
        this.fromString(x, 256);
      }
    }
    function bnToByteArray() {
      var i = this.t, r = new Array();
      r[0] = this.s;
      var p = this.DB - i * this.DB % 8, d, k = 0;
      if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
          r[k++] = d | this.s << this.DB - p;
        while (i >= 0) {
          if (p < 8) {
            d = (this[i] & (1 << p) - 1) << 8 - p;
            d |= this[--i] >> (p += this.DB - 8);
          } else {
            d = this[i] >> (p -= 8) & 255;
            if (p <= 0) {
              p += this.DB;
              --i;
            }
          }
          if ((d & 128) != 0)
            d |= -256;
          if (k == 0 && (this.s & 128) != (d & 128))
            ++k;
          if (k > 0 || d != this.s)
            r[k++] = d;
        }
      }
      return r;
    }
    function bnEquals(a) {
      return this.compareTo(a) == 0;
    }
    function bnMin(a) {
      return this.compareTo(a) < 0 ? this : a;
    }
    function bnMax(a) {
      return this.compareTo(a) > 0 ? this : a;
    }
    function bnpBitwiseTo(a, op, r) {
      var i, f, m = Math.min(a.t, this.t);
      for (i = 0; i < m; ++i)
        r[i] = op(this[i], a[i]);
      if (a.t < this.t) {
        f = a.s & this.DM;
        for (i = m; i < this.t; ++i)
          r[i] = op(this[i], f);
        r.t = this.t;
      } else {
        f = this.s & this.DM;
        for (i = m; i < a.t; ++i)
          r[i] = op(f, a[i]);
        r.t = a.t;
      }
      r.s = op(this.s, a.s);
      r.clamp();
    }
    function op_and(x, y) {
      return x & y;
    }
    function bnAnd(a) {
      var r = nbi();
      this.bitwiseTo(a, op_and, r);
      return r;
    }
    function op_or(x, y) {
      return x | y;
    }
    function bnOr(a) {
      var r = nbi();
      this.bitwiseTo(a, op_or, r);
      return r;
    }
    function op_xor(x, y) {
      return x ^ y;
    }
    function bnXor(a) {
      var r = nbi();
      this.bitwiseTo(a, op_xor, r);
      return r;
    }
    function op_andnot(x, y) {
      return x & ~y;
    }
    function bnAndNot(a) {
      var r = nbi();
      this.bitwiseTo(a, op_andnot, r);
      return r;
    }
    function bnNot() {
      var r = nbi();
      for (var i = 0; i < this.t; ++i)
        r[i] = this.DM & ~this[i];
      r.t = this.t;
      r.s = ~this.s;
      return r;
    }
    function bnShiftLeft(n) {
      var r = nbi();
      if (n < 0)
        this.rShiftTo(-n, r);
      else
        this.lShiftTo(n, r);
      return r;
    }
    function bnShiftRight(n) {
      var r = nbi();
      if (n < 0)
        this.lShiftTo(-n, r);
      else
        this.rShiftTo(n, r);
      return r;
    }
    function lbit(x) {
      if (x == 0)
        return -1;
      var r = 0;
      if ((x & 65535) == 0) {
        x >>= 16;
        r += 16;
      }
      if ((x & 255) == 0) {
        x >>= 8;
        r += 8;
      }
      if ((x & 15) == 0) {
        x >>= 4;
        r += 4;
      }
      if ((x & 3) == 0) {
        x >>= 2;
        r += 2;
      }
      if ((x & 1) == 0)
        ++r;
      return r;
    }
    function bnGetLowestSetBit() {
      for (var i = 0; i < this.t; ++i)
        if (this[i] != 0)
          return i * this.DB + lbit(this[i]);
      if (this.s < 0)
        return this.t * this.DB;
      return -1;
    }
    function cbit(x) {
      var r = 0;
      while (x != 0) {
        x &= x - 1;
        ++r;
      }
      return r;
    }
    function bnBitCount() {
      var r = 0, x = this.s & this.DM;
      for (var i = 0; i < this.t; ++i)
        r += cbit(this[i] ^ x);
      return r;
    }
    function bnTestBit(n) {
      var j = Math.floor(n / this.DB);
      if (j >= this.t)
        return this.s != 0;
      return (this[j] & 1 << n % this.DB) != 0;
    }
    function bnpChangeBit(n, op) {
      var r = BigInteger.ONE.shiftLeft(n);
      this.bitwiseTo(r, op, r);
      return r;
    }
    function bnSetBit(n) {
      return this.changeBit(n, op_or);
    }
    function bnClearBit(n) {
      return this.changeBit(n, op_andnot);
    }
    function bnFlipBit(n) {
      return this.changeBit(n, op_xor);
    }
    function bnpAddTo(a, r) {
      var i = 0, c = 0, m = Math.min(a.t, this.t);
      while (i < m) {
        c += this[i] + a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      if (a.t < this.t) {
        c += a.s;
        while (i < this.t) {
          c += this[i];
          r[i++] = c & this.DM;
          c >>= this.DB;
        }
        c += this.s;
      } else {
        c += this.s;
        while (i < a.t) {
          c += a[i];
          r[i++] = c & this.DM;
          c >>= this.DB;
        }
        c += a.s;
      }
      r.s = c < 0 ? -1 : 0;
      if (c > 0)
        r[i++] = c;
      else if (c < -1)
        r[i++] = this.DV + c;
      r.t = i;
      r.clamp();
    }
    function bnAdd(a) {
      var r = nbi();
      this.addTo(a, r);
      return r;
    }
    function bnSubtract(a) {
      var r = nbi();
      this.subTo(a, r);
      return r;
    }
    function bnMultiply(a) {
      var r = nbi();
      this.multiplyTo(a, r);
      return r;
    }
    function bnSquare() {
      var r = nbi();
      this.squareTo(r);
      return r;
    }
    function bnDivide(a) {
      var r = nbi();
      this.divRemTo(a, r, null);
      return r;
    }
    function bnRemainder(a) {
      var r = nbi();
      this.divRemTo(a, null, r);
      return r;
    }
    function bnDivideAndRemainder(a) {
      var q = nbi(), r = nbi();
      this.divRemTo(a, q, r);
      return new Array(q, r);
    }
    function bnpDMultiply(n) {
      this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
      ++this.t;
      this.clamp();
    }
    function bnpDAddOffset(n, w) {
      if (n == 0)
        return;
      while (this.t <= w)
        this[this.t++] = 0;
      this[w] += n;
      while (this[w] >= this.DV) {
        this[w] -= this.DV;
        if (++w >= this.t)
          this[this.t++] = 0;
        ++this[w];
      }
    }
    function NullExp() {
    }
    function nNop(x) {
      return x;
    }
    function nMulTo(x, y, r) {
      x.multiplyTo(y, r);
    }
    function nSqrTo(x, r) {
      x.squareTo(r);
    }
    NullExp.prototype.convert = nNop;
    NullExp.prototype.revert = nNop;
    NullExp.prototype.mulTo = nMulTo;
    NullExp.prototype.sqrTo = nSqrTo;
    function bnPow(e) {
      return this.exp(e, new NullExp());
    }
    function bnpMultiplyLowerTo(a, n, r) {
      var i = Math.min(this.t + a.t, n);
      r.s = 0;
      r.t = i;
      while (i > 0)
        r[--i] = 0;
      var j;
      for (j = r.t - this.t; i < j; ++i)
        r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
      for (j = Math.min(a.t, n); i < j; ++i)
        this.am(0, a[i], r, i, 0, n - i);
      r.clamp();
    }
    function bnpMultiplyUpperTo(a, n, r) {
      --n;
      var i = r.t = this.t + a.t - n;
      r.s = 0;
      while (--i >= 0)
        r[i] = 0;
      for (i = Math.max(n - this.t, 0); i < a.t; ++i)
        r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
      r.clamp();
      r.drShiftTo(1, r);
    }
    function Barrett(m) {
      this.r2 = nbi();
      this.q3 = nbi();
      BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
      this.mu = this.r2.divide(m);
      this.m = m;
    }
    function barrettConvert(x) {
      if (x.s < 0 || x.t > 2 * this.m.t)
        return x.mod(this.m);
      else if (x.compareTo(this.m) < 0)
        return x;
      else {
        var r = nbi();
        x.copyTo(r);
        this.reduce(r);
        return r;
      }
    }
    function barrettRevert(x) {
      return x;
    }
    function barrettReduce(x) {
      x.drShiftTo(this.m.t - 1, this.r2);
      if (x.t > this.m.t + 1) {
        x.t = this.m.t + 1;
        x.clamp();
      }
      this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
      this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
      while (x.compareTo(this.r2) < 0)
        x.dAddOffset(1, this.m.t + 1);
      x.subTo(this.r2, x);
      while (x.compareTo(this.m) >= 0)
        x.subTo(this.m, x);
    }
    function barrettSqrTo(x, r) {
      x.squareTo(r);
      this.reduce(r);
    }
    function barrettMulTo(x, y, r) {
      x.multiplyTo(y, r);
      this.reduce(r);
    }
    Barrett.prototype.convert = barrettConvert;
    Barrett.prototype.revert = barrettRevert;
    Barrett.prototype.reduce = barrettReduce;
    Barrett.prototype.mulTo = barrettMulTo;
    Barrett.prototype.sqrTo = barrettSqrTo;
    function bnModPow(e, m) {
      var i = e.bitLength(), k, r = nbv(1), z;
      if (i <= 0)
        return r;
      else if (i < 18)
        k = 1;
      else if (i < 48)
        k = 3;
      else if (i < 144)
        k = 4;
      else if (i < 768)
        k = 5;
      else
        k = 6;
      if (i < 8)
        z = new Classic(m);
      else if (m.isEven())
        z = new Barrett(m);
      else
        z = new Montgomery(m);
      var g = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
      g[1] = z.convert(this);
      if (k > 1) {
        var g2 = nbi();
        z.sqrTo(g[1], g2);
        while (n <= km) {
          g[n] = nbi();
          z.mulTo(g2, g[n - 2], g[n]);
          n += 2;
        }
      }
      var j = e.t - 1, w, is1 = true, r2 = nbi(), t;
      i = nbits(e[j]) - 1;
      while (j >= 0) {
        if (i >= k1)
          w = e[j] >> i - k1 & km;
        else {
          w = (e[j] & (1 << i + 1) - 1) << k1 - i;
          if (j > 0)
            w |= e[j - 1] >> this.DB + i - k1;
        }
        n = k;
        while ((w & 1) == 0) {
          w >>= 1;
          --n;
        }
        if ((i -= n) < 0) {
          i += this.DB;
          --j;
        }
        if (is1) {
          g[w].copyTo(r);
          is1 = false;
        } else {
          while (n > 1) {
            z.sqrTo(r, r2);
            z.sqrTo(r2, r);
            n -= 2;
          }
          if (n > 0)
            z.sqrTo(r, r2);
          else {
            t = r;
            r = r2;
            r2 = t;
          }
          z.mulTo(r2, g[w], r);
        }
        while (j >= 0 && (e[j] & 1 << i) == 0) {
          z.sqrTo(r, r2);
          t = r;
          r = r2;
          r2 = t;
          if (--i < 0) {
            i = this.DB - 1;
            --j;
          }
        }
      }
      return z.revert(r);
    }
    function bnGCD(a) {
      var x = this.s < 0 ? this.negate() : this.clone();
      var y = a.s < 0 ? a.negate() : a.clone();
      if (x.compareTo(y) < 0) {
        var t = x;
        x = y;
        y = t;
      }
      var i = x.getLowestSetBit(), g = y.getLowestSetBit();
      if (g < 0)
        return x;
      if (i < g)
        g = i;
      if (g > 0) {
        x.rShiftTo(g, x);
        y.rShiftTo(g, y);
      }
      while (x.signum() > 0) {
        if ((i = x.getLowestSetBit()) > 0)
          x.rShiftTo(i, x);
        if ((i = y.getLowestSetBit()) > 0)
          y.rShiftTo(i, y);
        if (x.compareTo(y) >= 0) {
          x.subTo(y, x);
          x.rShiftTo(1, x);
        } else {
          y.subTo(x, y);
          y.rShiftTo(1, y);
        }
      }
      if (g > 0)
        y.lShiftTo(g, y);
      return y;
    }
    function bnpModInt(n) {
      if (n <= 0)
        return 0;
      var d = this.DV % n, r = this.s < 0 ? n - 1 : 0;
      if (this.t > 0)
        if (d == 0)
          r = this[0] % n;
        else
          for (var i = this.t - 1; i >= 0; --i)
            r = (d * r + this[i]) % n;
      return r;
    }
    function bnModInverse(m) {
      var ac = m.isEven();
      if (this.isEven() && ac || m.signum() == 0)
        return BigInteger.ZERO;
      var u = m.clone(), v = this.clone();
      var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
      while (u.signum() != 0) {
        while (u.isEven()) {
          u.rShiftTo(1, u);
          if (ac) {
            if (!a.isEven() || !b.isEven()) {
              a.addTo(this, a);
              b.subTo(m, b);
            }
            a.rShiftTo(1, a);
          } else if (!b.isEven())
            b.subTo(m, b);
          b.rShiftTo(1, b);
        }
        while (v.isEven()) {
          v.rShiftTo(1, v);
          if (ac) {
            if (!c.isEven() || !d.isEven()) {
              c.addTo(this, c);
              d.subTo(m, d);
            }
            c.rShiftTo(1, c);
          } else if (!d.isEven())
            d.subTo(m, d);
          d.rShiftTo(1, d);
        }
        if (u.compareTo(v) >= 0) {
          u.subTo(v, u);
          if (ac)
            a.subTo(c, a);
          b.subTo(d, b);
        } else {
          v.subTo(u, v);
          if (ac)
            c.subTo(a, c);
          d.subTo(b, d);
        }
      }
      if (v.compareTo(BigInteger.ONE) != 0)
        return BigInteger.ZERO;
      if (d.compareTo(m) >= 0)
        return d.subtract(m);
      if (d.signum() < 0)
        d.addTo(m, d);
      else
        return d;
      if (d.signum() < 0)
        return d.add(m);
      else
        return d;
    }
    var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
    var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
    function bnIsProbablePrime(t) {
      var i, x = this.abs();
      if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
        for (i = 0; i < lowprimes.length; ++i)
          if (x[0] == lowprimes[i])
            return true;
        return false;
      }
      if (x.isEven())
        return false;
      i = 1;
      while (i < lowprimes.length) {
        var m = lowprimes[i], j = i + 1;
        while (j < lowprimes.length && m < lplim)
          m *= lowprimes[j++];
        m = x.modInt(m);
        while (i < j)
          if (m % lowprimes[i++] == 0)
            return false;
      }
      return x.millerRabin(t);
    }
    function bnpMillerRabin(t) {
      var n1 = this.subtract(BigInteger.ONE);
      var k = n1.getLowestSetBit();
      if (k <= 0)
        return false;
      var r = n1.shiftRight(k);
      t = t + 1 >> 1;
      if (t > lowprimes.length)
        t = lowprimes.length;
      var a = nbi();
      for (var i = 0; i < t; ++i) {
        a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
        var y = a.modPow(r, this);
        if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
          var j = 1;
          while (j++ < k && y.compareTo(n1) != 0) {
            y = y.modPowInt(2, this);
            if (y.compareTo(BigInteger.ONE) == 0)
              return false;
          }
          if (y.compareTo(n1) != 0)
            return false;
        }
      }
      return true;
    }
    BigInteger.prototype.chunkSize = bnpChunkSize;
    BigInteger.prototype.toRadix = bnpToRadix;
    BigInteger.prototype.fromRadix = bnpFromRadix;
    BigInteger.prototype.fromNumber = bnpFromNumber;
    BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
    BigInteger.prototype.changeBit = bnpChangeBit;
    BigInteger.prototype.addTo = bnpAddTo;
    BigInteger.prototype.dMultiply = bnpDMultiply;
    BigInteger.prototype.dAddOffset = bnpDAddOffset;
    BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
    BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
    BigInteger.prototype.modInt = bnpModInt;
    BigInteger.prototype.millerRabin = bnpMillerRabin;
    BigInteger.prototype.clone = bnClone;
    BigInteger.prototype.intValue = bnIntValue;
    BigInteger.prototype.byteValue = bnByteValue;
    BigInteger.prototype.shortValue = bnShortValue;
    BigInteger.prototype.signum = bnSigNum;
    BigInteger.prototype.toByteArray = bnToByteArray;
    BigInteger.prototype.equals = bnEquals;
    BigInteger.prototype.min = bnMin;
    BigInteger.prototype.max = bnMax;
    BigInteger.prototype.and = bnAnd;
    BigInteger.prototype.or = bnOr;
    BigInteger.prototype.xor = bnXor;
    BigInteger.prototype.andNot = bnAndNot;
    BigInteger.prototype.not = bnNot;
    BigInteger.prototype.shiftLeft = bnShiftLeft;
    BigInteger.prototype.shiftRight = bnShiftRight;
    BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
    BigInteger.prototype.bitCount = bnBitCount;
    BigInteger.prototype.testBit = bnTestBit;
    BigInteger.prototype.setBit = bnSetBit;
    BigInteger.prototype.clearBit = bnClearBit;
    BigInteger.prototype.flipBit = bnFlipBit;
    BigInteger.prototype.add = bnAdd;
    BigInteger.prototype.subtract = bnSubtract;
    BigInteger.prototype.multiply = bnMultiply;
    BigInteger.prototype.divide = bnDivide;
    BigInteger.prototype.remainder = bnRemainder;
    BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
    BigInteger.prototype.modPow = bnModPow;
    BigInteger.prototype.modInverse = bnModInverse;
    BigInteger.prototype.pow = bnPow;
    BigInteger.prototype.gcd = bnGCD;
    BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
    BigInteger.prototype.square = bnSquare;
    var Int128 = BigInteger;
    Int128.prototype.IsNegative = function() {
      if (this.compareTo(Int128.ZERO) == -1)
        return true;
      else
        return false;
    };
    Int128.op_Equality = function(val1, val2) {
      if (val1.compareTo(val2) == 0)
        return true;
      else
        return false;
    };
    Int128.op_Inequality = function(val1, val2) {
      if (val1.compareTo(val2) != 0)
        return true;
      else
        return false;
    };
    Int128.op_GreaterThan = function(val1, val2) {
      if (val1.compareTo(val2) > 0)
        return true;
      else
        return false;
    };
    Int128.op_LessThan = function(val1, val2) {
      if (val1.compareTo(val2) < 0)
        return true;
      else
        return false;
    };
    Int128.op_Addition = function(lhs, rhs) {
      return new Int128(lhs, void 0, void 0).add(new Int128(rhs, void 0, void 0));
    };
    Int128.op_Subtraction = function(lhs, rhs) {
      return new Int128(lhs, void 0, void 0).subtract(new Int128(rhs, void 0, void 0));
    };
    Int128.Int128Mul = function(lhs, rhs) {
      return new Int128(lhs, void 0, void 0).multiply(new Int128(rhs, void 0, void 0));
    };
    Int128.op_Division = function(lhs, rhs) {
      return lhs.divide(rhs);
    };
    Int128.prototype.ToDouble = function() {
      return parseFloat(this.toString());
    };
    var Inherit = function(ce, ce2) {
      var p;
      if (typeof Object.getOwnPropertyNames === "undefined") {
        for (p in ce2.prototype)
          if (typeof ce.prototype[p] === "undefined" || ce.prototype[p] === Object.prototype[p])
            ce.prototype[p] = ce2.prototype[p];
        for (p in ce2)
          if (typeof ce[p] === "undefined")
            ce[p] = ce2[p];
        ce.$baseCtor = ce2;
      } else {
        var props = Object.getOwnPropertyNames(ce2.prototype);
        for (var i = 0; i < props.length; i++)
          if (typeof Object.getOwnPropertyDescriptor(ce.prototype, props[i]) === "undefined")
            Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
        for (p in ce2)
          if (typeof ce[p] === "undefined")
            ce[p] = ce2[p];
        ce.$baseCtor = ce2;
      }
    };
    ClipperLib.Path = function() {
      return [];
    };
    ClipperLib.Path.prototype.push = Array.prototype.push;
    ClipperLib.Paths = function() {
      return [];
    };
    ClipperLib.Paths.prototype.push = Array.prototype.push;
    ClipperLib.DoublePoint = function() {
      var a = arguments;
      this.X = 0;
      this.Y = 0;
      if (a.length === 1) {
        this.X = a[0].X;
        this.Y = a[0].Y;
      } else if (a.length === 2) {
        this.X = a[0];
        this.Y = a[1];
      }
    };
    ClipperLib.DoublePoint0 = function() {
      this.X = 0;
      this.Y = 0;
    };
    ClipperLib.DoublePoint0.prototype = ClipperLib.DoublePoint.prototype;
    ClipperLib.DoublePoint1 = function(dp) {
      this.X = dp.X;
      this.Y = dp.Y;
    };
    ClipperLib.DoublePoint1.prototype = ClipperLib.DoublePoint.prototype;
    ClipperLib.DoublePoint2 = function(x, y) {
      this.X = x;
      this.Y = y;
    };
    ClipperLib.DoublePoint2.prototype = ClipperLib.DoublePoint.prototype;
    ClipperLib.PolyNode = function() {
      this.m_Parent = null;
      this.m_polygon = new ClipperLib.Path();
      this.m_Index = 0;
      this.m_jointype = 0;
      this.m_endtype = 0;
      this.m_Childs = [];
      this.IsOpen = false;
    };
    ClipperLib.PolyNode.prototype.IsHoleNode = function() {
      var result = true;
      var node = this.m_Parent;
      while (node !== null) {
        result = !result;
        node = node.m_Parent;
      }
      return result;
    };
    ClipperLib.PolyNode.prototype.ChildCount = function() {
      return this.m_Childs.length;
    };
    ClipperLib.PolyNode.prototype.Contour = function() {
      return this.m_polygon;
    };
    ClipperLib.PolyNode.prototype.AddChild = function(Child) {
      var cnt = this.m_Childs.length;
      this.m_Childs.push(Child);
      Child.m_Parent = this;
      Child.m_Index = cnt;
    };
    ClipperLib.PolyNode.prototype.GetNext = function() {
      if (this.m_Childs.length > 0)
        return this.m_Childs[0];
      else
        return this.GetNextSiblingUp();
    };
    ClipperLib.PolyNode.prototype.GetNextSiblingUp = function() {
      if (this.m_Parent === null)
        return null;
      else if (this.m_Index === this.m_Parent.m_Childs.length - 1)
        return this.m_Parent.GetNextSiblingUp();
      else
        return this.m_Parent.m_Childs[this.m_Index + 1];
    };
    ClipperLib.PolyNode.prototype.Childs = function() {
      return this.m_Childs;
    };
    ClipperLib.PolyNode.prototype.Parent = function() {
      return this.m_Parent;
    };
    ClipperLib.PolyNode.prototype.IsHole = function() {
      return this.IsHoleNode();
    };
    ClipperLib.PolyTree = function() {
      this.m_AllPolys = [];
      ClipperLib.PolyNode.call(this);
    };
    ClipperLib.PolyTree.prototype.Clear = function() {
      for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++)
        this.m_AllPolys[i] = null;
      this.m_AllPolys.length = 0;
      this.m_Childs.length = 0;
    };
    ClipperLib.PolyTree.prototype.GetFirst = function() {
      if (this.m_Childs.length > 0)
        return this.m_Childs[0];
      else
        return null;
    };
    ClipperLib.PolyTree.prototype.Total = function() {
      var result = this.m_AllPolys.length;
      if (result > 0 && this.m_Childs[0] !== this.m_AllPolys[0])
        result--;
      return result;
    };
    Inherit(ClipperLib.PolyTree, ClipperLib.PolyNode);
    ClipperLib.Math_Abs_Int64 = ClipperLib.Math_Abs_Int32 = ClipperLib.Math_Abs_Double = function(a) {
      return Math.abs(a);
    };
    ClipperLib.Math_Max_Int32_Int32 = function(a, b) {
      return Math.max(a, b);
    };
    if (browser.msie || browser.opera || browser.safari)
      ClipperLib.Cast_Int32 = function(a) {
        return a | 0;
      };
    else
      ClipperLib.Cast_Int32 = function(a) {
        return ~~a;
      };
    if (typeof Number.toInteger === "undefined")
      Number.toInteger = null;
    if (browser.chrome)
      ClipperLib.Cast_Int64 = function(a) {
        if (a < -2147483648 || a > 2147483647)
          return a < 0 ? Math.ceil(a) : Math.floor(a);
        else
          return ~~a;
      };
    else if (browser.firefox && typeof Number.toInteger === "function")
      ClipperLib.Cast_Int64 = function(a) {
        return Number.toInteger(a);
      };
    else if (browser.msie7 || browser.msie8)
      ClipperLib.Cast_Int64 = function(a) {
        return parseInt(a, 10);
      };
    else if (browser.msie)
      ClipperLib.Cast_Int64 = function(a) {
        if (a < -2147483648 || a > 2147483647)
          return a < 0 ? Math.ceil(a) : Math.floor(a);
        return a | 0;
      };
    else
      ClipperLib.Cast_Int64 = function(a) {
        return a < 0 ? Math.ceil(a) : Math.floor(a);
      };
    ClipperLib.Clear = function(a) {
      a.length = 0;
    };
    ClipperLib.PI = 3.141592653589793;
    ClipperLib.PI2 = 2 * 3.141592653589793;
    ClipperLib.IntPoint = function() {
      var a = arguments, alen = a.length;
      this.X = 0;
      this.Y = 0;
      if (ClipperLib.use_xyz) {
        this.Z = 0;
        if (alen === 3) {
          this.X = a[0];
          this.Y = a[1];
          this.Z = a[2];
        } else if (alen === 2) {
          this.X = a[0];
          this.Y = a[1];
          this.Z = 0;
        } else if (alen === 1) {
          if (a[0] instanceof ClipperLib.DoublePoint) {
            var dp = a[0];
            this.X = ClipperLib.Clipper.Round(dp.X);
            this.Y = ClipperLib.Clipper.Round(dp.Y);
            this.Z = 0;
          } else {
            var pt = a[0];
            if (typeof pt.Z === "undefined")
              pt.Z = 0;
            this.X = pt.X;
            this.Y = pt.Y;
            this.Z = pt.Z;
          }
        } else {
          this.X = 0;
          this.Y = 0;
          this.Z = 0;
        }
      } else {
        if (alen === 2) {
          this.X = a[0];
          this.Y = a[1];
        } else if (alen === 1) {
          if (a[0] instanceof ClipperLib.DoublePoint) {
            var dp = a[0];
            this.X = ClipperLib.Clipper.Round(dp.X);
            this.Y = ClipperLib.Clipper.Round(dp.Y);
          } else {
            var pt = a[0];
            this.X = pt.X;
            this.Y = pt.Y;
          }
        } else {
          this.X = 0;
          this.Y = 0;
        }
      }
    };
    ClipperLib.IntPoint.op_Equality = function(a, b) {
      return a.X === b.X && a.Y === b.Y;
    };
    ClipperLib.IntPoint.op_Inequality = function(a, b) {
      return a.X !== b.X || a.Y !== b.Y;
    };
    ClipperLib.IntPoint0 = function() {
      this.X = 0;
      this.Y = 0;
      if (ClipperLib.use_xyz)
        this.Z = 0;
    };
    ClipperLib.IntPoint0.prototype = ClipperLib.IntPoint.prototype;
    ClipperLib.IntPoint1 = function(pt) {
      this.X = pt.X;
      this.Y = pt.Y;
      if (ClipperLib.use_xyz) {
        if (typeof pt.Z === "undefined")
          this.Z = 0;
        else
          this.Z = pt.Z;
      }
    };
    ClipperLib.IntPoint1.prototype = ClipperLib.IntPoint.prototype;
    ClipperLib.IntPoint1dp = function(dp) {
      this.X = ClipperLib.Clipper.Round(dp.X);
      this.Y = ClipperLib.Clipper.Round(dp.Y);
      if (ClipperLib.use_xyz)
        this.Z = 0;
    };
    ClipperLib.IntPoint1dp.prototype = ClipperLib.IntPoint.prototype;
    ClipperLib.IntPoint2 = function(x, y, z) {
      this.X = x;
      this.Y = y;
      if (ClipperLib.use_xyz) {
        if (typeof z === "undefined")
          this.Z = 0;
        else
          this.Z = z;
      }
    };
    ClipperLib.IntPoint2.prototype = ClipperLib.IntPoint.prototype;
    ClipperLib.IntRect = function() {
      var a = arguments, alen = a.length;
      if (alen === 4) {
        this.left = a[0];
        this.top = a[1];
        this.right = a[2];
        this.bottom = a[3];
      } else if (alen === 1) {
        var ir = a[0];
        this.left = ir.left;
        this.top = ir.top;
        this.right = ir.right;
        this.bottom = ir.bottom;
      } else {
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
      }
    };
    ClipperLib.IntRect0 = function() {
      this.left = 0;
      this.top = 0;
      this.right = 0;
      this.bottom = 0;
    };
    ClipperLib.IntRect0.prototype = ClipperLib.IntRect.prototype;
    ClipperLib.IntRect1 = function(ir) {
      this.left = ir.left;
      this.top = ir.top;
      this.right = ir.right;
      this.bottom = ir.bottom;
    };
    ClipperLib.IntRect1.prototype = ClipperLib.IntRect.prototype;
    ClipperLib.IntRect4 = function(l, t, r, b) {
      this.left = l;
      this.top = t;
      this.right = r;
      this.bottom = b;
    };
    ClipperLib.IntRect4.prototype = ClipperLib.IntRect.prototype;
    ClipperLib.ClipType = {
      ctIntersection: 0,
      ctUnion: 1,
      ctDifference: 2,
      ctXor: 3
    };
    ClipperLib.PolyType = {
      ptSubject: 0,
      ptClip: 1
    };
    ClipperLib.PolyFillType = {
      pftEvenOdd: 0,
      pftNonZero: 1,
      pftPositive: 2,
      pftNegative: 3
    };
    ClipperLib.JoinType = {
      jtSquare: 0,
      jtRound: 1,
      jtMiter: 2
    };
    ClipperLib.EndType = {
      etOpenSquare: 0,
      etOpenRound: 1,
      etOpenButt: 2,
      etClosedLine: 3,
      etClosedPolygon: 4
    };
    ClipperLib.EdgeSide = {
      esLeft: 0,
      esRight: 1
    };
    ClipperLib.Direction = {
      dRightToLeft: 0,
      dLeftToRight: 1
    };
    ClipperLib.TEdge = function() {
      this.Bot = new ClipperLib.IntPoint0();
      this.Curr = new ClipperLib.IntPoint0();
      this.Top = new ClipperLib.IntPoint0();
      this.Delta = new ClipperLib.IntPoint0();
      this.Dx = 0;
      this.PolyTyp = ClipperLib.PolyType.ptSubject;
      this.Side = ClipperLib.EdgeSide.esLeft;
      this.WindDelta = 0;
      this.WindCnt = 0;
      this.WindCnt2 = 0;
      this.OutIdx = 0;
      this.Next = null;
      this.Prev = null;
      this.NextInLML = null;
      this.NextInAEL = null;
      this.PrevInAEL = null;
      this.NextInSEL = null;
      this.PrevInSEL = null;
    };
    ClipperLib.IntersectNode = function() {
      this.Edge1 = null;
      this.Edge2 = null;
      this.Pt = new ClipperLib.IntPoint0();
    };
    ClipperLib.MyIntersectNodeSort = function() {
    };
    ClipperLib.MyIntersectNodeSort.Compare = function(node1, node2) {
      var i = node2.Pt.Y - node1.Pt.Y;
      if (i > 0)
        return 1;
      else if (i < 0)
        return -1;
      else
        return 0;
    };
    ClipperLib.LocalMinima = function() {
      this.Y = 0;
      this.LeftBound = null;
      this.RightBound = null;
      this.Next = null;
    };
    ClipperLib.Scanbeam = function() {
      this.Y = 0;
      this.Next = null;
    };
    ClipperLib.Maxima = function() {
      this.X = 0;
      this.Next = null;
      this.Prev = null;
    };
    ClipperLib.OutRec = function() {
      this.Idx = 0;
      this.IsHole = false;
      this.IsOpen = false;
      this.FirstLeft = null;
      this.Pts = null;
      this.BottomPt = null;
      this.PolyNode = null;
    };
    ClipperLib.OutPt = function() {
      this.Idx = 0;
      this.Pt = new ClipperLib.IntPoint0();
      this.Next = null;
      this.Prev = null;
    };
    ClipperLib.Join = function() {
      this.OutPt1 = null;
      this.OutPt2 = null;
      this.OffPt = new ClipperLib.IntPoint0();
    };
    ClipperLib.ClipperBase = function() {
      this.m_MinimaList = null;
      this.m_CurrentLM = null;
      this.m_edges = new Array();
      this.m_UseFullRange = false;
      this.m_HasOpenPaths = false;
      this.PreserveCollinear = false;
      this.m_Scanbeam = null;
      this.m_PolyOuts = null;
      this.m_ActiveEdges = null;
    };
    ClipperLib.ClipperBase.horizontal = -9007199254740992;
    ClipperLib.ClipperBase.Skip = -2;
    ClipperLib.ClipperBase.Unassigned = -1;
    ClipperLib.ClipperBase.tolerance = 1e-20;
    ClipperLib.ClipperBase.loRange = 47453132;
    ClipperLib.ClipperBase.hiRange = 4503599627370495;
    ClipperLib.ClipperBase.near_zero = function(val) {
      return val > -ClipperLib.ClipperBase.tolerance && val < ClipperLib.ClipperBase.tolerance;
    };
    ClipperLib.ClipperBase.IsHorizontal = function(e) {
      return e.Delta.Y === 0;
    };
    ClipperLib.ClipperBase.prototype.PointIsVertex = function(pt, pp) {
      var pp2 = pp;
      do {
        if (ClipperLib.IntPoint.op_Equality(pp2.Pt, pt))
          return true;
        pp2 = pp2.Next;
      } while (pp2 !== pp);
      return false;
    };
    ClipperLib.ClipperBase.prototype.PointOnLineSegment = function(pt, linePt1, linePt2, UseFullRange) {
      if (UseFullRange)
        return pt.X === linePt1.X && pt.Y === linePt1.Y || pt.X === linePt2.X && pt.Y === linePt2.Y || pt.X > linePt1.X === pt.X < linePt2.X && pt.Y > linePt1.Y === pt.Y < linePt2.Y && Int128.op_Equality(Int128.Int128Mul(pt.X - linePt1.X, linePt2.Y - linePt1.Y), Int128.Int128Mul(linePt2.X - linePt1.X, pt.Y - linePt1.Y));
      else
        return pt.X === linePt1.X && pt.Y === linePt1.Y || pt.X === linePt2.X && pt.Y === linePt2.Y || pt.X > linePt1.X === pt.X < linePt2.X && pt.Y > linePt1.Y === pt.Y < linePt2.Y && (pt.X - linePt1.X) * (linePt2.Y - linePt1.Y) === (linePt2.X - linePt1.X) * (pt.Y - linePt1.Y);
    };
    ClipperLib.ClipperBase.prototype.PointOnPolygon = function(pt, pp, UseFullRange) {
      var pp2 = pp;
      while (true) {
        if (this.PointOnLineSegment(pt, pp2.Pt, pp2.Next.Pt, UseFullRange))
          return true;
        pp2 = pp2.Next;
        if (pp2 === pp)
          break;
      }
      return false;
    };
    ClipperLib.ClipperBase.prototype.SlopesEqual = ClipperLib.ClipperBase.SlopesEqual = function() {
      var a = arguments, alen = a.length;
      var e1, e2, pt1, pt2, pt3, pt4, UseFullRange;
      if (alen === 3) {
        e1 = a[0];
        e2 = a[1];
        UseFullRange = a[2];
        if (UseFullRange)
          return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
        else
          return ClipperLib.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib.Cast_Int64(e1.Delta.X * e2.Delta.Y);
      } else if (alen === 4) {
        pt1 = a[0];
        pt2 = a[1];
        pt3 = a[2];
        UseFullRange = a[3];
        if (UseFullRange)
          return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
        else
          return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
      } else {
        pt1 = a[0];
        pt2 = a[1];
        pt3 = a[2];
        pt4 = a[3];
        UseFullRange = a[4];
        if (UseFullRange)
          return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
        else
          return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
      }
    };
    ClipperLib.ClipperBase.SlopesEqual3 = function(e1, e2, UseFullRange) {
      if (UseFullRange)
        return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
      else
        return ClipperLib.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib.Cast_Int64(e1.Delta.X * e2.Delta.Y);
    };
    ClipperLib.ClipperBase.SlopesEqual4 = function(pt1, pt2, pt3, UseFullRange) {
      if (UseFullRange)
        return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
      else
        return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
    };
    ClipperLib.ClipperBase.SlopesEqual5 = function(pt1, pt2, pt3, pt4, UseFullRange) {
      if (UseFullRange)
        return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
      else
        return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
    };
    ClipperLib.ClipperBase.prototype.Clear = function() {
      this.DisposeLocalMinimaList();
      for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i) {
        for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j)
          this.m_edges[i][j] = null;
        ClipperLib.Clear(this.m_edges[i]);
      }
      ClipperLib.Clear(this.m_edges);
      this.m_UseFullRange = false;
      this.m_HasOpenPaths = false;
    };
    ClipperLib.ClipperBase.prototype.DisposeLocalMinimaList = function() {
      while (this.m_MinimaList !== null) {
        var tmpLm = this.m_MinimaList.Next;
        this.m_MinimaList = null;
        this.m_MinimaList = tmpLm;
      }
      this.m_CurrentLM = null;
    };
    ClipperLib.ClipperBase.prototype.RangeTest = function(Pt, useFullRange) {
      if (useFullRange.Value) {
        if (Pt.X > ClipperLib.ClipperBase.hiRange || Pt.Y > ClipperLib.ClipperBase.hiRange || -Pt.X > ClipperLib.ClipperBase.hiRange || -Pt.Y > ClipperLib.ClipperBase.hiRange)
          ClipperLib.Error("Coordinate outside allowed range in RangeTest().");
      } else if (Pt.X > ClipperLib.ClipperBase.loRange || Pt.Y > ClipperLib.ClipperBase.loRange || -Pt.X > ClipperLib.ClipperBase.loRange || -Pt.Y > ClipperLib.ClipperBase.loRange) {
        useFullRange.Value = true;
        this.RangeTest(Pt, useFullRange);
      }
    };
    ClipperLib.ClipperBase.prototype.InitEdge = function(e, eNext, ePrev, pt) {
      e.Next = eNext;
      e.Prev = ePrev;
      e.Curr.X = pt.X;
      e.Curr.Y = pt.Y;
      if (ClipperLib.use_xyz)
        e.Curr.Z = pt.Z;
      e.OutIdx = -1;
    };
    ClipperLib.ClipperBase.prototype.InitEdge2 = function(e, polyType) {
      if (e.Curr.Y >= e.Next.Curr.Y) {
        e.Bot.X = e.Curr.X;
        e.Bot.Y = e.Curr.Y;
        if (ClipperLib.use_xyz)
          e.Bot.Z = e.Curr.Z;
        e.Top.X = e.Next.Curr.X;
        e.Top.Y = e.Next.Curr.Y;
        if (ClipperLib.use_xyz)
          e.Top.Z = e.Next.Curr.Z;
      } else {
        e.Top.X = e.Curr.X;
        e.Top.Y = e.Curr.Y;
        if (ClipperLib.use_xyz)
          e.Top.Z = e.Curr.Z;
        e.Bot.X = e.Next.Curr.X;
        e.Bot.Y = e.Next.Curr.Y;
        if (ClipperLib.use_xyz)
          e.Bot.Z = e.Next.Curr.Z;
      }
      this.SetDx(e);
      e.PolyTyp = polyType;
    };
    ClipperLib.ClipperBase.prototype.FindNextLocMin = function(E) {
      var E2;
      for (; ; ) {
        while (ClipperLib.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib.IntPoint.op_Equality(E.Curr, E.Top))
          E = E.Next;
        if (E.Dx !== ClipperLib.ClipperBase.horizontal && E.Prev.Dx !== ClipperLib.ClipperBase.horizontal)
          break;
        while (E.Prev.Dx === ClipperLib.ClipperBase.horizontal)
          E = E.Prev;
        E2 = E;
        while (E.Dx === ClipperLib.ClipperBase.horizontal)
          E = E.Next;
        if (E.Top.Y === E.Prev.Bot.Y)
          continue;
        if (E2.Prev.Bot.X < E.Bot.X)
          E = E2;
        break;
      }
      return E;
    };
    ClipperLib.ClipperBase.prototype.ProcessBound = function(E, LeftBoundIsForward) {
      var EStart;
      var Result2 = E;
      var Horz;
      if (Result2.OutIdx === ClipperLib.ClipperBase.Skip) {
        E = Result2;
        if (LeftBoundIsForward) {
          while (E.Top.Y === E.Next.Bot.Y)
            E = E.Next;
          while (E !== Result2 && E.Dx === ClipperLib.ClipperBase.horizontal)
            E = E.Prev;
        } else {
          while (E.Top.Y === E.Prev.Bot.Y)
            E = E.Prev;
          while (E !== Result2 && E.Dx === ClipperLib.ClipperBase.horizontal)
            E = E.Next;
        }
        if (E === Result2) {
          if (LeftBoundIsForward)
            Result2 = E.Next;
          else
            Result2 = E.Prev;
        } else {
          if (LeftBoundIsForward)
            E = Result2.Next;
          else
            E = Result2.Prev;
          var locMin = new ClipperLib.LocalMinima();
          locMin.Next = null;
          locMin.Y = E.Bot.Y;
          locMin.LeftBound = null;
          locMin.RightBound = E;
          E.WindDelta = 0;
          Result2 = this.ProcessBound(E, LeftBoundIsForward);
          this.InsertLocalMinima(locMin);
        }
        return Result2;
      }
      if (E.Dx === ClipperLib.ClipperBase.horizontal) {
        if (LeftBoundIsForward)
          EStart = E.Prev;
        else
          EStart = E.Next;
        if (EStart.Dx === ClipperLib.ClipperBase.horizontal) {
          if (EStart.Bot.X !== E.Bot.X && EStart.Top.X !== E.Bot.X)
            this.ReverseHorizontal(E);
        } else if (EStart.Bot.X !== E.Bot.X)
          this.ReverseHorizontal(E);
      }
      EStart = E;
      if (LeftBoundIsForward) {
        while (Result2.Top.Y === Result2.Next.Bot.Y && Result2.Next.OutIdx !== ClipperLib.ClipperBase.Skip)
          Result2 = Result2.Next;
        if (Result2.Dx === ClipperLib.ClipperBase.horizontal && Result2.Next.OutIdx !== ClipperLib.ClipperBase.Skip) {
          Horz = Result2;
          while (Horz.Prev.Dx === ClipperLib.ClipperBase.horizontal)
            Horz = Horz.Prev;
          if (Horz.Prev.Top.X > Result2.Next.Top.X)
            Result2 = Horz.Prev;
        }
        while (E !== Result2) {
          E.NextInLML = E.Next;
          if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X)
            this.ReverseHorizontal(E);
          E = E.Next;
        }
        if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X)
          this.ReverseHorizontal(E);
        Result2 = Result2.Next;
      } else {
        while (Result2.Top.Y === Result2.Prev.Bot.Y && Result2.Prev.OutIdx !== ClipperLib.ClipperBase.Skip)
          Result2 = Result2.Prev;
        if (Result2.Dx === ClipperLib.ClipperBase.horizontal && Result2.Prev.OutIdx !== ClipperLib.ClipperBase.Skip) {
          Horz = Result2;
          while (Horz.Next.Dx === ClipperLib.ClipperBase.horizontal)
            Horz = Horz.Next;
          if (Horz.Next.Top.X === Result2.Prev.Top.X || Horz.Next.Top.X > Result2.Prev.Top.X) {
            Result2 = Horz.Next;
          }
        }
        while (E !== Result2) {
          E.NextInLML = E.Prev;
          if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X)
            this.ReverseHorizontal(E);
          E = E.Prev;
        }
        if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X)
          this.ReverseHorizontal(E);
        Result2 = Result2.Prev;
      }
      return Result2;
    };
    ClipperLib.ClipperBase.prototype.AddPath = function(pg, polyType, Closed) {
      if (ClipperLib.use_lines) {
        if (!Closed && polyType === ClipperLib.PolyType.ptClip)
          ClipperLib.Error("AddPath: Open paths must be subject.");
      } else {
        if (!Closed)
          ClipperLib.Error("AddPath: Open paths have been disabled.");
      }
      var highI = pg.length - 1;
      if (Closed)
        while (highI > 0 && ClipperLib.IntPoint.op_Equality(pg[highI], pg[0]))
          --highI;
      while (highI > 0 && ClipperLib.IntPoint.op_Equality(pg[highI], pg[highI - 1]))
        --highI;
      if (Closed && highI < 2 || !Closed && highI < 1)
        return false;
      var edges = new Array();
      for (var i = 0; i <= highI; i++)
        edges.push(new ClipperLib.TEdge());
      var IsFlat = true;
      edges[1].Curr.X = pg[1].X;
      edges[1].Curr.Y = pg[1].Y;
      if (ClipperLib.use_xyz)
        edges[1].Curr.Z = pg[1].Z;
      var $1 = {
        Value: this.m_UseFullRange
      };
      this.RangeTest(pg[0], $1);
      this.m_UseFullRange = $1.Value;
      $1.Value = this.m_UseFullRange;
      this.RangeTest(pg[highI], $1);
      this.m_UseFullRange = $1.Value;
      this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
      this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
      for (var i = highI - 1; i >= 1; --i) {
        $1.Value = this.m_UseFullRange;
        this.RangeTest(pg[i], $1);
        this.m_UseFullRange = $1.Value;
        this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
      }
      var eStart = edges[0];
      var E = eStart, eLoopStop = eStart;
      for (; ; ) {
        if (E.Curr === E.Next.Curr && (Closed || E.Next !== eStart)) {
          if (E === E.Next)
            break;
          if (E === eStart)
            eStart = E.Next;
          E = this.RemoveEdge(E);
          eLoopStop = E;
          continue;
        }
        if (E.Prev === E.Next)
          break;
        else if (Closed && ClipperLib.ClipperBase.SlopesEqual4(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr))) {
          if (E === eStart)
            eStart = E.Next;
          E = this.RemoveEdge(E);
          E = E.Prev;
          eLoopStop = E;
          continue;
        }
        E = E.Next;
        if (E === eLoopStop || !Closed && E.Next === eStart)
          break;
      }
      if (!Closed && E === E.Next || Closed && E.Prev === E.Next)
        return false;
      if (!Closed) {
        this.m_HasOpenPaths = true;
        eStart.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
      }
      E = eStart;
      do {
        this.InitEdge2(E, polyType);
        E = E.Next;
        if (IsFlat && E.Curr.Y !== eStart.Curr.Y)
          IsFlat = false;
      } while (E !== eStart);
      if (IsFlat) {
        if (Closed)
          return false;
        E.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
        var locMin = new ClipperLib.LocalMinima();
        locMin.Next = null;
        locMin.Y = E.Bot.Y;
        locMin.LeftBound = null;
        locMin.RightBound = E;
        locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
        locMin.RightBound.WindDelta = 0;
        for (; ; ) {
          if (E.Bot.X !== E.Prev.Top.X)
            this.ReverseHorizontal(E);
          if (E.Next.OutIdx === ClipperLib.ClipperBase.Skip)
            break;
          E.NextInLML = E.Next;
          E = E.Next;
        }
        this.InsertLocalMinima(locMin);
        this.m_edges.push(edges);
        return true;
      }
      this.m_edges.push(edges);
      var leftBoundIsForward;
      var EMin = null;
      if (ClipperLib.IntPoint.op_Equality(E.Prev.Bot, E.Prev.Top))
        E = E.Next;
      for (; ; ) {
        E = this.FindNextLocMin(E);
        if (E === EMin)
          break;
        else if (EMin === null)
          EMin = E;
        var locMin = new ClipperLib.LocalMinima();
        locMin.Next = null;
        locMin.Y = E.Bot.Y;
        if (E.Dx < E.Prev.Dx) {
          locMin.LeftBound = E.Prev;
          locMin.RightBound = E;
          leftBoundIsForward = false;
        } else {
          locMin.LeftBound = E;
          locMin.RightBound = E.Prev;
          leftBoundIsForward = true;
        }
        locMin.LeftBound.Side = ClipperLib.EdgeSide.esLeft;
        locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
        if (!Closed)
          locMin.LeftBound.WindDelta = 0;
        else if (locMin.LeftBound.Next === locMin.RightBound)
          locMin.LeftBound.WindDelta = -1;
        else
          locMin.LeftBound.WindDelta = 1;
        locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
        E = this.ProcessBound(locMin.LeftBound, leftBoundIsForward);
        if (E.OutIdx === ClipperLib.ClipperBase.Skip)
          E = this.ProcessBound(E, leftBoundIsForward);
        var E2 = this.ProcessBound(locMin.RightBound, !leftBoundIsForward);
        if (E2.OutIdx === ClipperLib.ClipperBase.Skip)
          E2 = this.ProcessBound(E2, !leftBoundIsForward);
        if (locMin.LeftBound.OutIdx === ClipperLib.ClipperBase.Skip)
          locMin.LeftBound = null;
        else if (locMin.RightBound.OutIdx === ClipperLib.ClipperBase.Skip)
          locMin.RightBound = null;
        this.InsertLocalMinima(locMin);
        if (!leftBoundIsForward)
          E = E2;
      }
      return true;
    };
    ClipperLib.ClipperBase.prototype.AddPaths = function(ppg, polyType, closed) {
      var result = false;
      for (var i = 0, ilen = ppg.length; i < ilen; ++i)
        if (this.AddPath(ppg[i], polyType, closed))
          result = true;
      return result;
    };
    ClipperLib.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function(pt1, pt2, pt3) {
      if (ClipperLib.IntPoint.op_Equality(pt1, pt3) || ClipperLib.IntPoint.op_Equality(pt1, pt2) || ClipperLib.IntPoint.op_Equality(pt3, pt2))
        return false;
      else if (pt1.X !== pt3.X)
        return pt2.X > pt1.X === pt2.X < pt3.X;
      else
        return pt2.Y > pt1.Y === pt2.Y < pt3.Y;
    };
    ClipperLib.ClipperBase.prototype.RemoveEdge = function(e) {
      e.Prev.Next = e.Next;
      e.Next.Prev = e.Prev;
      var result = e.Next;
      e.Prev = null;
      return result;
    };
    ClipperLib.ClipperBase.prototype.SetDx = function(e) {
      e.Delta.X = e.Top.X - e.Bot.X;
      e.Delta.Y = e.Top.Y - e.Bot.Y;
      if (e.Delta.Y === 0)
        e.Dx = ClipperLib.ClipperBase.horizontal;
      else
        e.Dx = e.Delta.X / e.Delta.Y;
    };
    ClipperLib.ClipperBase.prototype.InsertLocalMinima = function(newLm) {
      if (this.m_MinimaList === null) {
        this.m_MinimaList = newLm;
      } else if (newLm.Y >= this.m_MinimaList.Y) {
        newLm.Next = this.m_MinimaList;
        this.m_MinimaList = newLm;
      } else {
        var tmpLm = this.m_MinimaList;
        while (tmpLm.Next !== null && newLm.Y < tmpLm.Next.Y)
          tmpLm = tmpLm.Next;
        newLm.Next = tmpLm.Next;
        tmpLm.Next = newLm;
      }
    };
    ClipperLib.ClipperBase.prototype.PopLocalMinima = function(Y, current) {
      current.v = this.m_CurrentLM;
      if (this.m_CurrentLM !== null && this.m_CurrentLM.Y === Y) {
        this.m_CurrentLM = this.m_CurrentLM.Next;
        return true;
      }
      return false;
    };
    ClipperLib.ClipperBase.prototype.ReverseHorizontal = function(e) {
      var tmp = e.Top.X;
      e.Top.X = e.Bot.X;
      e.Bot.X = tmp;
      if (ClipperLib.use_xyz) {
        tmp = e.Top.Z;
        e.Top.Z = e.Bot.Z;
        e.Bot.Z = tmp;
      }
    };
    ClipperLib.ClipperBase.prototype.Reset = function() {
      this.m_CurrentLM = this.m_MinimaList;
      if (this.m_CurrentLM === null)
        return;
      this.m_Scanbeam = null;
      var lm = this.m_MinimaList;
      while (lm !== null) {
        this.InsertScanbeam(lm.Y);
        var e = lm.LeftBound;
        if (e !== null) {
          e.Curr.X = e.Bot.X;
          e.Curr.Y = e.Bot.Y;
          if (ClipperLib.use_xyz)
            e.Curr.Z = e.Bot.Z;
          e.OutIdx = ClipperLib.ClipperBase.Unassigned;
        }
        e = lm.RightBound;
        if (e !== null) {
          e.Curr.X = e.Bot.X;
          e.Curr.Y = e.Bot.Y;
          if (ClipperLib.use_xyz)
            e.Curr.Z = e.Bot.Z;
          e.OutIdx = ClipperLib.ClipperBase.Unassigned;
        }
        lm = lm.Next;
      }
      this.m_ActiveEdges = null;
    };
    ClipperLib.ClipperBase.prototype.InsertScanbeam = function(Y) {
      if (this.m_Scanbeam === null) {
        this.m_Scanbeam = new ClipperLib.Scanbeam();
        this.m_Scanbeam.Next = null;
        this.m_Scanbeam.Y = Y;
      } else if (Y > this.m_Scanbeam.Y) {
        var newSb = new ClipperLib.Scanbeam();
        newSb.Y = Y;
        newSb.Next = this.m_Scanbeam;
        this.m_Scanbeam = newSb;
      } else {
        var sb2 = this.m_Scanbeam;
        while (sb2.Next !== null && Y <= sb2.Next.Y) {
          sb2 = sb2.Next;
        }
        if (Y === sb2.Y) {
          return;
        }
        var newSb1 = new ClipperLib.Scanbeam();
        newSb1.Y = Y;
        newSb1.Next = sb2.Next;
        sb2.Next = newSb1;
      }
    };
    ClipperLib.ClipperBase.prototype.PopScanbeam = function(Y) {
      if (this.m_Scanbeam === null) {
        Y.v = 0;
        return false;
      }
      Y.v = this.m_Scanbeam.Y;
      this.m_Scanbeam = this.m_Scanbeam.Next;
      return true;
    };
    ClipperLib.ClipperBase.prototype.LocalMinimaPending = function() {
      return this.m_CurrentLM !== null;
    };
    ClipperLib.ClipperBase.prototype.CreateOutRec = function() {
      var result = new ClipperLib.OutRec();
      result.Idx = ClipperLib.ClipperBase.Unassigned;
      result.IsHole = false;
      result.IsOpen = false;
      result.FirstLeft = null;
      result.Pts = null;
      result.BottomPt = null;
      result.PolyNode = null;
      this.m_PolyOuts.push(result);
      result.Idx = this.m_PolyOuts.length - 1;
      return result;
    };
    ClipperLib.ClipperBase.prototype.DisposeOutRec = function(index) {
      var outRec = this.m_PolyOuts[index];
      outRec.Pts = null;
      outRec = null;
      this.m_PolyOuts[index] = null;
    };
    ClipperLib.ClipperBase.prototype.UpdateEdgeIntoAEL = function(e) {
      if (e.NextInLML === null) {
        ClipperLib.Error("UpdateEdgeIntoAEL: invalid call");
      }
      var AelPrev = e.PrevInAEL;
      var AelNext = e.NextInAEL;
      e.NextInLML.OutIdx = e.OutIdx;
      if (AelPrev !== null) {
        AelPrev.NextInAEL = e.NextInLML;
      } else {
        this.m_ActiveEdges = e.NextInLML;
      }
      if (AelNext !== null) {
        AelNext.PrevInAEL = e.NextInLML;
      }
      e.NextInLML.Side = e.Side;
      e.NextInLML.WindDelta = e.WindDelta;
      e.NextInLML.WindCnt = e.WindCnt;
      e.NextInLML.WindCnt2 = e.WindCnt2;
      e = e.NextInLML;
      e.Curr.X = e.Bot.X;
      e.Curr.Y = e.Bot.Y;
      e.PrevInAEL = AelPrev;
      e.NextInAEL = AelNext;
      if (!ClipperLib.ClipperBase.IsHorizontal(e)) {
        this.InsertScanbeam(e.Top.Y);
      }
      return e;
    };
    ClipperLib.ClipperBase.prototype.SwapPositionsInAEL = function(edge1, edge2) {
      if (edge1.NextInAEL === edge1.PrevInAEL || edge2.NextInAEL === edge2.PrevInAEL) {
        return;
      }
      if (edge1.NextInAEL === edge2) {
        var next = edge2.NextInAEL;
        if (next !== null) {
          next.PrevInAEL = edge1;
        }
        var prev = edge1.PrevInAEL;
        if (prev !== null) {
          prev.NextInAEL = edge2;
        }
        edge2.PrevInAEL = prev;
        edge2.NextInAEL = edge1;
        edge1.PrevInAEL = edge2;
        edge1.NextInAEL = next;
      } else if (edge2.NextInAEL === edge1) {
        var next1 = edge1.NextInAEL;
        if (next1 !== null) {
          next1.PrevInAEL = edge2;
        }
        var prev1 = edge2.PrevInAEL;
        if (prev1 !== null) {
          prev1.NextInAEL = edge1;
        }
        edge1.PrevInAEL = prev1;
        edge1.NextInAEL = edge2;
        edge2.PrevInAEL = edge1;
        edge2.NextInAEL = next1;
      } else {
        var next2 = edge1.NextInAEL;
        var prev2 = edge1.PrevInAEL;
        edge1.NextInAEL = edge2.NextInAEL;
        if (edge1.NextInAEL !== null) {
          edge1.NextInAEL.PrevInAEL = edge1;
        }
        edge1.PrevInAEL = edge2.PrevInAEL;
        if (edge1.PrevInAEL !== null) {
          edge1.PrevInAEL.NextInAEL = edge1;
        }
        edge2.NextInAEL = next2;
        if (edge2.NextInAEL !== null) {
          edge2.NextInAEL.PrevInAEL = edge2;
        }
        edge2.PrevInAEL = prev2;
        if (edge2.PrevInAEL !== null) {
          edge2.PrevInAEL.NextInAEL = edge2;
        }
      }
      if (edge1.PrevInAEL === null) {
        this.m_ActiveEdges = edge1;
      } else {
        if (edge2.PrevInAEL === null) {
          this.m_ActiveEdges = edge2;
        }
      }
    };
    ClipperLib.ClipperBase.prototype.DeleteFromAEL = function(e) {
      var AelPrev = e.PrevInAEL;
      var AelNext = e.NextInAEL;
      if (AelPrev === null && AelNext === null && e !== this.m_ActiveEdges) {
        return;
      }
      if (AelPrev !== null) {
        AelPrev.NextInAEL = AelNext;
      } else {
        this.m_ActiveEdges = AelNext;
      }
      if (AelNext !== null) {
        AelNext.PrevInAEL = AelPrev;
      }
      e.NextInAEL = null;
      e.PrevInAEL = null;
    };
    ClipperLib.Clipper = function(InitOptions) {
      if (typeof InitOptions === "undefined")
        InitOptions = 0;
      this.m_PolyOuts = null;
      this.m_ClipType = ClipperLib.ClipType.ctIntersection;
      this.m_Scanbeam = null;
      this.m_Maxima = null;
      this.m_ActiveEdges = null;
      this.m_SortedEdges = null;
      this.m_IntersectList = null;
      this.m_IntersectNodeComparer = null;
      this.m_ExecuteLocked = false;
      this.m_ClipFillType = ClipperLib.PolyFillType.pftEvenOdd;
      this.m_SubjFillType = ClipperLib.PolyFillType.pftEvenOdd;
      this.m_Joins = null;
      this.m_GhostJoins = null;
      this.m_UsingPolyTree = false;
      this.ReverseSolution = false;
      this.StrictlySimple = false;
      ClipperLib.ClipperBase.call(this);
      this.m_Scanbeam = null;
      this.m_Maxima = null;
      this.m_ActiveEdges = null;
      this.m_SortedEdges = null;
      this.m_IntersectList = new Array();
      this.m_IntersectNodeComparer = ClipperLib.MyIntersectNodeSort.Compare;
      this.m_ExecuteLocked = false;
      this.m_UsingPolyTree = false;
      this.m_PolyOuts = new Array();
      this.m_Joins = new Array();
      this.m_GhostJoins = new Array();
      this.ReverseSolution = (1 & InitOptions) !== 0;
      this.StrictlySimple = (2 & InitOptions) !== 0;
      this.PreserveCollinear = (4 & InitOptions) !== 0;
      if (ClipperLib.use_xyz) {
        this.ZFillFunction = null;
      }
    };
    ClipperLib.Clipper.ioReverseSolution = 1;
    ClipperLib.Clipper.ioStrictlySimple = 2;
    ClipperLib.Clipper.ioPreserveCollinear = 4;
    ClipperLib.Clipper.prototype.Clear = function() {
      if (this.m_edges.length === 0)
        return;
      this.DisposeAllPolyPts();
      ClipperLib.ClipperBase.prototype.Clear.call(this);
    };
    ClipperLib.Clipper.prototype.InsertMaxima = function(X) {
      var newMax = new ClipperLib.Maxima();
      newMax.X = X;
      if (this.m_Maxima === null) {
        this.m_Maxima = newMax;
        this.m_Maxima.Next = null;
        this.m_Maxima.Prev = null;
      } else if (X < this.m_Maxima.X) {
        newMax.Next = this.m_Maxima;
        newMax.Prev = null;
        this.m_Maxima = newMax;
      } else {
        var m = this.m_Maxima;
        while (m.Next !== null && X >= m.Next.X) {
          m = m.Next;
        }
        if (X === m.X) {
          return;
        }
        newMax.Next = m.Next;
        newMax.Prev = m;
        if (m.Next !== null) {
          m.Next.Prev = newMax;
        }
        m.Next = newMax;
      }
    };
    ClipperLib.Clipper.prototype.Execute = function() {
      var a = arguments, alen = a.length, ispolytree = a[1] instanceof ClipperLib.PolyTree;
      if (alen === 4 && !ispolytree) {
        var clipType = a[0], solution = a[1], subjFillType = a[2], clipFillType = a[3];
        if (this.m_ExecuteLocked)
          return false;
        if (this.m_HasOpenPaths)
          ClipperLib.Error("Error: PolyTree struct is needed for open path clipping.");
        this.m_ExecuteLocked = true;
        ClipperLib.Clear(solution);
        this.m_SubjFillType = subjFillType;
        this.m_ClipFillType = clipFillType;
        this.m_ClipType = clipType;
        this.m_UsingPolyTree = false;
        try {
          var succeeded = this.ExecuteInternal();
          if (succeeded)
            this.BuildResult(solution);
        } finally {
          this.DisposeAllPolyPts();
          this.m_ExecuteLocked = false;
        }
        return succeeded;
      } else if (alen === 4 && ispolytree) {
        var clipType = a[0], polytree = a[1], subjFillType = a[2], clipFillType = a[3];
        if (this.m_ExecuteLocked)
          return false;
        this.m_ExecuteLocked = true;
        this.m_SubjFillType = subjFillType;
        this.m_ClipFillType = clipFillType;
        this.m_ClipType = clipType;
        this.m_UsingPolyTree = true;
        try {
          var succeeded = this.ExecuteInternal();
          if (succeeded)
            this.BuildResult2(polytree);
        } finally {
          this.DisposeAllPolyPts();
          this.m_ExecuteLocked = false;
        }
        return succeeded;
      } else if (alen === 2 && !ispolytree) {
        var clipType = a[0], solution = a[1];
        return this.Execute(clipType, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
      } else if (alen === 2 && ispolytree) {
        var clipType = a[0], polytree = a[1];
        return this.Execute(clipType, polytree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
      }
    };
    ClipperLib.Clipper.prototype.FixHoleLinkage = function(outRec) {
      if (outRec.FirstLeft === null || outRec.IsHole !== outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null)
        return;
      var orfl = outRec.FirstLeft;
      while (orfl !== null && (orfl.IsHole === outRec.IsHole || orfl.Pts === null))
        orfl = orfl.FirstLeft;
      outRec.FirstLeft = orfl;
    };
    ClipperLib.Clipper.prototype.ExecuteInternal = function() {
      try {
        this.Reset();
        this.m_SortedEdges = null;
        this.m_Maxima = null;
        var botY = {}, topY = {};
        if (!this.PopScanbeam(botY)) {
          return false;
        }
        this.InsertLocalMinimaIntoAEL(botY.v);
        while (this.PopScanbeam(topY) || this.LocalMinimaPending()) {
          this.ProcessHorizontals();
          this.m_GhostJoins.length = 0;
          if (!this.ProcessIntersections(topY.v)) {
            return false;
          }
          this.ProcessEdgesAtTopOfScanbeam(topY.v);
          botY.v = topY.v;
          this.InsertLocalMinimaIntoAEL(botY.v);
        }
        var outRec, i, ilen;
        for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          outRec = this.m_PolyOuts[i];
          if (outRec.Pts === null || outRec.IsOpen)
            continue;
          if ((outRec.IsHole ^ this.ReverseSolution) == this.Area$1(outRec) > 0)
            this.ReversePolyPtLinks(outRec.Pts);
        }
        this.JoinCommonEdges();
        for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          outRec = this.m_PolyOuts[i];
          if (outRec.Pts === null)
            continue;
          else if (outRec.IsOpen)
            this.FixupOutPolyline(outRec);
          else
            this.FixupOutPolygon(outRec);
        }
        if (this.StrictlySimple)
          this.DoSimplePolygons();
        return true;
      } finally {
        this.m_Joins.length = 0;
        this.m_GhostJoins.length = 0;
      }
    };
    ClipperLib.Clipper.prototype.DisposeAllPolyPts = function() {
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i)
        this.DisposeOutRec(i);
      ClipperLib.Clear(this.m_PolyOuts);
    };
    ClipperLib.Clipper.prototype.AddJoin = function(Op1, Op2, OffPt) {
      var j = new ClipperLib.Join();
      j.OutPt1 = Op1;
      j.OutPt2 = Op2;
      j.OffPt.X = OffPt.X;
      j.OffPt.Y = OffPt.Y;
      if (ClipperLib.use_xyz)
        j.OffPt.Z = OffPt.Z;
      this.m_Joins.push(j);
    };
    ClipperLib.Clipper.prototype.AddGhostJoin = function(Op, OffPt) {
      var j = new ClipperLib.Join();
      j.OutPt1 = Op;
      j.OffPt.X = OffPt.X;
      j.OffPt.Y = OffPt.Y;
      if (ClipperLib.use_xyz)
        j.OffPt.Z = OffPt.Z;
      this.m_GhostJoins.push(j);
    };
    ClipperLib.Clipper.prototype.SetZ = function(pt, e1, e2) {
      if (this.ZFillFunction !== null) {
        if (pt.Z !== 0 || this.ZFillFunction === null)
          return;
        else if (ClipperLib.IntPoint.op_Equality(pt, e1.Bot))
          pt.Z = e1.Bot.Z;
        else if (ClipperLib.IntPoint.op_Equality(pt, e1.Top))
          pt.Z = e1.Top.Z;
        else if (ClipperLib.IntPoint.op_Equality(pt, e2.Bot))
          pt.Z = e2.Bot.Z;
        else if (ClipperLib.IntPoint.op_Equality(pt, e2.Top))
          pt.Z = e2.Top.Z;
        else
          this.ZFillFunction(e1.Bot, e1.Top, e2.Bot, e2.Top, pt);
      }
    };
    ClipperLib.Clipper.prototype.InsertLocalMinimaIntoAEL = function(botY) {
      var lm = {};
      var lb;
      var rb;
      while (this.PopLocalMinima(botY, lm)) {
        lb = lm.v.LeftBound;
        rb = lm.v.RightBound;
        var Op1 = null;
        if (lb === null) {
          this.InsertEdgeIntoAEL(rb, null);
          this.SetWindingCount(rb);
          if (this.IsContributing(rb))
            Op1 = this.AddOutPt(rb, rb.Bot);
        } else if (rb === null) {
          this.InsertEdgeIntoAEL(lb, null);
          this.SetWindingCount(lb);
          if (this.IsContributing(lb))
            Op1 = this.AddOutPt(lb, lb.Bot);
          this.InsertScanbeam(lb.Top.Y);
        } else {
          this.InsertEdgeIntoAEL(lb, null);
          this.InsertEdgeIntoAEL(rb, lb);
          this.SetWindingCount(lb);
          rb.WindCnt = lb.WindCnt;
          rb.WindCnt2 = lb.WindCnt2;
          if (this.IsContributing(lb))
            Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
          this.InsertScanbeam(lb.Top.Y);
        }
        if (rb !== null) {
          if (ClipperLib.ClipperBase.IsHorizontal(rb)) {
            if (rb.NextInLML !== null) {
              this.InsertScanbeam(rb.NextInLML.Top.Y);
            }
            this.AddEdgeToSEL(rb);
          } else {
            this.InsertScanbeam(rb.Top.Y);
          }
        }
        if (lb === null || rb === null)
          continue;
        if (Op1 !== null && ClipperLib.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0) {
          for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++) {
            var j = this.m_GhostJoins[i];
            if (this.HorzSegmentsOverlap(j.OutPt1.Pt.X, j.OffPt.X, rb.Bot.X, rb.Top.X))
              this.AddJoin(j.OutPt1, Op1, j.OffPt);
          }
        }
        if (lb.OutIdx >= 0 && lb.PrevInAEL !== null && lb.PrevInAEL.Curr.X === lb.Bot.X && lb.PrevInAEL.OutIdx >= 0 && ClipperLib.ClipperBase.SlopesEqual5(lb.PrevInAEL.Curr, lb.PrevInAEL.Top, lb.Curr, lb.Top, this.m_UseFullRange) && lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0) {
          var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
          this.AddJoin(Op1, Op2, lb.Top);
        }
        if (lb.NextInAEL !== rb) {
          if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 && ClipperLib.ClipperBase.SlopesEqual5(rb.PrevInAEL.Curr, rb.PrevInAEL.Top, rb.Curr, rb.Top, this.m_UseFullRange) && rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0) {
            var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
            this.AddJoin(Op1, Op2, rb.Top);
          }
          var e = lb.NextInAEL;
          if (e !== null)
            while (e !== rb) {
              this.IntersectEdges(rb, e, lb.Curr);
              e = e.NextInAEL;
            }
        }
      }
    };
    ClipperLib.Clipper.prototype.InsertEdgeIntoAEL = function(edge, startEdge) {
      if (this.m_ActiveEdges === null) {
        edge.PrevInAEL = null;
        edge.NextInAEL = null;
        this.m_ActiveEdges = edge;
      } else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge)) {
        edge.PrevInAEL = null;
        edge.NextInAEL = this.m_ActiveEdges;
        this.m_ActiveEdges.PrevInAEL = edge;
        this.m_ActiveEdges = edge;
      } else {
        if (startEdge === null)
          startEdge = this.m_ActiveEdges;
        while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge))
          startEdge = startEdge.NextInAEL;
        edge.NextInAEL = startEdge.NextInAEL;
        if (startEdge.NextInAEL !== null)
          startEdge.NextInAEL.PrevInAEL = edge;
        edge.PrevInAEL = startEdge;
        startEdge.NextInAEL = edge;
      }
    };
    ClipperLib.Clipper.prototype.E2InsertsBeforeE1 = function(e1, e2) {
      if (e2.Curr.X === e1.Curr.X) {
        if (e2.Top.Y > e1.Top.Y)
          return e2.Top.X < ClipperLib.Clipper.TopX(e1, e2.Top.Y);
        else
          return e1.Top.X > ClipperLib.Clipper.TopX(e2, e1.Top.Y);
      } else
        return e2.Curr.X < e1.Curr.X;
    };
    ClipperLib.Clipper.prototype.IsEvenOddFillType = function(edge) {
      if (edge.PolyTyp === ClipperLib.PolyType.ptSubject)
        return this.m_SubjFillType === ClipperLib.PolyFillType.pftEvenOdd;
      else
        return this.m_ClipFillType === ClipperLib.PolyFillType.pftEvenOdd;
    };
    ClipperLib.Clipper.prototype.IsEvenOddAltFillType = function(edge) {
      if (edge.PolyTyp === ClipperLib.PolyType.ptSubject)
        return this.m_ClipFillType === ClipperLib.PolyFillType.pftEvenOdd;
      else
        return this.m_SubjFillType === ClipperLib.PolyFillType.pftEvenOdd;
    };
    ClipperLib.Clipper.prototype.IsContributing = function(edge) {
      var pft, pft2;
      if (edge.PolyTyp === ClipperLib.PolyType.ptSubject) {
        pft = this.m_SubjFillType;
        pft2 = this.m_ClipFillType;
      } else {
        pft = this.m_ClipFillType;
        pft2 = this.m_SubjFillType;
      }
      switch (pft) {
        case ClipperLib.PolyFillType.pftEvenOdd:
          if (edge.WindDelta === 0 && edge.WindCnt !== 1)
            return false;
          break;
        case ClipperLib.PolyFillType.pftNonZero:
          if (Math.abs(edge.WindCnt) !== 1)
            return false;
          break;
        case ClipperLib.PolyFillType.pftPositive:
          if (edge.WindCnt !== 1)
            return false;
          break;
        default:
          if (edge.WindCnt !== -1)
            return false;
          break;
      }
      switch (this.m_ClipType) {
        case ClipperLib.ClipType.ctIntersection:
          switch (pft2) {
            case ClipperLib.PolyFillType.pftEvenOdd:
            case ClipperLib.PolyFillType.pftNonZero:
              return edge.WindCnt2 !== 0;
            case ClipperLib.PolyFillType.pftPositive:
              return edge.WindCnt2 > 0;
            default:
              return edge.WindCnt2 < 0;
          }
        case ClipperLib.ClipType.ctUnion:
          switch (pft2) {
            case ClipperLib.PolyFillType.pftEvenOdd:
            case ClipperLib.PolyFillType.pftNonZero:
              return edge.WindCnt2 === 0;
            case ClipperLib.PolyFillType.pftPositive:
              return edge.WindCnt2 <= 0;
            default:
              return edge.WindCnt2 >= 0;
          }
        case ClipperLib.ClipType.ctDifference:
          if (edge.PolyTyp === ClipperLib.PolyType.ptSubject)
            switch (pft2) {
              case ClipperLib.PolyFillType.pftEvenOdd:
              case ClipperLib.PolyFillType.pftNonZero:
                return edge.WindCnt2 === 0;
              case ClipperLib.PolyFillType.pftPositive:
                return edge.WindCnt2 <= 0;
              default:
                return edge.WindCnt2 >= 0;
            }
          else
            switch (pft2) {
              case ClipperLib.PolyFillType.pftEvenOdd:
              case ClipperLib.PolyFillType.pftNonZero:
                return edge.WindCnt2 !== 0;
              case ClipperLib.PolyFillType.pftPositive:
                return edge.WindCnt2 > 0;
              default:
                return edge.WindCnt2 < 0;
            }
        case ClipperLib.ClipType.ctXor:
          if (edge.WindDelta === 0)
            switch (pft2) {
              case ClipperLib.PolyFillType.pftEvenOdd:
              case ClipperLib.PolyFillType.pftNonZero:
                return edge.WindCnt2 === 0;
              case ClipperLib.PolyFillType.pftPositive:
                return edge.WindCnt2 <= 0;
              default:
                return edge.WindCnt2 >= 0;
            }
          else
            return true;
      }
      return true;
    };
    ClipperLib.Clipper.prototype.SetWindingCount = function(edge) {
      var e = edge.PrevInAEL;
      while (e !== null && (e.PolyTyp !== edge.PolyTyp || e.WindDelta === 0))
        e = e.PrevInAEL;
      if (e === null) {
        var pft = edge.PolyTyp === ClipperLib.PolyType.ptSubject ? this.m_SubjFillType : this.m_ClipFillType;
        if (edge.WindDelta === 0) {
          edge.WindCnt = pft === ClipperLib.PolyFillType.pftNegative ? -1 : 1;
        } else {
          edge.WindCnt = edge.WindDelta;
        }
        edge.WindCnt2 = 0;
        e = this.m_ActiveEdges;
      } else if (edge.WindDelta === 0 && this.m_ClipType !== ClipperLib.ClipType.ctUnion) {
        edge.WindCnt = 1;
        edge.WindCnt2 = e.WindCnt2;
        e = e.NextInAEL;
      } else if (this.IsEvenOddFillType(edge)) {
        if (edge.WindDelta === 0) {
          var Inside = true;
          var e2 = e.PrevInAEL;
          while (e2 !== null) {
            if (e2.PolyTyp === e.PolyTyp && e2.WindDelta !== 0)
              Inside = !Inside;
            e2 = e2.PrevInAEL;
          }
          edge.WindCnt = Inside ? 0 : 1;
        } else {
          edge.WindCnt = edge.WindDelta;
        }
        edge.WindCnt2 = e.WindCnt2;
        e = e.NextInAEL;
      } else {
        if (e.WindCnt * e.WindDelta < 0) {
          if (Math.abs(e.WindCnt) > 1) {
            if (e.WindDelta * edge.WindDelta < 0)
              edge.WindCnt = e.WindCnt;
            else
              edge.WindCnt = e.WindCnt + edge.WindDelta;
          } else
            edge.WindCnt = edge.WindDelta === 0 ? 1 : edge.WindDelta;
        } else {
          if (edge.WindDelta === 0)
            edge.WindCnt = e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1;
          else if (e.WindDelta * edge.WindDelta < 0)
            edge.WindCnt = e.WindCnt;
          else
            edge.WindCnt = e.WindCnt + edge.WindDelta;
        }
        edge.WindCnt2 = e.WindCnt2;
        e = e.NextInAEL;
      }
      if (this.IsEvenOddAltFillType(edge)) {
        while (e !== edge) {
          if (e.WindDelta !== 0)
            edge.WindCnt2 = edge.WindCnt2 === 0 ? 1 : 0;
          e = e.NextInAEL;
        }
      } else {
        while (e !== edge) {
          edge.WindCnt2 += e.WindDelta;
          e = e.NextInAEL;
        }
      }
    };
    ClipperLib.Clipper.prototype.AddEdgeToSEL = function(edge) {
      if (this.m_SortedEdges === null) {
        this.m_SortedEdges = edge;
        edge.PrevInSEL = null;
        edge.NextInSEL = null;
      } else {
        edge.NextInSEL = this.m_SortedEdges;
        edge.PrevInSEL = null;
        this.m_SortedEdges.PrevInSEL = edge;
        this.m_SortedEdges = edge;
      }
    };
    ClipperLib.Clipper.prototype.PopEdgeFromSEL = function(e) {
      e.v = this.m_SortedEdges;
      if (e.v === null) {
        return false;
      }
      var oldE = e.v;
      this.m_SortedEdges = e.v.NextInSEL;
      if (this.m_SortedEdges !== null) {
        this.m_SortedEdges.PrevInSEL = null;
      }
      oldE.NextInSEL = null;
      oldE.PrevInSEL = null;
      return true;
    };
    ClipperLib.Clipper.prototype.CopyAELToSEL = function() {
      var e = this.m_ActiveEdges;
      this.m_SortedEdges = e;
      while (e !== null) {
        e.PrevInSEL = e.PrevInAEL;
        e.NextInSEL = e.NextInAEL;
        e = e.NextInAEL;
      }
    };
    ClipperLib.Clipper.prototype.SwapPositionsInSEL = function(edge1, edge2) {
      if (edge1.NextInSEL === null && edge1.PrevInSEL === null)
        return;
      if (edge2.NextInSEL === null && edge2.PrevInSEL === null)
        return;
      if (edge1.NextInSEL === edge2) {
        var next = edge2.NextInSEL;
        if (next !== null)
          next.PrevInSEL = edge1;
        var prev = edge1.PrevInSEL;
        if (prev !== null)
          prev.NextInSEL = edge2;
        edge2.PrevInSEL = prev;
        edge2.NextInSEL = edge1;
        edge1.PrevInSEL = edge2;
        edge1.NextInSEL = next;
      } else if (edge2.NextInSEL === edge1) {
        var next = edge1.NextInSEL;
        if (next !== null)
          next.PrevInSEL = edge2;
        var prev = edge2.PrevInSEL;
        if (prev !== null)
          prev.NextInSEL = edge1;
        edge1.PrevInSEL = prev;
        edge1.NextInSEL = edge2;
        edge2.PrevInSEL = edge1;
        edge2.NextInSEL = next;
      } else {
        var next = edge1.NextInSEL;
        var prev = edge1.PrevInSEL;
        edge1.NextInSEL = edge2.NextInSEL;
        if (edge1.NextInSEL !== null)
          edge1.NextInSEL.PrevInSEL = edge1;
        edge1.PrevInSEL = edge2.PrevInSEL;
        if (edge1.PrevInSEL !== null)
          edge1.PrevInSEL.NextInSEL = edge1;
        edge2.NextInSEL = next;
        if (edge2.NextInSEL !== null)
          edge2.NextInSEL.PrevInSEL = edge2;
        edge2.PrevInSEL = prev;
        if (edge2.PrevInSEL !== null)
          edge2.PrevInSEL.NextInSEL = edge2;
      }
      if (edge1.PrevInSEL === null)
        this.m_SortedEdges = edge1;
      else if (edge2.PrevInSEL === null)
        this.m_SortedEdges = edge2;
    };
    ClipperLib.Clipper.prototype.AddLocalMaxPoly = function(e1, e2, pt) {
      this.AddOutPt(e1, pt);
      if (e2.WindDelta === 0)
        this.AddOutPt(e2, pt);
      if (e1.OutIdx === e2.OutIdx) {
        e1.OutIdx = -1;
        e2.OutIdx = -1;
      } else if (e1.OutIdx < e2.OutIdx)
        this.AppendPolygon(e1, e2);
      else
        this.AppendPolygon(e2, e1);
    };
    ClipperLib.Clipper.prototype.AddLocalMinPoly = function(e1, e2, pt) {
      var result;
      var e, prevE;
      if (ClipperLib.ClipperBase.IsHorizontal(e2) || e1.Dx > e2.Dx) {
        result = this.AddOutPt(e1, pt);
        e2.OutIdx = e1.OutIdx;
        e1.Side = ClipperLib.EdgeSide.esLeft;
        e2.Side = ClipperLib.EdgeSide.esRight;
        e = e1;
        if (e.PrevInAEL === e2)
          prevE = e2.PrevInAEL;
        else
          prevE = e.PrevInAEL;
      } else {
        result = this.AddOutPt(e2, pt);
        e1.OutIdx = e2.OutIdx;
        e1.Side = ClipperLib.EdgeSide.esRight;
        e2.Side = ClipperLib.EdgeSide.esLeft;
        e = e2;
        if (e.PrevInAEL === e1)
          prevE = e1.PrevInAEL;
        else
          prevE = e.PrevInAEL;
      }
      if (prevE !== null && prevE.OutIdx >= 0 && prevE.Top.Y < pt.Y && e.Top.Y < pt.Y) {
        var xPrev = ClipperLib.Clipper.TopX(prevE, pt.Y);
        var xE = ClipperLib.Clipper.TopX(e, pt.Y);
        if (xPrev === xE && e.WindDelta !== 0 && prevE.WindDelta !== 0 && ClipperLib.ClipperBase.SlopesEqual5(new ClipperLib.IntPoint2(xPrev, pt.Y), prevE.Top, new ClipperLib.IntPoint2(xE, pt.Y), e.Top, this.m_UseFullRange)) {
          var outPt = this.AddOutPt(prevE, pt);
          this.AddJoin(result, outPt, e.Top);
        }
      }
      return result;
    };
    ClipperLib.Clipper.prototype.AddOutPt = function(e, pt) {
      if (e.OutIdx < 0) {
        var outRec = this.CreateOutRec();
        outRec.IsOpen = e.WindDelta === 0;
        var newOp = new ClipperLib.OutPt();
        outRec.Pts = newOp;
        newOp.Idx = outRec.Idx;
        newOp.Pt.X = pt.X;
        newOp.Pt.Y = pt.Y;
        if (ClipperLib.use_xyz)
          newOp.Pt.Z = pt.Z;
        newOp.Next = newOp;
        newOp.Prev = newOp;
        if (!outRec.IsOpen)
          this.SetHoleState(e, outRec);
        e.OutIdx = outRec.Idx;
        return newOp;
      } else {
        var outRec = this.m_PolyOuts[e.OutIdx];
        var op = outRec.Pts;
        var ToFront = e.Side === ClipperLib.EdgeSide.esLeft;
        if (ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Pt))
          return op;
        else if (!ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Prev.Pt))
          return op.Prev;
        var newOp = new ClipperLib.OutPt();
        newOp.Idx = outRec.Idx;
        newOp.Pt.X = pt.X;
        newOp.Pt.Y = pt.Y;
        if (ClipperLib.use_xyz)
          newOp.Pt.Z = pt.Z;
        newOp.Next = op;
        newOp.Prev = op.Prev;
        newOp.Prev.Next = newOp;
        op.Prev = newOp;
        if (ToFront)
          outRec.Pts = newOp;
        return newOp;
      }
    };
    ClipperLib.Clipper.prototype.GetLastOutPt = function(e) {
      var outRec = this.m_PolyOuts[e.OutIdx];
      if (e.Side === ClipperLib.EdgeSide.esLeft) {
        return outRec.Pts;
      } else {
        return outRec.Pts.Prev;
      }
    };
    ClipperLib.Clipper.prototype.SwapPoints = function(pt1, pt2) {
      var tmp = new ClipperLib.IntPoint1(pt1.Value);
      pt1.Value.X = pt2.Value.X;
      pt1.Value.Y = pt2.Value.Y;
      if (ClipperLib.use_xyz)
        pt1.Value.Z = pt2.Value.Z;
      pt2.Value.X = tmp.X;
      pt2.Value.Y = tmp.Y;
      if (ClipperLib.use_xyz)
        pt2.Value.Z = tmp.Z;
    };
    ClipperLib.Clipper.prototype.HorzSegmentsOverlap = function(seg1a, seg1b, seg2a, seg2b) {
      var tmp;
      if (seg1a > seg1b) {
        tmp = seg1a;
        seg1a = seg1b;
        seg1b = tmp;
      }
      if (seg2a > seg2b) {
        tmp = seg2a;
        seg2a = seg2b;
        seg2b = tmp;
      }
      return seg1a < seg2b && seg2a < seg1b;
    };
    ClipperLib.Clipper.prototype.SetHoleState = function(e, outRec) {
      var e2 = e.PrevInAEL;
      var eTmp = null;
      while (e2 !== null) {
        if (e2.OutIdx >= 0 && e2.WindDelta !== 0) {
          if (eTmp === null)
            eTmp = e2;
          else if (eTmp.OutIdx === e2.OutIdx)
            eTmp = null;
        }
        e2 = e2.PrevInAEL;
      }
      if (eTmp === null) {
        outRec.FirstLeft = null;
        outRec.IsHole = false;
      } else {
        outRec.FirstLeft = this.m_PolyOuts[eTmp.OutIdx];
        outRec.IsHole = !outRec.FirstLeft.IsHole;
      }
    };
    ClipperLib.Clipper.prototype.GetDx = function(pt1, pt2) {
      if (pt1.Y === pt2.Y)
        return ClipperLib.ClipperBase.horizontal;
      else
        return (pt2.X - pt1.X) / (pt2.Y - pt1.Y);
    };
    ClipperLib.Clipper.prototype.FirstIsBottomPt = function(btmPt1, btmPt2) {
      var p = btmPt1.Prev;
      while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1)
        p = p.Prev;
      var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
      p = btmPt1.Next;
      while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1)
        p = p.Next;
      var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
      p = btmPt2.Prev;
      while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2)
        p = p.Prev;
      var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
      p = btmPt2.Next;
      while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2)
        p = p.Next;
      var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
      if (Math.max(dx1p, dx1n) === Math.max(dx2p, dx2n) && Math.min(dx1p, dx1n) === Math.min(dx2p, dx2n)) {
        return this.Area(btmPt1) > 0;
      } else {
        return dx1p >= dx2p && dx1p >= dx2n || dx1n >= dx2p && dx1n >= dx2n;
      }
    };
    ClipperLib.Clipper.prototype.GetBottomPt = function(pp) {
      var dups = null;
      var p = pp.Next;
      while (p !== pp) {
        if (p.Pt.Y > pp.Pt.Y) {
          pp = p;
          dups = null;
        } else if (p.Pt.Y === pp.Pt.Y && p.Pt.X <= pp.Pt.X) {
          if (p.Pt.X < pp.Pt.X) {
            dups = null;
            pp = p;
          } else {
            if (p.Next !== pp && p.Prev !== pp)
              dups = p;
          }
        }
        p = p.Next;
      }
      if (dups !== null) {
        while (dups !== p) {
          if (!this.FirstIsBottomPt(p, dups))
            pp = dups;
          dups = dups.Next;
          while (ClipperLib.IntPoint.op_Inequality(dups.Pt, pp.Pt))
            dups = dups.Next;
        }
      }
      return pp;
    };
    ClipperLib.Clipper.prototype.GetLowermostRec = function(outRec1, outRec2) {
      if (outRec1.BottomPt === null)
        outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
      if (outRec2.BottomPt === null)
        outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
      var bPt1 = outRec1.BottomPt;
      var bPt2 = outRec2.BottomPt;
      if (bPt1.Pt.Y > bPt2.Pt.Y)
        return outRec1;
      else if (bPt1.Pt.Y < bPt2.Pt.Y)
        return outRec2;
      else if (bPt1.Pt.X < bPt2.Pt.X)
        return outRec1;
      else if (bPt1.Pt.X > bPt2.Pt.X)
        return outRec2;
      else if (bPt1.Next === bPt1)
        return outRec2;
      else if (bPt2.Next === bPt2)
        return outRec1;
      else if (this.FirstIsBottomPt(bPt1, bPt2))
        return outRec1;
      else
        return outRec2;
    };
    ClipperLib.Clipper.prototype.OutRec1RightOfOutRec2 = function(outRec1, outRec2) {
      do {
        outRec1 = outRec1.FirstLeft;
        if (outRec1 === outRec2)
          return true;
      } while (outRec1 !== null);
      return false;
    };
    ClipperLib.Clipper.prototype.GetOutRec = function(idx) {
      var outrec = this.m_PolyOuts[idx];
      while (outrec !== this.m_PolyOuts[outrec.Idx])
        outrec = this.m_PolyOuts[outrec.Idx];
      return outrec;
    };
    ClipperLib.Clipper.prototype.AppendPolygon = function(e1, e2) {
      var outRec1 = this.m_PolyOuts[e1.OutIdx];
      var outRec2 = this.m_PolyOuts[e2.OutIdx];
      var holeStateRec;
      if (this.OutRec1RightOfOutRec2(outRec1, outRec2))
        holeStateRec = outRec2;
      else if (this.OutRec1RightOfOutRec2(outRec2, outRec1))
        holeStateRec = outRec1;
      else
        holeStateRec = this.GetLowermostRec(outRec1, outRec2);
      var p1_lft = outRec1.Pts;
      var p1_rt = p1_lft.Prev;
      var p2_lft = outRec2.Pts;
      var p2_rt = p2_lft.Prev;
      if (e1.Side === ClipperLib.EdgeSide.esLeft) {
        if (e2.Side === ClipperLib.EdgeSide.esLeft) {
          this.ReversePolyPtLinks(p2_lft);
          p2_lft.Next = p1_lft;
          p1_lft.Prev = p2_lft;
          p1_rt.Next = p2_rt;
          p2_rt.Prev = p1_rt;
          outRec1.Pts = p2_rt;
        } else {
          p2_rt.Next = p1_lft;
          p1_lft.Prev = p2_rt;
          p2_lft.Prev = p1_rt;
          p1_rt.Next = p2_lft;
          outRec1.Pts = p2_lft;
        }
      } else {
        if (e2.Side === ClipperLib.EdgeSide.esRight) {
          this.ReversePolyPtLinks(p2_lft);
          p1_rt.Next = p2_rt;
          p2_rt.Prev = p1_rt;
          p2_lft.Next = p1_lft;
          p1_lft.Prev = p2_lft;
        } else {
          p1_rt.Next = p2_lft;
          p2_lft.Prev = p1_rt;
          p1_lft.Prev = p2_rt;
          p2_rt.Next = p1_lft;
        }
      }
      outRec1.BottomPt = null;
      if (holeStateRec === outRec2) {
        if (outRec2.FirstLeft !== outRec1)
          outRec1.FirstLeft = outRec2.FirstLeft;
        outRec1.IsHole = outRec2.IsHole;
      }
      outRec2.Pts = null;
      outRec2.BottomPt = null;
      outRec2.FirstLeft = outRec1;
      var OKIdx = e1.OutIdx;
      var ObsoleteIdx = e2.OutIdx;
      e1.OutIdx = -1;
      e2.OutIdx = -1;
      var e = this.m_ActiveEdges;
      while (e !== null) {
        if (e.OutIdx === ObsoleteIdx) {
          e.OutIdx = OKIdx;
          e.Side = e1.Side;
          break;
        }
        e = e.NextInAEL;
      }
      outRec2.Idx = outRec1.Idx;
    };
    ClipperLib.Clipper.prototype.ReversePolyPtLinks = function(pp) {
      if (pp === null)
        return;
      var pp1;
      var pp2;
      pp1 = pp;
      do {
        pp2 = pp1.Next;
        pp1.Next = pp1.Prev;
        pp1.Prev = pp2;
        pp1 = pp2;
      } while (pp1 !== pp);
    };
    ClipperLib.Clipper.SwapSides = function(edge1, edge2) {
      var side = edge1.Side;
      edge1.Side = edge2.Side;
      edge2.Side = side;
    };
    ClipperLib.Clipper.SwapPolyIndexes = function(edge1, edge2) {
      var outIdx = edge1.OutIdx;
      edge1.OutIdx = edge2.OutIdx;
      edge2.OutIdx = outIdx;
    };
    ClipperLib.Clipper.prototype.IntersectEdges = function(e1, e2, pt) {
      var e1Contributing = e1.OutIdx >= 0;
      var e2Contributing = e2.OutIdx >= 0;
      if (ClipperLib.use_xyz)
        this.SetZ(pt, e1, e2);
      if (ClipperLib.use_lines) {
        if (e1.WindDelta === 0 || e2.WindDelta === 0) {
          if (e1.WindDelta === 0 && e2.WindDelta === 0)
            return;
          else if (e1.PolyTyp === e2.PolyTyp && e1.WindDelta !== e2.WindDelta && this.m_ClipType === ClipperLib.ClipType.ctUnion) {
            if (e1.WindDelta === 0) {
              if (e2Contributing) {
                this.AddOutPt(e1, pt);
                if (e1Contributing)
                  e1.OutIdx = -1;
              }
            } else {
              if (e1Contributing) {
                this.AddOutPt(e2, pt);
                if (e2Contributing)
                  e2.OutIdx = -1;
              }
            }
          } else if (e1.PolyTyp !== e2.PolyTyp) {
            if (e1.WindDelta === 0 && Math.abs(e2.WindCnt) === 1 && (this.m_ClipType !== ClipperLib.ClipType.ctUnion || e2.WindCnt2 === 0)) {
              this.AddOutPt(e1, pt);
              if (e1Contributing)
                e1.OutIdx = -1;
            } else if (e2.WindDelta === 0 && Math.abs(e1.WindCnt) === 1 && (this.m_ClipType !== ClipperLib.ClipType.ctUnion || e1.WindCnt2 === 0)) {
              this.AddOutPt(e2, pt);
              if (e2Contributing)
                e2.OutIdx = -1;
            }
          }
          return;
        }
      }
      if (e1.PolyTyp === e2.PolyTyp) {
        if (this.IsEvenOddFillType(e1)) {
          var oldE1WindCnt = e1.WindCnt;
          e1.WindCnt = e2.WindCnt;
          e2.WindCnt = oldE1WindCnt;
        } else {
          if (e1.WindCnt + e2.WindDelta === 0)
            e1.WindCnt = -e1.WindCnt;
          else
            e1.WindCnt += e2.WindDelta;
          if (e2.WindCnt - e1.WindDelta === 0)
            e2.WindCnt = -e2.WindCnt;
          else
            e2.WindCnt -= e1.WindDelta;
        }
      } else {
        if (!this.IsEvenOddFillType(e2))
          e1.WindCnt2 += e2.WindDelta;
        else
          e1.WindCnt2 = e1.WindCnt2 === 0 ? 1 : 0;
        if (!this.IsEvenOddFillType(e1))
          e2.WindCnt2 -= e1.WindDelta;
        else
          e2.WindCnt2 = e2.WindCnt2 === 0 ? 1 : 0;
      }
      var e1FillType, e2FillType, e1FillType2, e2FillType2;
      if (e1.PolyTyp === ClipperLib.PolyType.ptSubject) {
        e1FillType = this.m_SubjFillType;
        e1FillType2 = this.m_ClipFillType;
      } else {
        e1FillType = this.m_ClipFillType;
        e1FillType2 = this.m_SubjFillType;
      }
      if (e2.PolyTyp === ClipperLib.PolyType.ptSubject) {
        e2FillType = this.m_SubjFillType;
        e2FillType2 = this.m_ClipFillType;
      } else {
        e2FillType = this.m_ClipFillType;
        e2FillType2 = this.m_SubjFillType;
      }
      var e1Wc, e2Wc;
      switch (e1FillType) {
        case ClipperLib.PolyFillType.pftPositive:
          e1Wc = e1.WindCnt;
          break;
        case ClipperLib.PolyFillType.pftNegative:
          e1Wc = -e1.WindCnt;
          break;
        default:
          e1Wc = Math.abs(e1.WindCnt);
          break;
      }
      switch (e2FillType) {
        case ClipperLib.PolyFillType.pftPositive:
          e2Wc = e2.WindCnt;
          break;
        case ClipperLib.PolyFillType.pftNegative:
          e2Wc = -e2.WindCnt;
          break;
        default:
          e2Wc = Math.abs(e2.WindCnt);
          break;
      }
      if (e1Contributing && e2Contributing) {
        if (e1Wc !== 0 && e1Wc !== 1 || e2Wc !== 0 && e2Wc !== 1 || e1.PolyTyp !== e2.PolyTyp && this.m_ClipType !== ClipperLib.ClipType.ctXor) {
          this.AddLocalMaxPoly(e1, e2, pt);
        } else {
          this.AddOutPt(e1, pt);
          this.AddOutPt(e2, pt);
          ClipperLib.Clipper.SwapSides(e1, e2);
          ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
        }
      } else if (e1Contributing) {
        if (e2Wc === 0 || e2Wc === 1) {
          this.AddOutPt(e1, pt);
          ClipperLib.Clipper.SwapSides(e1, e2);
          ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
        }
      } else if (e2Contributing) {
        if (e1Wc === 0 || e1Wc === 1) {
          this.AddOutPt(e2, pt);
          ClipperLib.Clipper.SwapSides(e1, e2);
          ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
        }
      } else if ((e1Wc === 0 || e1Wc === 1) && (e2Wc === 0 || e2Wc === 1)) {
        var e1Wc2, e2Wc2;
        switch (e1FillType2) {
          case ClipperLib.PolyFillType.pftPositive:
            e1Wc2 = e1.WindCnt2;
            break;
          case ClipperLib.PolyFillType.pftNegative:
            e1Wc2 = -e1.WindCnt2;
            break;
          default:
            e1Wc2 = Math.abs(e1.WindCnt2);
            break;
        }
        switch (e2FillType2) {
          case ClipperLib.PolyFillType.pftPositive:
            e2Wc2 = e2.WindCnt2;
            break;
          case ClipperLib.PolyFillType.pftNegative:
            e2Wc2 = -e2.WindCnt2;
            break;
          default:
            e2Wc2 = Math.abs(e2.WindCnt2);
            break;
        }
        if (e1.PolyTyp !== e2.PolyTyp) {
          this.AddLocalMinPoly(e1, e2, pt);
        } else if (e1Wc === 1 && e2Wc === 1)
          switch (this.m_ClipType) {
            case ClipperLib.ClipType.ctIntersection:
              if (e1Wc2 > 0 && e2Wc2 > 0)
                this.AddLocalMinPoly(e1, e2, pt);
              break;
            case ClipperLib.ClipType.ctUnion:
              if (e1Wc2 <= 0 && e2Wc2 <= 0)
                this.AddLocalMinPoly(e1, e2, pt);
              break;
            case ClipperLib.ClipType.ctDifference:
              if (e1.PolyTyp === ClipperLib.PolyType.ptClip && e1Wc2 > 0 && e2Wc2 > 0 || e1.PolyTyp === ClipperLib.PolyType.ptSubject && e1Wc2 <= 0 && e2Wc2 <= 0)
                this.AddLocalMinPoly(e1, e2, pt);
              break;
            case ClipperLib.ClipType.ctXor:
              this.AddLocalMinPoly(e1, e2, pt);
              break;
          }
        else
          ClipperLib.Clipper.SwapSides(e1, e2);
      }
    };
    ClipperLib.Clipper.prototype.DeleteFromSEL = function(e) {
      var SelPrev = e.PrevInSEL;
      var SelNext = e.NextInSEL;
      if (SelPrev === null && SelNext === null && e !== this.m_SortedEdges)
        return;
      if (SelPrev !== null)
        SelPrev.NextInSEL = SelNext;
      else
        this.m_SortedEdges = SelNext;
      if (SelNext !== null)
        SelNext.PrevInSEL = SelPrev;
      e.NextInSEL = null;
      e.PrevInSEL = null;
    };
    ClipperLib.Clipper.prototype.ProcessHorizontals = function() {
      var horzEdge = {};
      while (this.PopEdgeFromSEL(horzEdge)) {
        this.ProcessHorizontal(horzEdge.v);
      }
    };
    ClipperLib.Clipper.prototype.GetHorzDirection = function(HorzEdge, $var) {
      if (HorzEdge.Bot.X < HorzEdge.Top.X) {
        $var.Left = HorzEdge.Bot.X;
        $var.Right = HorzEdge.Top.X;
        $var.Dir = ClipperLib.Direction.dLeftToRight;
      } else {
        $var.Left = HorzEdge.Top.X;
        $var.Right = HorzEdge.Bot.X;
        $var.Dir = ClipperLib.Direction.dRightToLeft;
      }
    };
    ClipperLib.Clipper.prototype.ProcessHorizontal = function(horzEdge) {
      var $var = {
        Dir: null,
        Left: null,
        Right: null
      };
      this.GetHorzDirection(horzEdge, $var);
      var dir = $var.Dir;
      var horzLeft = $var.Left;
      var horzRight = $var.Right;
      var IsOpen = horzEdge.WindDelta === 0;
      var eLastHorz = horzEdge, eMaxPair = null;
      while (eLastHorz.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(eLastHorz.NextInLML))
        eLastHorz = eLastHorz.NextInLML;
      if (eLastHorz.NextInLML === null)
        eMaxPair = this.GetMaximaPair(eLastHorz);
      var currMax = this.m_Maxima;
      if (currMax !== null) {
        if (dir === ClipperLib.Direction.dLeftToRight) {
          while (currMax !== null && currMax.X <= horzEdge.Bot.X) {
            currMax = currMax.Next;
          }
          if (currMax !== null && currMax.X >= eLastHorz.Top.X) {
            currMax = null;
          }
        } else {
          while (currMax.Next !== null && currMax.Next.X < horzEdge.Bot.X) {
            currMax = currMax.Next;
          }
          if (currMax.X <= eLastHorz.Top.X) {
            currMax = null;
          }
        }
      }
      var op1 = null;
      for (; ; ) {
        var IsLastHorz = horzEdge === eLastHorz;
        var e = this.GetNextInAEL(horzEdge, dir);
        while (e !== null) {
          if (currMax !== null) {
            if (dir === ClipperLib.Direction.dLeftToRight) {
              while (currMax !== null && currMax.X < e.Curr.X) {
                if (horzEdge.OutIdx >= 0 && !IsOpen) {
                  this.AddOutPt(horzEdge, new ClipperLib.IntPoint2(currMax.X, horzEdge.Bot.Y));
                }
                currMax = currMax.Next;
              }
            } else {
              while (currMax !== null && currMax.X > e.Curr.X) {
                if (horzEdge.OutIdx >= 0 && !IsOpen) {
                  this.AddOutPt(horzEdge, new ClipperLib.IntPoint2(currMax.X, horzEdge.Bot.Y));
                }
                currMax = currMax.Prev;
              }
            }
          }
          if (dir === ClipperLib.Direction.dLeftToRight && e.Curr.X > horzRight || dir === ClipperLib.Direction.dRightToLeft && e.Curr.X < horzLeft) {
            break;
          }
          if (e.Curr.X === horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx)
            break;
          if (horzEdge.OutIdx >= 0 && !IsOpen) {
            if (ClipperLib.use_xyz) {
              if (dir === ClipperLib.Direction.dLeftToRight)
                this.SetZ(e.Curr, horzEdge, e);
              else
                this.SetZ(e.Curr, e, horzEdge);
            }
            op1 = this.AddOutPt(horzEdge, e.Curr);
            var eNextHorz = this.m_SortedEdges;
            while (eNextHorz !== null) {
              if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
                var op2 = this.GetLastOutPt(eNextHorz);
                this.AddJoin(op2, op1, eNextHorz.Top);
              }
              eNextHorz = eNextHorz.NextInSEL;
            }
            this.AddGhostJoin(op1, horzEdge.Bot);
          }
          if (e === eMaxPair && IsLastHorz) {
            if (horzEdge.OutIdx >= 0) {
              this.AddLocalMaxPoly(horzEdge, eMaxPair, horzEdge.Top);
            }
            this.DeleteFromAEL(horzEdge);
            this.DeleteFromAEL(eMaxPair);
            return;
          }
          if (dir === ClipperLib.Direction.dLeftToRight) {
            var Pt = new ClipperLib.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
            this.IntersectEdges(horzEdge, e, Pt);
          } else {
            var Pt = new ClipperLib.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
            this.IntersectEdges(e, horzEdge, Pt);
          }
          var eNext = this.GetNextInAEL(e, dir);
          this.SwapPositionsInAEL(horzEdge, e);
          e = eNext;
        }
        if (horzEdge.NextInLML === null || !ClipperLib.ClipperBase.IsHorizontal(horzEdge.NextInLML)) {
          break;
        }
        horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
        if (horzEdge.OutIdx >= 0) {
          this.AddOutPt(horzEdge, horzEdge.Bot);
        }
        $var = {
          Dir: dir,
          Left: horzLeft,
          Right: horzRight
        };
        this.GetHorzDirection(horzEdge, $var);
        dir = $var.Dir;
        horzLeft = $var.Left;
        horzRight = $var.Right;
      }
      if (horzEdge.OutIdx >= 0 && op1 === null) {
        op1 = this.GetLastOutPt(horzEdge);
        var eNextHorz = this.m_SortedEdges;
        while (eNextHorz !== null) {
          if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
            var op2 = this.GetLastOutPt(eNextHorz);
            this.AddJoin(op2, op1, eNextHorz.Top);
          }
          eNextHorz = eNextHorz.NextInSEL;
        }
        this.AddGhostJoin(op1, horzEdge.Top);
      }
      if (horzEdge.NextInLML !== null) {
        if (horzEdge.OutIdx >= 0) {
          op1 = this.AddOutPt(horzEdge, horzEdge.Top);
          horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
          if (horzEdge.WindDelta === 0) {
            return;
          }
          var ePrev = horzEdge.PrevInAEL;
          var eNext = horzEdge.NextInAEL;
          if (ePrev !== null && ePrev.Curr.X === horzEdge.Bot.X && ePrev.Curr.Y === horzEdge.Bot.Y && ePrev.WindDelta === 0 && (ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y && ClipperLib.ClipperBase.SlopesEqual3(horzEdge, ePrev, this.m_UseFullRange))) {
            var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
            this.AddJoin(op1, op2, horzEdge.Top);
          } else if (eNext !== null && eNext.Curr.X === horzEdge.Bot.X && eNext.Curr.Y === horzEdge.Bot.Y && eNext.WindDelta !== 0 && eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y && ClipperLib.ClipperBase.SlopesEqual3(horzEdge, eNext, this.m_UseFullRange)) {
            var op2 = this.AddOutPt(eNext, horzEdge.Bot);
            this.AddJoin(op1, op2, horzEdge.Top);
          }
        } else {
          horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
        }
      } else {
        if (horzEdge.OutIdx >= 0) {
          this.AddOutPt(horzEdge, horzEdge.Top);
        }
        this.DeleteFromAEL(horzEdge);
      }
    };
    ClipperLib.Clipper.prototype.GetNextInAEL = function(e, Direction) {
      return Direction === ClipperLib.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
    };
    ClipperLib.Clipper.prototype.IsMinima = function(e) {
      return e !== null && e.Prev.NextInLML !== e && e.Next.NextInLML !== e;
    };
    ClipperLib.Clipper.prototype.IsMaxima = function(e, Y) {
      return e !== null && e.Top.Y === Y && e.NextInLML === null;
    };
    ClipperLib.Clipper.prototype.IsIntermediate = function(e, Y) {
      return e.Top.Y === Y && e.NextInLML !== null;
    };
    ClipperLib.Clipper.prototype.GetMaximaPair = function(e) {
      if (ClipperLib.IntPoint.op_Equality(e.Next.Top, e.Top) && e.Next.NextInLML === null) {
        return e.Next;
      } else {
        if (ClipperLib.IntPoint.op_Equality(e.Prev.Top, e.Top) && e.Prev.NextInLML === null) {
          return e.Prev;
        } else {
          return null;
        }
      }
    };
    ClipperLib.Clipper.prototype.GetMaximaPairEx = function(e) {
      var result = this.GetMaximaPair(e);
      if (result === null || result.OutIdx === ClipperLib.ClipperBase.Skip || result.NextInAEL === result.PrevInAEL && !ClipperLib.ClipperBase.IsHorizontal(result)) {
        return null;
      }
      return result;
    };
    ClipperLib.Clipper.prototype.ProcessIntersections = function(topY) {
      if (this.m_ActiveEdges === null)
        return true;
      try {
        this.BuildIntersectList(topY);
        if (this.m_IntersectList.length === 0)
          return true;
        if (this.m_IntersectList.length === 1 || this.FixupIntersectionOrder())
          this.ProcessIntersectList();
        else
          return false;
      } catch ($$e2) {
        this.m_SortedEdges = null;
        this.m_IntersectList.length = 0;
        ClipperLib.Error("ProcessIntersections error");
      }
      this.m_SortedEdges = null;
      return true;
    };
    ClipperLib.Clipper.prototype.BuildIntersectList = function(topY) {
      if (this.m_ActiveEdges === null)
        return;
      var e = this.m_ActiveEdges;
      this.m_SortedEdges = e;
      while (e !== null) {
        e.PrevInSEL = e.PrevInAEL;
        e.NextInSEL = e.NextInAEL;
        e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
        e = e.NextInAEL;
      }
      var isModified = true;
      while (isModified && this.m_SortedEdges !== null) {
        isModified = false;
        e = this.m_SortedEdges;
        while (e.NextInSEL !== null) {
          var eNext = e.NextInSEL;
          var pt = new ClipperLib.IntPoint0();
          if (e.Curr.X > eNext.Curr.X) {
            this.IntersectPoint(e, eNext, pt);
            if (pt.Y < topY) {
              pt = new ClipperLib.IntPoint2(ClipperLib.Clipper.TopX(e, topY), topY);
            }
            var newNode = new ClipperLib.IntersectNode();
            newNode.Edge1 = e;
            newNode.Edge2 = eNext;
            newNode.Pt.X = pt.X;
            newNode.Pt.Y = pt.Y;
            if (ClipperLib.use_xyz)
              newNode.Pt.Z = pt.Z;
            this.m_IntersectList.push(newNode);
            this.SwapPositionsInSEL(e, eNext);
            isModified = true;
          } else
            e = eNext;
        }
        if (e.PrevInSEL !== null)
          e.PrevInSEL.NextInSEL = null;
        else
          break;
      }
      this.m_SortedEdges = null;
    };
    ClipperLib.Clipper.prototype.EdgesAdjacent = function(inode) {
      return inode.Edge1.NextInSEL === inode.Edge2 || inode.Edge1.PrevInSEL === inode.Edge2;
    };
    ClipperLib.Clipper.IntersectNodeSort = function(node1, node2) {
      return node2.Pt.Y - node1.Pt.Y;
    };
    ClipperLib.Clipper.prototype.FixupIntersectionOrder = function() {
      this.m_IntersectList.sort(this.m_IntersectNodeComparer);
      this.CopyAELToSEL();
      var cnt = this.m_IntersectList.length;
      for (var i = 0; i < cnt; i++) {
        if (!this.EdgesAdjacent(this.m_IntersectList[i])) {
          var j = i + 1;
          while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j]))
            j++;
          if (j === cnt)
            return false;
          var tmp = this.m_IntersectList[i];
          this.m_IntersectList[i] = this.m_IntersectList[j];
          this.m_IntersectList[j] = tmp;
        }
        this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
      }
      return true;
    };
    ClipperLib.Clipper.prototype.ProcessIntersectList = function() {
      for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++) {
        var iNode = this.m_IntersectList[i];
        this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt);
        this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
      }
      this.m_IntersectList.length = 0;
    };
    var R1 = function(a) {
      return a < 0 ? Math.ceil(a - 0.5) : Math.round(a);
    };
    var R2 = function(a) {
      return a < 0 ? Math.ceil(a - 0.5) : Math.floor(a + 0.5);
    };
    var R3 = function(a) {
      return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a);
    };
    var R4 = function(a) {
      if (a < 0) {
        a -= 0.5;
        return a < -2147483648 ? Math.ceil(a) : a | 0;
      } else {
        a += 0.5;
        return a > 2147483647 ? Math.floor(a) : a | 0;
      }
    };
    if (browser.msie)
      ClipperLib.Clipper.Round = R1;
    else if (browser.chromium)
      ClipperLib.Clipper.Round = R3;
    else if (browser.safari)
      ClipperLib.Clipper.Round = R4;
    else
      ClipperLib.Clipper.Round = R2;
    ClipperLib.Clipper.TopX = function(edge, currentY) {
      if (currentY === edge.Top.Y)
        return edge.Top.X;
      return edge.Bot.X + ClipperLib.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
    };
    ClipperLib.Clipper.prototype.IntersectPoint = function(edge1, edge2, ip) {
      ip.X = 0;
      ip.Y = 0;
      var b1, b2;
      if (edge1.Dx === edge2.Dx) {
        ip.Y = edge1.Curr.Y;
        ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
        return;
      }
      if (edge1.Delta.X === 0) {
        ip.X = edge1.Bot.X;
        if (ClipperLib.ClipperBase.IsHorizontal(edge2)) {
          ip.Y = edge2.Bot.Y;
        } else {
          b2 = edge2.Bot.Y - edge2.Bot.X / edge2.Dx;
          ip.Y = ClipperLib.Clipper.Round(ip.X / edge2.Dx + b2);
        }
      } else if (edge2.Delta.X === 0) {
        ip.X = edge2.Bot.X;
        if (ClipperLib.ClipperBase.IsHorizontal(edge1)) {
          ip.Y = edge1.Bot.Y;
        } else {
          b1 = edge1.Bot.Y - edge1.Bot.X / edge1.Dx;
          ip.Y = ClipperLib.Clipper.Round(ip.X / edge1.Dx + b1);
        }
      } else {
        b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
        b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
        var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
        ip.Y = ClipperLib.Clipper.Round(q);
        if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
          ip.X = ClipperLib.Clipper.Round(edge1.Dx * q + b1);
        else
          ip.X = ClipperLib.Clipper.Round(edge2.Dx * q + b2);
      }
      if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y) {
        if (edge1.Top.Y > edge2.Top.Y) {
          ip.Y = edge1.Top.Y;
          ip.X = ClipperLib.Clipper.TopX(edge2, edge1.Top.Y);
          return ip.X < edge1.Top.X;
        } else
          ip.Y = edge2.Top.Y;
        if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
          ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
        else
          ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
      }
      if (ip.Y > edge1.Curr.Y) {
        ip.Y = edge1.Curr.Y;
        if (Math.abs(edge1.Dx) > Math.abs(edge2.Dx))
          ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
        else
          ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
      }
    };
    ClipperLib.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function(topY) {
      var e = this.m_ActiveEdges;
      while (e !== null) {
        var IsMaximaEdge = this.IsMaxima(e, topY);
        if (IsMaximaEdge) {
          var eMaxPair = this.GetMaximaPairEx(e);
          IsMaximaEdge = eMaxPair === null || !ClipperLib.ClipperBase.IsHorizontal(eMaxPair);
        }
        if (IsMaximaEdge) {
          if (this.StrictlySimple) {
            this.InsertMaxima(e.Top.X);
          }
          var ePrev = e.PrevInAEL;
          this.DoMaxima(e);
          if (ePrev === null)
            e = this.m_ActiveEdges;
          else
            e = ePrev.NextInAEL;
        } else {
          if (this.IsIntermediate(e, topY) && ClipperLib.ClipperBase.IsHorizontal(e.NextInLML)) {
            e = this.UpdateEdgeIntoAEL(e);
            if (e.OutIdx >= 0)
              this.AddOutPt(e, e.Bot);
            this.AddEdgeToSEL(e);
          } else {
            e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
            e.Curr.Y = topY;
          }
          if (ClipperLib.use_xyz) {
            if (e.Top.Y === topY)
              e.Curr.Z = e.Top.Z;
            else if (e.Bot.Y === topY)
              e.Curr.Z = e.Bot.Z;
            else
              e.Curr.Z = 0;
          }
          if (this.StrictlySimple) {
            var ePrev = e.PrevInAEL;
            if (e.OutIdx >= 0 && e.WindDelta !== 0 && ePrev !== null && ePrev.OutIdx >= 0 && ePrev.Curr.X === e.Curr.X && ePrev.WindDelta !== 0) {
              var ip = new ClipperLib.IntPoint1(e.Curr);
              if (ClipperLib.use_xyz) {
                this.SetZ(ip, ePrev, e);
              }
              var op = this.AddOutPt(ePrev, ip);
              var op2 = this.AddOutPt(e, ip);
              this.AddJoin(op, op2, ip);
            }
          }
          e = e.NextInAEL;
        }
      }
      this.ProcessHorizontals();
      this.m_Maxima = null;
      e = this.m_ActiveEdges;
      while (e !== null) {
        if (this.IsIntermediate(e, topY)) {
          var op = null;
          if (e.OutIdx >= 0)
            op = this.AddOutPt(e, e.Top);
          e = this.UpdateEdgeIntoAEL(e);
          var ePrev = e.PrevInAEL;
          var eNext = e.NextInAEL;
          if (ePrev !== null && ePrev.Curr.X === e.Bot.X && ePrev.Curr.Y === e.Bot.Y && op !== null && ePrev.OutIdx >= 0 && ePrev.Curr.Y === ePrev.Top.Y && ClipperLib.ClipperBase.SlopesEqual5(e.Curr, e.Top, ePrev.Curr, ePrev.Top, this.m_UseFullRange) && e.WindDelta !== 0 && ePrev.WindDelta !== 0) {
            var op2 = this.AddOutPt(ePrev2, e.Bot);
            this.AddJoin(op, op2, e.Top);
          } else if (eNext !== null && eNext.Curr.X === e.Bot.X && eNext.Curr.Y === e.Bot.Y && op !== null && eNext.OutIdx >= 0 && eNext.Curr.Y === eNext.Top.Y && ClipperLib.ClipperBase.SlopesEqual5(e.Curr, e.Top, eNext.Curr, eNext.Top, this.m_UseFullRange) && e.WindDelta !== 0 && eNext.WindDelta !== 0) {
            var op2 = this.AddOutPt(eNext, e.Bot);
            this.AddJoin(op, op2, e.Top);
          }
        }
        e = e.NextInAEL;
      }
    };
    ClipperLib.Clipper.prototype.DoMaxima = function(e) {
      var eMaxPair = this.GetMaximaPairEx(e);
      if (eMaxPair === null) {
        if (e.OutIdx >= 0)
          this.AddOutPt(e, e.Top);
        this.DeleteFromAEL(e);
        return;
      }
      var eNext = e.NextInAEL;
      while (eNext !== null && eNext !== eMaxPair) {
        this.IntersectEdges(e, eNext, e.Top);
        this.SwapPositionsInAEL(e, eNext);
        eNext = e.NextInAEL;
      }
      if (e.OutIdx === -1 && eMaxPair.OutIdx === -1) {
        this.DeleteFromAEL(e);
        this.DeleteFromAEL(eMaxPair);
      } else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0) {
        if (e.OutIdx >= 0)
          this.AddLocalMaxPoly(e, eMaxPair, e.Top);
        this.DeleteFromAEL(e);
        this.DeleteFromAEL(eMaxPair);
      } else if (ClipperLib.use_lines && e.WindDelta === 0) {
        if (e.OutIdx >= 0) {
          this.AddOutPt(e, e.Top);
          e.OutIdx = ClipperLib.ClipperBase.Unassigned;
        }
        this.DeleteFromAEL(e);
        if (eMaxPair.OutIdx >= 0) {
          this.AddOutPt(eMaxPair, e.Top);
          eMaxPair.OutIdx = ClipperLib.ClipperBase.Unassigned;
        }
        this.DeleteFromAEL(eMaxPair);
      } else
        ClipperLib.Error("DoMaxima error");
    };
    ClipperLib.Clipper.ReversePaths = function(polys) {
      for (var i = 0, len = polys.length; i < len; i++)
        polys[i].reverse();
    };
    ClipperLib.Clipper.Orientation = function(poly) {
      return ClipperLib.Clipper.Area(poly) >= 0;
    };
    ClipperLib.Clipper.prototype.PointCount = function(pts) {
      if (pts === null)
        return 0;
      var result = 0;
      var p = pts;
      do {
        result++;
        p = p.Next;
      } while (p !== pts);
      return result;
    };
    ClipperLib.Clipper.prototype.BuildResult = function(polyg) {
      ClipperLib.Clear(polyg);
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
        var outRec = this.m_PolyOuts[i];
        if (outRec.Pts === null)
          continue;
        var p = outRec.Pts.Prev;
        var cnt = this.PointCount(p);
        if (cnt < 2)
          continue;
        var pg = new Array(cnt);
        for (var j = 0; j < cnt; j++) {
          pg[j] = p.Pt;
          p = p.Prev;
        }
        polyg.push(pg);
      }
    };
    ClipperLib.Clipper.prototype.BuildResult2 = function(polytree) {
      polytree.Clear();
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
        var outRec = this.m_PolyOuts[i];
        var cnt = this.PointCount(outRec.Pts);
        if (outRec.IsOpen && cnt < 2 || !outRec.IsOpen && cnt < 3)
          continue;
        this.FixHoleLinkage(outRec);
        var pn = new ClipperLib.PolyNode();
        polytree.m_AllPolys.push(pn);
        outRec.PolyNode = pn;
        pn.m_polygon.length = cnt;
        var op = outRec.Pts.Prev;
        for (var j = 0; j < cnt; j++) {
          pn.m_polygon[j] = op.Pt;
          op = op.Prev;
        }
      }
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
        var outRec = this.m_PolyOuts[i];
        if (outRec.PolyNode === null)
          continue;
        else if (outRec.IsOpen) {
          outRec.PolyNode.IsOpen = true;
          polytree.AddChild(outRec.PolyNode);
        } else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode !== null)
          outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
        else
          polytree.AddChild(outRec.PolyNode);
      }
    };
    ClipperLib.Clipper.prototype.FixupOutPolyline = function(outRec) {
      var pp = outRec.Pts;
      var lastPP = pp.Prev;
      while (pp !== lastPP) {
        pp = pp.Next;
        if (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) {
          if (pp === lastPP) {
            lastPP = pp.Prev;
          }
          var tmpPP = pp.Prev;
          tmpPP.Next = pp.Next;
          pp.Next.Prev = tmpPP;
          pp = tmpPP;
        }
      }
      if (pp === pp.Prev) {
        outRec.Pts = null;
      }
    };
    ClipperLib.Clipper.prototype.FixupOutPolygon = function(outRec) {
      var lastOK = null;
      outRec.BottomPt = null;
      var pp = outRec.Pts;
      var preserveCol = this.PreserveCollinear || this.StrictlySimple;
      for (; ; ) {
        if (pp.Prev === pp || pp.Prev === pp.Next) {
          outRec.Pts = null;
          return;
        }
        if (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Next.Pt) || ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt) || ClipperLib.ClipperBase.SlopesEqual4(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) && (!preserveCol || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))) {
          lastOK = null;
          pp.Prev.Next = pp.Next;
          pp.Next.Prev = pp.Prev;
          pp = pp.Prev;
        } else if (pp === lastOK)
          break;
        else {
          if (lastOK === null)
            lastOK = pp;
          pp = pp.Next;
        }
      }
      outRec.Pts = pp;
    };
    ClipperLib.Clipper.prototype.DupOutPt = function(outPt, InsertAfter) {
      var result = new ClipperLib.OutPt();
      result.Pt.X = outPt.Pt.X;
      result.Pt.Y = outPt.Pt.Y;
      if (ClipperLib.use_xyz)
        result.Pt.Z = outPt.Pt.Z;
      result.Idx = outPt.Idx;
      if (InsertAfter) {
        result.Next = outPt.Next;
        result.Prev = outPt;
        outPt.Next.Prev = result;
        outPt.Next = result;
      } else {
        result.Prev = outPt.Prev;
        result.Next = outPt;
        outPt.Prev.Next = result;
        outPt.Prev = result;
      }
      return result;
    };
    ClipperLib.Clipper.prototype.GetOverlap = function(a1, a2, b1, b2, $val) {
      if (a1 < a2) {
        if (b1 < b2) {
          $val.Left = Math.max(a1, b1);
          $val.Right = Math.min(a2, b2);
        } else {
          $val.Left = Math.max(a1, b2);
          $val.Right = Math.min(a2, b1);
        }
      } else {
        if (b1 < b2) {
          $val.Left = Math.max(a2, b1);
          $val.Right = Math.min(a1, b2);
        } else {
          $val.Left = Math.max(a2, b2);
          $val.Right = Math.min(a1, b1);
        }
      }
      return $val.Left < $val.Right;
    };
    ClipperLib.Clipper.prototype.JoinHorz = function(op1, op1b, op2, op2b, Pt, DiscardLeft) {
      var Dir1 = op1.Pt.X > op1b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight;
      var Dir2 = op2.Pt.X > op2b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight;
      if (Dir1 === Dir2)
        return false;
      if (Dir1 === ClipperLib.Direction.dLeftToRight) {
        while (op1.Next.Pt.X <= Pt.X && op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y === Pt.Y)
          op1 = op1.Next;
        if (DiscardLeft && op1.Pt.X !== Pt.X)
          op1 = op1.Next;
        op1b = this.DupOutPt(op1, !DiscardLeft);
        if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt)) {
          op1 = op1b;
          op1.Pt.X = Pt.X;
          op1.Pt.Y = Pt.Y;
          if (ClipperLib.use_xyz)
            op1.Pt.Z = Pt.Z;
          op1b = this.DupOutPt(op1, !DiscardLeft);
        }
      } else {
        while (op1.Next.Pt.X >= Pt.X && op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y === Pt.Y)
          op1 = op1.Next;
        if (!DiscardLeft && op1.Pt.X !== Pt.X)
          op1 = op1.Next;
        op1b = this.DupOutPt(op1, DiscardLeft);
        if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt)) {
          op1 = op1b;
          op1.Pt.X = Pt.X;
          op1.Pt.Y = Pt.Y;
          if (ClipperLib.use_xyz)
            op1.Pt.Z = Pt.Z;
          op1b = this.DupOutPt(op1, DiscardLeft);
        }
      }
      if (Dir2 === ClipperLib.Direction.dLeftToRight) {
        while (op2.Next.Pt.X <= Pt.X && op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y === Pt.Y)
          op2 = op2.Next;
        if (DiscardLeft && op2.Pt.X !== Pt.X)
          op2 = op2.Next;
        op2b = this.DupOutPt(op2, !DiscardLeft);
        if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt)) {
          op2 = op2b;
          op2.Pt.X = Pt.X;
          op2.Pt.Y = Pt.Y;
          if (ClipperLib.use_xyz)
            op2.Pt.Z = Pt.Z;
          op2b = this.DupOutPt(op2, !DiscardLeft);
        }
      } else {
        while (op2.Next.Pt.X >= Pt.X && op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y === Pt.Y)
          op2 = op2.Next;
        if (!DiscardLeft && op2.Pt.X !== Pt.X)
          op2 = op2.Next;
        op2b = this.DupOutPt(op2, DiscardLeft);
        if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt)) {
          op2 = op2b;
          op2.Pt.X = Pt.X;
          op2.Pt.Y = Pt.Y;
          if (ClipperLib.use_xyz)
            op2.Pt.Z = Pt.Z;
          op2b = this.DupOutPt(op2, DiscardLeft);
        }
      }
      if (Dir1 === ClipperLib.Direction.dLeftToRight === DiscardLeft) {
        op1.Prev = op2;
        op2.Next = op1;
        op1b.Next = op2b;
        op2b.Prev = op1b;
      } else {
        op1.Next = op2;
        op2.Prev = op1;
        op1b.Prev = op2b;
        op2b.Next = op1b;
      }
      return true;
    };
    ClipperLib.Clipper.prototype.JoinPoints = function(j, outRec1, outRec2) {
      var op1 = j.OutPt1, op1b = new ClipperLib.OutPt();
      var op2 = j.OutPt2, op2b = new ClipperLib.OutPt();
      var isHorizontal = j.OutPt1.Pt.Y === j.OffPt.Y;
      if (isHorizontal && ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt) && ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)) {
        if (outRec1 !== outRec2)
          return false;
        op1b = j.OutPt1.Next;
        while (op1b !== op1 && ClipperLib.IntPoint.op_Equality(op1b.Pt, j.OffPt))
          op1b = op1b.Next;
        var reverse1 = op1b.Pt.Y > j.OffPt.Y;
        op2b = j.OutPt2.Next;
        while (op2b !== op2 && ClipperLib.IntPoint.op_Equality(op2b.Pt, j.OffPt))
          op2b = op2b.Next;
        var reverse2 = op2b.Pt.Y > j.OffPt.Y;
        if (reverse1 === reverse2)
          return false;
        if (reverse1) {
          op1b = this.DupOutPt(op1, false);
          op2b = this.DupOutPt(op2, true);
          op1.Prev = op2;
          op2.Next = op1;
          op1b.Next = op2b;
          op2b.Prev = op1b;
          j.OutPt1 = op1;
          j.OutPt2 = op1b;
          return true;
        } else {
          op1b = this.DupOutPt(op1, true);
          op2b = this.DupOutPt(op2, false);
          op1.Next = op2;
          op2.Prev = op1;
          op1b.Prev = op2b;
          op2b.Next = op1b;
          j.OutPt1 = op1;
          j.OutPt2 = op1b;
          return true;
        }
      } else if (isHorizontal) {
        op1b = op1;
        while (op1.Prev.Pt.Y === op1.Pt.Y && op1.Prev !== op1b && op1.Prev !== op2)
          op1 = op1.Prev;
        while (op1b.Next.Pt.Y === op1b.Pt.Y && op1b.Next !== op1 && op1b.Next !== op2)
          op1b = op1b.Next;
        if (op1b.Next === op1 || op1b.Next === op2)
          return false;
        op2b = op2;
        while (op2.Prev.Pt.Y === op2.Pt.Y && op2.Prev !== op2b && op2.Prev !== op1b)
          op2 = op2.Prev;
        while (op2b.Next.Pt.Y === op2b.Pt.Y && op2b.Next !== op2 && op2b.Next !== op1)
          op2b = op2b.Next;
        if (op2b.Next === op2 || op2b.Next === op1)
          return false;
        var $val = {
          Left: null,
          Right: null
        };
        if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val))
          return false;
        var Left = $val.Left;
        var Right = $val.Right;
        var Pt = new ClipperLib.IntPoint0();
        var DiscardLeftSide;
        if (op1.Pt.X >= Left && op1.Pt.X <= Right) {
          Pt.X = op1.Pt.X;
          Pt.Y = op1.Pt.Y;
          if (ClipperLib.use_xyz)
            Pt.Z = op1.Pt.Z;
          DiscardLeftSide = op1.Pt.X > op1b.Pt.X;
        } else if (op2.Pt.X >= Left && op2.Pt.X <= Right) {
          Pt.X = op2.Pt.X;
          Pt.Y = op2.Pt.Y;
          if (ClipperLib.use_xyz)
            Pt.Z = op2.Pt.Z;
          DiscardLeftSide = op2.Pt.X > op2b.Pt.X;
        } else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right) {
          Pt.X = op1b.Pt.X;
          Pt.Y = op1b.Pt.Y;
          if (ClipperLib.use_xyz)
            Pt.Z = op1b.Pt.Z;
          DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
        } else {
          Pt.X = op2b.Pt.X;
          Pt.Y = op2b.Pt.Y;
          if (ClipperLib.use_xyz)
            Pt.Z = op2b.Pt.Z;
          DiscardLeftSide = op2b.Pt.X > op2.Pt.X;
        }
        j.OutPt1 = op1;
        j.OutPt2 = op2;
        return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
      } else {
        op1b = op1.Next;
        while (ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1)
          op1b = op1b.Next;
        var Reverse1 = op1b.Pt.Y > op1.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange);
        if (Reverse1) {
          op1b = op1.Prev;
          while (ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1)
            op1b = op1b.Prev;
          if (op1b.Pt.Y > op1.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange))
            return false;
        }
        op2b = op2.Next;
        while (ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2)
          op2b = op2b.Next;
        var Reverse2 = op2b.Pt.Y > op2.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange);
        if (Reverse2) {
          op2b = op2.Prev;
          while (ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2)
            op2b = op2b.Prev;
          if (op2b.Pt.Y > op2.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange))
            return false;
        }
        if (op1b === op1 || op2b === op2 || op1b === op2b || outRec1 === outRec2 && Reverse1 === Reverse2)
          return false;
        if (Reverse1) {
          op1b = this.DupOutPt(op1, false);
          op2b = this.DupOutPt(op2, true);
          op1.Prev = op2;
          op2.Next = op1;
          op1b.Next = op2b;
          op2b.Prev = op1b;
          j.OutPt1 = op1;
          j.OutPt2 = op1b;
          return true;
        } else {
          op1b = this.DupOutPt(op1, true);
          op2b = this.DupOutPt(op2, false);
          op1.Next = op2;
          op2.Prev = op1;
          op1b.Prev = op2b;
          op2b.Next = op1b;
          j.OutPt1 = op1;
          j.OutPt2 = op1b;
          return true;
        }
      }
    };
    ClipperLib.Clipper.GetBounds = function(paths) {
      var i = 0, cnt = paths.length;
      while (i < cnt && paths[i].length === 0)
        i++;
      if (i === cnt)
        return new ClipperLib.IntRect(0, 0, 0, 0);
      var result = new ClipperLib.IntRect();
      result.left = paths[i][0].X;
      result.right = result.left;
      result.top = paths[i][0].Y;
      result.bottom = result.top;
      for (; i < cnt; i++)
        for (var j = 0, jlen = paths[i].length; j < jlen; j++) {
          if (paths[i][j].X < result.left)
            result.left = paths[i][j].X;
          else if (paths[i][j].X > result.right)
            result.right = paths[i][j].X;
          if (paths[i][j].Y < result.top)
            result.top = paths[i][j].Y;
          else if (paths[i][j].Y > result.bottom)
            result.bottom = paths[i][j].Y;
        }
      return result;
    };
    ClipperLib.Clipper.prototype.GetBounds2 = function(ops) {
      var opStart = ops;
      var result = new ClipperLib.IntRect();
      result.left = ops.Pt.X;
      result.right = ops.Pt.X;
      result.top = ops.Pt.Y;
      result.bottom = ops.Pt.Y;
      ops = ops.Next;
      while (ops !== opStart) {
        if (ops.Pt.X < result.left)
          result.left = ops.Pt.X;
        if (ops.Pt.X > result.right)
          result.right = ops.Pt.X;
        if (ops.Pt.Y < result.top)
          result.top = ops.Pt.Y;
        if (ops.Pt.Y > result.bottom)
          result.bottom = ops.Pt.Y;
        ops = ops.Next;
      }
      return result;
    };
    ClipperLib.Clipper.PointInPolygon = function(pt, path2) {
      var result = 0, cnt = path2.length;
      if (cnt < 3)
        return 0;
      var ip = path2[0];
      for (var i = 1; i <= cnt; ++i) {
        var ipNext = i === cnt ? path2[0] : path2[i];
        if (ipNext.Y === pt.Y) {
          if (ipNext.X === pt.X || ip.Y === pt.Y && ipNext.X > pt.X === ip.X < pt.X)
            return -1;
        }
        if (ip.Y < pt.Y !== ipNext.Y < pt.Y) {
          if (ip.X >= pt.X) {
            if (ipNext.X > pt.X)
              result = 1 - result;
            else {
              var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
              if (d === 0)
                return -1;
              else if (d > 0 === ipNext.Y > ip.Y)
                result = 1 - result;
            }
          } else {
            if (ipNext.X > pt.X) {
              var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
              if (d === 0)
                return -1;
              else if (d > 0 === ipNext.Y > ip.Y)
                result = 1 - result;
            }
          }
        }
        ip = ipNext;
      }
      return result;
    };
    ClipperLib.Clipper.prototype.PointInPolygon = function(pt, op) {
      var result = 0;
      var startOp = op;
      var ptx = pt.X, pty = pt.Y;
      var poly0x = op.Pt.X, poly0y = op.Pt.Y;
      do {
        op = op.Next;
        var poly1x = op.Pt.X, poly1y = op.Pt.Y;
        if (poly1y === pty) {
          if (poly1x === ptx || poly0y === pty && poly1x > ptx === poly0x < ptx)
            return -1;
        }
        if (poly0y < pty !== poly1y < pty) {
          if (poly0x >= ptx) {
            if (poly1x > ptx)
              result = 1 - result;
            else {
              var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
              if (d === 0)
                return -1;
              if (d > 0 === poly1y > poly0y)
                result = 1 - result;
            }
          } else {
            if (poly1x > ptx) {
              var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
              if (d === 0)
                return -1;
              if (d > 0 === poly1y > poly0y)
                result = 1 - result;
            }
          }
        }
        poly0x = poly1x;
        poly0y = poly1y;
      } while (startOp !== op);
      return result;
    };
    ClipperLib.Clipper.prototype.Poly2ContainsPoly1 = function(outPt1, outPt2) {
      var op = outPt1;
      do {
        var res = this.PointInPolygon(op.Pt, outPt2);
        if (res >= 0)
          return res > 0;
        op = op.Next;
      } while (op !== outPt1);
      return true;
    };
    ClipperLib.Clipper.prototype.FixupFirstLefts1 = function(OldOutRec, NewOutRec) {
      var outRec, firstLeft;
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
        outRec = this.m_PolyOuts[i];
        firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
        if (outRec.Pts !== null && firstLeft === OldOutRec) {
          if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts))
            outRec.FirstLeft = NewOutRec;
        }
      }
    };
    ClipperLib.Clipper.prototype.FixupFirstLefts2 = function(innerOutRec, outerOutRec) {
      var orfl = outerOutRec.FirstLeft;
      var outRec, firstLeft;
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
        outRec = this.m_PolyOuts[i];
        if (outRec.Pts === null || outRec === outerOutRec || outRec === innerOutRec)
          continue;
        firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
        if (firstLeft !== orfl && firstLeft !== innerOutRec && firstLeft !== outerOutRec)
          continue;
        if (this.Poly2ContainsPoly1(outRec.Pts, innerOutRec.Pts))
          outRec.FirstLeft = innerOutRec;
        else if (this.Poly2ContainsPoly1(outRec.Pts, outerOutRec.Pts))
          outRec.FirstLeft = outerOutRec;
        else if (outRec.FirstLeft === innerOutRec || outRec.FirstLeft === outerOutRec)
          outRec.FirstLeft = orfl;
      }
    };
    ClipperLib.Clipper.prototype.FixupFirstLefts3 = function(OldOutRec, NewOutRec) {
      var outRec;
      var firstLeft;
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
        outRec = this.m_PolyOuts[i];
        firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
        if (outRec.Pts !== null && firstLeft === OldOutRec)
          outRec.FirstLeft = NewOutRec;
      }
    };
    ClipperLib.Clipper.ParseFirstLeft = function(FirstLeft) {
      while (FirstLeft !== null && FirstLeft.Pts === null)
        FirstLeft = FirstLeft.FirstLeft;
      return FirstLeft;
    };
    ClipperLib.Clipper.prototype.JoinCommonEdges = function() {
      for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++) {
        var join = this.m_Joins[i];
        var outRec1 = this.GetOutRec(join.OutPt1.Idx);
        var outRec2 = this.GetOutRec(join.OutPt2.Idx);
        if (outRec1.Pts === null || outRec2.Pts === null)
          continue;
        if (outRec1.IsOpen || outRec2.IsOpen) {
          continue;
        }
        var holeStateRec;
        if (outRec1 === outRec2)
          holeStateRec = outRec1;
        else if (this.OutRec1RightOfOutRec2(outRec1, outRec2))
          holeStateRec = outRec2;
        else if (this.OutRec1RightOfOutRec2(outRec2, outRec1))
          holeStateRec = outRec1;
        else
          holeStateRec = this.GetLowermostRec(outRec1, outRec2);
        if (!this.JoinPoints(join, outRec1, outRec2))
          continue;
        if (outRec1 === outRec2) {
          outRec1.Pts = join.OutPt1;
          outRec1.BottomPt = null;
          outRec2 = this.CreateOutRec();
          outRec2.Pts = join.OutPt2;
          this.UpdateOutPtIdxs(outRec2);
          if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts)) {
            outRec2.IsHole = !outRec1.IsHole;
            outRec2.FirstLeft = outRec1;
            if (this.m_UsingPolyTree)
              this.FixupFirstLefts2(outRec2, outRec1);
            if ((outRec2.IsHole ^ this.ReverseSolution) == this.Area$1(outRec2) > 0)
              this.ReversePolyPtLinks(outRec2.Pts);
          } else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts)) {
            outRec2.IsHole = outRec1.IsHole;
            outRec1.IsHole = !outRec2.IsHole;
            outRec2.FirstLeft = outRec1.FirstLeft;
            outRec1.FirstLeft = outRec2;
            if (this.m_UsingPolyTree)
              this.FixupFirstLefts2(outRec1, outRec2);
            if ((outRec1.IsHole ^ this.ReverseSolution) == this.Area$1(outRec1) > 0)
              this.ReversePolyPtLinks(outRec1.Pts);
          } else {
            outRec2.IsHole = outRec1.IsHole;
            outRec2.FirstLeft = outRec1.FirstLeft;
            if (this.m_UsingPolyTree)
              this.FixupFirstLefts1(outRec1, outRec2);
          }
        } else {
          outRec2.Pts = null;
          outRec2.BottomPt = null;
          outRec2.Idx = outRec1.Idx;
          outRec1.IsHole = holeStateRec.IsHole;
          if (holeStateRec === outRec2)
            outRec1.FirstLeft = outRec2.FirstLeft;
          outRec2.FirstLeft = outRec1;
          if (this.m_UsingPolyTree)
            this.FixupFirstLefts3(outRec2, outRec1);
        }
      }
    };
    ClipperLib.Clipper.prototype.UpdateOutPtIdxs = function(outrec) {
      var op = outrec.Pts;
      do {
        op.Idx = outrec.Idx;
        op = op.Prev;
      } while (op !== outrec.Pts);
    };
    ClipperLib.Clipper.prototype.DoSimplePolygons = function() {
      var i = 0;
      while (i < this.m_PolyOuts.length) {
        var outrec = this.m_PolyOuts[i++];
        var op = outrec.Pts;
        if (op === null || outrec.IsOpen)
          continue;
        do {
          var op2 = op.Next;
          while (op2 !== outrec.Pts) {
            if (ClipperLib.IntPoint.op_Equality(op.Pt, op2.Pt) && op2.Next !== op && op2.Prev !== op) {
              var op3 = op.Prev;
              var op4 = op2.Prev;
              op.Prev = op4;
              op4.Next = op;
              op2.Prev = op3;
              op3.Next = op2;
              outrec.Pts = op;
              var outrec2 = this.CreateOutRec();
              outrec2.Pts = op2;
              this.UpdateOutPtIdxs(outrec2);
              if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts)) {
                outrec2.IsHole = !outrec.IsHole;
                outrec2.FirstLeft = outrec;
                if (this.m_UsingPolyTree)
                  this.FixupFirstLefts2(outrec2, outrec);
              } else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts)) {
                outrec2.IsHole = outrec.IsHole;
                outrec.IsHole = !outrec2.IsHole;
                outrec2.FirstLeft = outrec.FirstLeft;
                outrec.FirstLeft = outrec2;
                if (this.m_UsingPolyTree)
                  this.FixupFirstLefts2(outrec, outrec2);
              } else {
                outrec2.IsHole = outrec.IsHole;
                outrec2.FirstLeft = outrec.FirstLeft;
                if (this.m_UsingPolyTree)
                  this.FixupFirstLefts1(outrec, outrec2);
              }
              op2 = op;
            }
            op2 = op2.Next;
          }
          op = op.Next;
        } while (op !== outrec.Pts);
      }
    };
    ClipperLib.Clipper.Area = function(poly) {
      if (!Array.isArray(poly))
        return 0;
      var cnt = poly.length;
      if (cnt < 3)
        return 0;
      var a = 0;
      for (var i = 0, j = cnt - 1; i < cnt; ++i) {
        a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
        j = i;
      }
      return -a * 0.5;
    };
    ClipperLib.Clipper.prototype.Area = function(op) {
      var opFirst = op;
      if (op === null)
        return 0;
      var a = 0;
      do {
        a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
        op = op.Next;
      } while (op !== opFirst);
      return a * 0.5;
    };
    ClipperLib.Clipper.prototype.Area$1 = function(outRec) {
      return this.Area(outRec.Pts);
    };
    ClipperLib.Clipper.SimplifyPolygon = function(poly, fillType) {
      var result = new Array();
      var c = new ClipperLib.Clipper(0);
      c.StrictlySimple = true;
      c.AddPath(poly, ClipperLib.PolyType.ptSubject, true);
      c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
      return result;
    };
    ClipperLib.Clipper.SimplifyPolygons = function(polys, fillType) {
      if (typeof fillType === "undefined")
        fillType = ClipperLib.PolyFillType.pftEvenOdd;
      var result = new Array();
      var c = new ClipperLib.Clipper(0);
      c.StrictlySimple = true;
      c.AddPaths(polys, ClipperLib.PolyType.ptSubject, true);
      c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
      return result;
    };
    ClipperLib.Clipper.DistanceSqrd = function(pt1, pt2) {
      var dx = pt1.X - pt2.X;
      var dy = pt1.Y - pt2.Y;
      return dx * dx + dy * dy;
    };
    ClipperLib.Clipper.DistanceFromLineSqrd = function(pt, ln1, ln2) {
      var A = ln1.Y - ln2.Y;
      var B = ln2.X - ln1.X;
      var C = A * ln1.X + B * ln1.Y;
      C = A * pt.X + B * pt.Y - C;
      return C * C / (A * A + B * B);
    };
    ClipperLib.Clipper.SlopesNearCollinear = function(pt1, pt2, pt3, distSqrd) {
      if (Math.abs(pt1.X - pt2.X) > Math.abs(pt1.Y - pt2.Y)) {
        if (pt1.X > pt2.X === pt1.X < pt3.X)
          return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
        else if (pt2.X > pt1.X === pt2.X < pt3.X)
          return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
        else
          return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
      } else {
        if (pt1.Y > pt2.Y === pt1.Y < pt3.Y)
          return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
        else if (pt2.Y > pt1.Y === pt2.Y < pt3.Y)
          return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
        else
          return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
      }
    };
    ClipperLib.Clipper.PointsAreClose = function(pt1, pt2, distSqrd) {
      var dx = pt1.X - pt2.X;
      var dy = pt1.Y - pt2.Y;
      return dx * dx + dy * dy <= distSqrd;
    };
    ClipperLib.Clipper.ExcludeOp = function(op) {
      var result = op.Prev;
      result.Next = op.Next;
      op.Next.Prev = result;
      result.Idx = 0;
      return result;
    };
    ClipperLib.Clipper.CleanPolygon = function(path2, distance) {
      if (typeof distance === "undefined")
        distance = 1.415;
      var cnt = path2.length;
      if (cnt === 0)
        return new Array();
      var outPts = new Array(cnt);
      for (var i = 0; i < cnt; ++i)
        outPts[i] = new ClipperLib.OutPt();
      for (var i = 0; i < cnt; ++i) {
        outPts[i].Pt = path2[i];
        outPts[i].Next = outPts[(i + 1) % cnt];
        outPts[i].Next.Prev = outPts[i];
        outPts[i].Idx = 0;
      }
      var distSqrd = distance * distance;
      var op = outPts[0];
      while (op.Idx === 0 && op.Next !== op.Prev) {
        if (ClipperLib.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd)) {
          op = ClipperLib.Clipper.ExcludeOp(op);
          cnt--;
        } else if (ClipperLib.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd)) {
          ClipperLib.Clipper.ExcludeOp(op.Next);
          op = ClipperLib.Clipper.ExcludeOp(op);
          cnt -= 2;
        } else if (ClipperLib.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd)) {
          op = ClipperLib.Clipper.ExcludeOp(op);
          cnt--;
        } else {
          op.Idx = 1;
          op = op.Next;
        }
      }
      if (cnt < 3)
        cnt = 0;
      var result = new Array(cnt);
      for (var i = 0; i < cnt; ++i) {
        result[i] = new ClipperLib.IntPoint1(op.Pt);
        op = op.Next;
      }
      outPts = null;
      return result;
    };
    ClipperLib.Clipper.CleanPolygons = function(polys, distance) {
      var result = new Array(polys.length);
      for (var i = 0, ilen = polys.length; i < ilen; i++)
        result[i] = ClipperLib.Clipper.CleanPolygon(polys[i], distance);
      return result;
    };
    ClipperLib.Clipper.Minkowski = function(pattern, path2, IsSum, IsClosed) {
      var delta = IsClosed ? 1 : 0;
      var polyCnt = pattern.length;
      var pathCnt = path2.length;
      var result = new Array();
      if (IsSum)
        for (var i = 0; i < pathCnt; i++) {
          var p = new Array(polyCnt);
          for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
            p[j] = new ClipperLib.IntPoint2(path2[i].X + ip.X, path2[i].Y + ip.Y);
          result.push(p);
        }
      else
        for (var i = 0; i < pathCnt; i++) {
          var p = new Array(polyCnt);
          for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
            p[j] = new ClipperLib.IntPoint2(path2[i].X - ip.X, path2[i].Y - ip.Y);
          result.push(p);
        }
      var quads = new Array();
      for (var i = 0; i < pathCnt - 1 + delta; i++)
        for (var j = 0; j < polyCnt; j++) {
          var quad = new Array();
          quad.push(result[i % pathCnt][j % polyCnt]);
          quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
          quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
          quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
          if (!ClipperLib.Clipper.Orientation(quad))
            quad.reverse();
          quads.push(quad);
        }
      return quads;
    };
    ClipperLib.Clipper.MinkowskiSum = function(pattern, path_or_paths, pathIsClosed) {
      if (!(path_or_paths[0] instanceof Array)) {
        var path2 = path_or_paths;
        var paths = ClipperLib.Clipper.Minkowski(pattern, path2, true, pathIsClosed);
        var c = new ClipperLib.Clipper();
        c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
        c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
        return paths;
      } else {
        var paths = path_or_paths;
        var solution = new ClipperLib.Paths();
        var c = new ClipperLib.Clipper();
        for (var i = 0; i < paths.length; ++i) {
          var tmp = ClipperLib.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
          c.AddPaths(tmp, ClipperLib.PolyType.ptSubject, true);
          if (pathIsClosed) {
            var path2 = ClipperLib.Clipper.TranslatePath(paths[i], pattern[0]);
            c.AddPath(path2, ClipperLib.PolyType.ptClip, true);
          }
        }
        c.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
        return solution;
      }
    };
    ClipperLib.Clipper.TranslatePath = function(path2, delta) {
      var outPath = new ClipperLib.Path();
      for (var i = 0; i < path2.length; i++)
        outPath.push(new ClipperLib.IntPoint2(path2[i].X + delta.X, path2[i].Y + delta.Y));
      return outPath;
    };
    ClipperLib.Clipper.MinkowskiDiff = function(poly1, poly2) {
      var paths = ClipperLib.Clipper.Minkowski(poly1, poly2, false, true);
      var c = new ClipperLib.Clipper();
      c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
      c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
      return paths;
    };
    ClipperLib.Clipper.PolyTreeToPaths = function(polytree) {
      var result = new Array();
      ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntAny, result);
      return result;
    };
    ClipperLib.Clipper.AddPolyNodeToPaths = function(polynode, nt, paths) {
      var match = true;
      switch (nt) {
        case ClipperLib.Clipper.NodeType.ntOpen:
          return;
        case ClipperLib.Clipper.NodeType.ntClosed:
          match = !polynode.IsOpen;
          break;
      }
      if (polynode.m_polygon.length > 0 && match)
        paths.push(polynode.m_polygon);
      for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3])
        ClipperLib.Clipper.AddPolyNodeToPaths(pn, nt, paths);
    };
    ClipperLib.Clipper.OpenPathsFromPolyTree = function(polytree) {
      var result = new ClipperLib.Paths();
      for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++)
        if (polytree.Childs()[i].IsOpen)
          result.push(polytree.Childs()[i].m_polygon);
      return result;
    };
    ClipperLib.Clipper.ClosedPathsFromPolyTree = function(polytree) {
      var result = new ClipperLib.Paths();
      ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntClosed, result);
      return result;
    };
    Inherit(ClipperLib.Clipper, ClipperLib.ClipperBase);
    ClipperLib.Clipper.NodeType = {
      ntAny: 0,
      ntOpen: 1,
      ntClosed: 2
    };
    ClipperLib.ClipperOffset = function(miterLimit, arcTolerance) {
      if (typeof miterLimit === "undefined")
        miterLimit = 2;
      if (typeof arcTolerance === "undefined")
        arcTolerance = ClipperLib.ClipperOffset.def_arc_tolerance;
      this.m_destPolys = new ClipperLib.Paths();
      this.m_srcPoly = new ClipperLib.Path();
      this.m_destPoly = new ClipperLib.Path();
      this.m_normals = new Array();
      this.m_delta = 0;
      this.m_sinA = 0;
      this.m_sin = 0;
      this.m_cos = 0;
      this.m_miterLim = 0;
      this.m_StepsPerRad = 0;
      this.m_lowest = new ClipperLib.IntPoint0();
      this.m_polyNodes = new ClipperLib.PolyNode();
      this.MiterLimit = miterLimit;
      this.ArcTolerance = arcTolerance;
      this.m_lowest.X = -1;
    };
    ClipperLib.ClipperOffset.two_pi = 6.28318530717959;
    ClipperLib.ClipperOffset.def_arc_tolerance = 0.25;
    ClipperLib.ClipperOffset.prototype.Clear = function() {
      ClipperLib.Clear(this.m_polyNodes.Childs());
      this.m_lowest.X = -1;
    };
    ClipperLib.ClipperOffset.Round = ClipperLib.Clipper.Round;
    ClipperLib.ClipperOffset.prototype.AddPath = function(path2, joinType, endType) {
      var highI = path2.length - 1;
      if (highI < 0)
        return;
      var newNode = new ClipperLib.PolyNode();
      newNode.m_jointype = joinType;
      newNode.m_endtype = endType;
      if (endType === ClipperLib.EndType.etClosedLine || endType === ClipperLib.EndType.etClosedPolygon)
        while (highI > 0 && ClipperLib.IntPoint.op_Equality(path2[0], path2[highI]))
          highI--;
      newNode.m_polygon.push(path2[0]);
      var j = 0, k = 0;
      for (var i = 1; i <= highI; i++)
        if (ClipperLib.IntPoint.op_Inequality(newNode.m_polygon[j], path2[i])) {
          j++;
          newNode.m_polygon.push(path2[i]);
          if (path2[i].Y > newNode.m_polygon[k].Y || path2[i].Y === newNode.m_polygon[k].Y && path2[i].X < newNode.m_polygon[k].X)
            k = j;
        }
      if (endType === ClipperLib.EndType.etClosedPolygon && j < 2)
        return;
      this.m_polyNodes.AddChild(newNode);
      if (endType !== ClipperLib.EndType.etClosedPolygon)
        return;
      if (this.m_lowest.X < 0)
        this.m_lowest = new ClipperLib.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
      else {
        var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
        if (newNode.m_polygon[k].Y > ip.Y || newNode.m_polygon[k].Y === ip.Y && newNode.m_polygon[k].X < ip.X)
          this.m_lowest = new ClipperLib.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
      }
    };
    ClipperLib.ClipperOffset.prototype.AddPaths = function(paths, joinType, endType) {
      for (var i = 0, ilen = paths.length; i < ilen; i++)
        this.AddPath(paths[i], joinType, endType);
    };
    ClipperLib.ClipperOffset.prototype.FixOrientations = function() {
      if (this.m_lowest.X >= 0 && !ClipperLib.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon)) {
        for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
          var node = this.m_polyNodes.Childs()[i];
          if (node.m_endtype === ClipperLib.EndType.etClosedPolygon || node.m_endtype === ClipperLib.EndType.etClosedLine && ClipperLib.Clipper.Orientation(node.m_polygon))
            node.m_polygon.reverse();
        }
      } else {
        for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
          var node = this.m_polyNodes.Childs()[i];
          if (node.m_endtype === ClipperLib.EndType.etClosedLine && !ClipperLib.Clipper.Orientation(node.m_polygon))
            node.m_polygon.reverse();
        }
      }
    };
    ClipperLib.ClipperOffset.GetUnitNormal = function(pt1, pt2) {
      var dx = pt2.X - pt1.X;
      var dy = pt2.Y - pt1.Y;
      if (dx === 0 && dy === 0)
        return new ClipperLib.DoublePoint2(0, 0);
      var f = 1 / Math.sqrt(dx * dx + dy * dy);
      dx *= f;
      dy *= f;
      return new ClipperLib.DoublePoint2(dy, -dx);
    };
    ClipperLib.ClipperOffset.prototype.DoOffset = function(delta) {
      this.m_destPolys = new Array();
      this.m_delta = delta;
      if (ClipperLib.ClipperBase.near_zero(delta)) {
        for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
          var node = this.m_polyNodes.Childs()[i];
          if (node.m_endtype === ClipperLib.EndType.etClosedPolygon)
            this.m_destPolys.push(node.m_polygon);
        }
        return;
      }
      if (this.MiterLimit > 2)
        this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
      else
        this.m_miterLim = 0.5;
      var y;
      if (this.ArcTolerance <= 0)
        y = ClipperLib.ClipperOffset.def_arc_tolerance;
      else if (this.ArcTolerance > Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance)
        y = Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance;
      else
        y = this.ArcTolerance;
      var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
      this.m_sin = Math.sin(ClipperLib.ClipperOffset.two_pi / steps);
      this.m_cos = Math.cos(ClipperLib.ClipperOffset.two_pi / steps);
      this.m_StepsPerRad = steps / ClipperLib.ClipperOffset.two_pi;
      if (delta < 0)
        this.m_sin = -this.m_sin;
      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
        var node = this.m_polyNodes.Childs()[i];
        this.m_srcPoly = node.m_polygon;
        var len = this.m_srcPoly.length;
        if (len === 0 || delta <= 0 && (len < 3 || node.m_endtype !== ClipperLib.EndType.etClosedPolygon))
          continue;
        this.m_destPoly = new Array();
        if (len === 1) {
          if (node.m_jointype === ClipperLib.JoinType.jtRound) {
            var X = 1, Y = 0;
            for (var j = 1; j <= steps; j++) {
              this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
              var X2 = X;
              X = X * this.m_cos - this.m_sin * Y;
              Y = X2 * this.m_sin + Y * this.m_cos;
            }
          } else {
            var X = -1, Y = -1;
            for (var j = 0; j < 4; ++j) {
              this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
              if (X < 0)
                X = 1;
              else if (Y < 0)
                Y = 1;
              else
                X = -1;
            }
          }
          this.m_destPolys.push(this.m_destPoly);
          continue;
        }
        this.m_normals.length = 0;
        for (var j = 0; j < len - 1; j++)
          this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
        if (node.m_endtype === ClipperLib.EndType.etClosedLine || node.m_endtype === ClipperLib.EndType.etClosedPolygon)
          this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
        else
          this.m_normals.push(new ClipperLib.DoublePoint1(this.m_normals[len - 2]));
        if (node.m_endtype === ClipperLib.EndType.etClosedPolygon) {
          var k = len - 1;
          for (var j = 0; j < len; j++)
            k = this.OffsetPoint(j, k, node.m_jointype);
          this.m_destPolys.push(this.m_destPoly);
        } else if (node.m_endtype === ClipperLib.EndType.etClosedLine) {
          var k = len - 1;
          for (var j = 0; j < len; j++)
            k = this.OffsetPoint(j, k, node.m_jointype);
          this.m_destPolys.push(this.m_destPoly);
          this.m_destPoly = new Array();
          var n = this.m_normals[len - 1];
          for (var j = len - 1; j > 0; j--)
            this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
          this.m_normals[0] = new ClipperLib.DoublePoint2(-n.X, -n.Y);
          k = 0;
          for (var j = len - 1; j >= 0; j--)
            k = this.OffsetPoint(j, k, node.m_jointype);
          this.m_destPolys.push(this.m_destPoly);
        } else {
          var k = 0;
          for (var j = 1; j < len - 1; ++j)
            k = this.OffsetPoint(j, k, node.m_jointype);
          var pt1;
          if (node.m_endtype === ClipperLib.EndType.etOpenButt) {
            var j = len - 1;
            pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
            this.m_destPoly.push(pt1);
            pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
            this.m_destPoly.push(pt1);
          } else {
            var j = len - 1;
            k = len - 2;
            this.m_sinA = 0;
            this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j].X, -this.m_normals[j].Y);
            if (node.m_endtype === ClipperLib.EndType.etOpenSquare)
              this.DoSquare(j, k);
            else
              this.DoRound(j, k);
          }
          for (var j = len - 1; j > 0; j--)
            this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
          this.m_normals[0] = new ClipperLib.DoublePoint2(-this.m_normals[1].X, -this.m_normals[1].Y);
          k = len - 1;
          for (var j = k - 1; j > 0; --j)
            k = this.OffsetPoint(j, k, node.m_jointype);
          if (node.m_endtype === ClipperLib.EndType.etOpenButt) {
            pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
            this.m_destPoly.push(pt1);
            pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
            this.m_destPoly.push(pt1);
          } else {
            k = 1;
            this.m_sinA = 0;
            if (node.m_endtype === ClipperLib.EndType.etOpenSquare)
              this.DoSquare(0, 1);
            else
              this.DoRound(0, 1);
          }
          this.m_destPolys.push(this.m_destPoly);
        }
      }
    };
    ClipperLib.ClipperOffset.prototype.Execute = function() {
      var a = arguments, ispolytree = a[0] instanceof ClipperLib.PolyTree;
      if (!ispolytree) {
        var solution = a[0], delta = a[1];
        ClipperLib.Clear(solution);
        this.FixOrientations();
        this.DoOffset(delta);
        var clpr = new ClipperLib.Clipper(0);
        clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
        if (delta > 0) {
          clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
        } else {
          var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
          var outer = new ClipperLib.Path();
          outer.push(new ClipperLib.IntPoint2(r.left - 10, r.bottom + 10));
          outer.push(new ClipperLib.IntPoint2(r.right + 10, r.bottom + 10));
          outer.push(new ClipperLib.IntPoint2(r.right + 10, r.top - 10));
          outer.push(new ClipperLib.IntPoint2(r.left - 10, r.top - 10));
          clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
          clpr.ReverseSolution = true;
          clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
          if (solution.length > 0)
            solution.splice(0, 1);
        }
      } else {
        var solution = a[0], delta = a[1];
        solution.Clear();
        this.FixOrientations();
        this.DoOffset(delta);
        var clpr = new ClipperLib.Clipper(0);
        clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
        if (delta > 0) {
          clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
        } else {
          var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
          var outer = new ClipperLib.Path();
          outer.push(new ClipperLib.IntPoint2(r.left - 10, r.bottom + 10));
          outer.push(new ClipperLib.IntPoint2(r.right + 10, r.bottom + 10));
          outer.push(new ClipperLib.IntPoint2(r.right + 10, r.top - 10));
          outer.push(new ClipperLib.IntPoint2(r.left - 10, r.top - 10));
          clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
          clpr.ReverseSolution = true;
          clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
          if (solution.ChildCount() === 1 && solution.Childs()[0].ChildCount() > 0) {
            var outerNode = solution.Childs()[0];
            solution.Childs()[0] = outerNode.Childs()[0];
            solution.Childs()[0].m_Parent = solution;
            for (var i = 1; i < outerNode.ChildCount(); i++)
              solution.AddChild(outerNode.Childs()[i]);
          } else
            solution.Clear();
        }
      }
    };
    ClipperLib.ClipperOffset.prototype.OffsetPoint = function(j, k, jointype) {
      this.m_sinA = this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y;
      if (Math.abs(this.m_sinA * this.m_delta) < 1) {
        var cosA = this.m_normals[k].X * this.m_normals[j].X + this.m_normals[j].Y * this.m_normals[k].Y;
        if (cosA > 0) {
          this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
          return k;
        }
      } else if (this.m_sinA > 1)
        this.m_sinA = 1;
      else if (this.m_sinA < -1)
        this.m_sinA = -1;
      if (this.m_sinA * this.m_delta < 0) {
        this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
        this.m_destPoly.push(new ClipperLib.IntPoint1(this.m_srcPoly[j]));
        this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
      } else
        switch (jointype) {
          case ClipperLib.JoinType.jtMiter: {
            var r = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
            if (r >= this.m_miterLim)
              this.DoMiter(j, k, r);
            else
              this.DoSquare(j, k);
            break;
          }
          case ClipperLib.JoinType.jtSquare:
            this.DoSquare(j, k);
            break;
          case ClipperLib.JoinType.jtRound:
            this.DoRound(j, k);
            break;
        }
      k = j;
      return k;
    };
    ClipperLib.ClipperOffset.prototype.DoSquare = function(j, k) {
      var dx = Math.tan(Math.atan2(this.m_sinA, this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y) / 4);
      this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))));
      this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))));
    };
    ClipperLib.ClipperOffset.prototype.DoMiter = function(j, k, r) {
      var q = this.m_delta / r;
      this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)));
    };
    ClipperLib.ClipperOffset.prototype.DoRound = function(j, k) {
      var a = Math.atan2(this.m_sinA, this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y);
      var steps = Math.max(ClipperLib.Cast_Int32(ClipperLib.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a))), 1);
      var X = this.m_normals[k].X, Y = this.m_normals[k].Y, X2;
      for (var i = 0; i < steps; ++i) {
        this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)));
        X2 = X;
        X = X * this.m_cos - this.m_sin * Y;
        Y = X2 * this.m_sin + Y * this.m_cos;
      }
      this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
    };
    ClipperLib.Error = function(message) {
      try {
        throw new Error(message);
      } catch (err) {
        alert(err.message);
      }
    };
    ClipperLib.JS = {};
    ClipperLib.JS.AreaOfPolygon = function(poly, scale) {
      if (!scale)
        scale = 1;
      return ClipperLib.Clipper.Area(poly) / (scale * scale);
    };
    ClipperLib.JS.AreaOfPolygons = function(poly, scale) {
      if (!scale)
        scale = 1;
      var area = 0;
      for (var i = 0; i < poly.length; i++) {
        area += ClipperLib.Clipper.Area(poly[i]);
      }
      return area / (scale * scale);
    };
    ClipperLib.JS.BoundsOfPath = function(path2, scale) {
      return ClipperLib.JS.BoundsOfPaths([path2], scale);
    };
    ClipperLib.JS.BoundsOfPaths = function(paths, scale) {
      if (!scale)
        scale = 1;
      var bounds = ClipperLib.Clipper.GetBounds(paths);
      bounds.left /= scale;
      bounds.bottom /= scale;
      bounds.right /= scale;
      bounds.top /= scale;
      return bounds;
    };
    ClipperLib.JS.Clean = function(polygon, delta) {
      if (!(polygon instanceof Array))
        return [];
      var isPolygons = polygon[0] instanceof Array;
      var polygon = ClipperLib.JS.Clone(polygon);
      if (typeof delta !== "number" || delta === null) {
        ClipperLib.Error("Delta is not a number in Clean().");
        return polygon;
      }
      if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || delta < 0)
        return polygon;
      if (!isPolygons)
        polygon = [polygon];
      var k_length = polygon.length;
      var len, poly, result, d, p, j, i;
      var results = [];
      for (var k = 0; k < k_length; k++) {
        poly = polygon[k];
        len = poly.length;
        if (len === 0)
          continue;
        else if (len < 3) {
          result = poly;
          results.push(result);
          continue;
        }
        result = poly;
        d = delta * delta;
        p = poly[0];
        j = 1;
        for (i = 1; i < len; i++) {
          if ((poly[i].X - p.X) * (poly[i].X - p.X) + (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d)
            continue;
          result[j] = poly[i];
          p = poly[i];
          j++;
        }
        p = poly[j - 1];
        if ((poly[0].X - p.X) * (poly[0].X - p.X) + (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d)
          j--;
        if (j < len)
          result.splice(j, len - j);
        if (result.length)
          results.push(result);
      }
      if (!isPolygons && results.length)
        results = results[0];
      else if (!isPolygons && results.length === 0)
        results = [];
      else if (isPolygons && results.length === 0)
        results = [
          []
        ];
      return results;
    };
    ClipperLib.JS.Clone = function(polygon) {
      if (!(polygon instanceof Array))
        return [];
      if (polygon.length === 0)
        return [];
      else if (polygon.length === 1 && polygon[0].length === 0)
        return [
          []
        ];
      var isPolygons = polygon[0] instanceof Array;
      if (!isPolygons)
        polygon = [polygon];
      var len = polygon.length, plen, i, j, result;
      var results = new Array(len);
      for (i = 0; i < len; i++) {
        plen = polygon[i].length;
        result = new Array(plen);
        for (j = 0; j < plen; j++) {
          result[j] = {
            X: polygon[i][j].X,
            Y: polygon[i][j].Y
          };
        }
        results[i] = result;
      }
      if (!isPolygons)
        results = results[0];
      return results;
    };
    ClipperLib.JS.Lighten = function(polygon, tolerance) {
      if (!(polygon instanceof Array))
        return [];
      if (typeof tolerance !== "number" || tolerance === null) {
        ClipperLib.Error("Tolerance is not a number in Lighten().");
        return ClipperLib.JS.Clone(polygon);
      }
      if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || tolerance < 0) {
        return ClipperLib.JS.Clone(polygon);
      }
      var isPolygons = polygon[0] instanceof Array;
      if (!isPolygons)
        polygon = [polygon];
      var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
      var bxax, byay, l, ax, ay;
      var len = polygon.length;
      var toleranceSq = tolerance * tolerance;
      var results = [];
      for (i = 0; i < len; i++) {
        poly = polygon[i];
        plen = poly.length;
        if (plen === 0)
          continue;
        for (k = 0; k < 1e6; k++) {
          poly2 = [];
          plen = poly.length;
          if (poly[plen - 1].X !== poly[0].X || poly[plen - 1].Y !== poly[0].Y) {
            addlast = 1;
            poly.push({
              X: poly[0].X,
              Y: poly[0].Y
            });
            plen = poly.length;
          } else
            addlast = 0;
          rem = [];
          for (j = 0; j < plen - 2; j++) {
            A = poly[j];
            P = poly[j + 1];
            B = poly[j + 2];
            ax = A.X;
            ay = A.Y;
            bxax = B.X - ax;
            byay = B.Y - ay;
            if (bxax !== 0 || byay !== 0) {
              l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
              if (l > 1) {
                ax = B.X;
                ay = B.Y;
              } else if (l > 0) {
                ax += bxax * l;
                ay += byay * l;
              }
            }
            bxax = P.X - ax;
            byay = P.Y - ay;
            d = bxax * bxax + byay * byay;
            if (d <= toleranceSq) {
              rem[j + 1] = 1;
              j++;
            }
          }
          poly2.push({
            X: poly[0].X,
            Y: poly[0].Y
          });
          for (j = 1; j < plen - 1; j++)
            if (!rem[j])
              poly2.push({
                X: poly[j].X,
                Y: poly[j].Y
              });
          poly2.push({
            X: poly[plen - 1].X,
            Y: poly[plen - 1].Y
          });
          if (addlast)
            poly.pop();
          if (!rem.length)
            break;
          else
            poly = poly2;
        }
        plen = poly2.length;
        if (poly2[plen - 1].X === poly2[0].X && poly2[plen - 1].Y === poly2[0].Y) {
          poly2.pop();
        }
        if (poly2.length > 2)
          results.push(poly2);
      }
      if (!isPolygons) {
        results = results[0];
      }
      if (typeof results === "undefined") {
        results = [];
      }
      return results;
    };
    ClipperLib.JS.PerimeterOfPath = function(path2, closed, scale) {
      if (typeof path2 === "undefined")
        return 0;
      var sqrt = Math.sqrt;
      var perimeter = 0;
      var p1, p2, p1x = 0, p1y = 0, p2x = 0, p2y = 0;
      var j = path2.length;
      if (j < 2)
        return 0;
      if (closed) {
        path2[j] = path2[0];
        j++;
      }
      while (--j) {
        p1 = path2[j];
        p1x = p1.X;
        p1y = p1.Y;
        p2 = path2[j - 1];
        p2x = p2.X;
        p2y = p2.Y;
        perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
      }
      if (closed)
        path2.pop();
      return perimeter / scale;
    };
    ClipperLib.JS.PerimeterOfPaths = function(paths, closed, scale) {
      if (!scale)
        scale = 1;
      var perimeter = 0;
      for (var i = 0; i < paths.length; i++) {
        perimeter += ClipperLib.JS.PerimeterOfPath(paths[i], closed, scale);
      }
      return perimeter;
    };
    ClipperLib.JS.ScaleDownPath = function(path2, scale) {
      var i, p;
      if (!scale)
        scale = 1;
      i = path2.length;
      while (i--) {
        p = path2[i];
        p.X = p.X / scale;
        p.Y = p.Y / scale;
      }
    };
    ClipperLib.JS.ScaleDownPaths = function(paths, scale) {
      var i, j, p;
      if (!scale)
        scale = 1;
      i = paths.length;
      while (i--) {
        j = paths[i].length;
        while (j--) {
          p = paths[i][j];
          p.X = p.X / scale;
          p.Y = p.Y / scale;
        }
      }
    };
    ClipperLib.JS.ScaleUpPath = function(path2, scale) {
      var i, p, round = Math.round;
      if (!scale)
        scale = 1;
      i = path2.length;
      while (i--) {
        p = path2[i];
        p.X = round(p.X * scale);
        p.Y = round(p.Y * scale);
      }
    };
    ClipperLib.JS.ScaleUpPaths = function(paths, scale) {
      var i, j, p, round = Math.round;
      if (!scale)
        scale = 1;
      i = paths.length;
      while (i--) {
        j = paths[i].length;
        while (j--) {
          p = paths[i][j];
          p.X = round(p.X * scale);
          p.Y = round(p.Y * scale);
        }
      }
    };
    ClipperLib.ExPolygons = function() {
      return [];
    };
    ClipperLib.ExPolygon = function() {
      this.outer = null;
      this.holes = null;
    };
    ClipperLib.JS.AddOuterPolyNodeToExPolygons = function(polynode, expolygons) {
      var ep = new ClipperLib.ExPolygon();
      ep.outer = polynode.Contour();
      var childs = polynode.Childs();
      var ilen = childs.length;
      ep.holes = new Array(ilen);
      var node, n, i, j, childs2, jlen;
      for (i = 0; i < ilen; i++) {
        node = childs[i];
        ep.holes[i] = node.Contour();
        for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++) {
          n = childs2[j];
          ClipperLib.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
        }
      }
      expolygons.push(ep);
    };
    ClipperLib.JS.ExPolygonsToPaths = function(expolygons) {
      var a, i, alen, ilen;
      var paths = new ClipperLib.Paths();
      for (a = 0, alen = expolygons.length; a < alen; a++) {
        paths.push(expolygons[a].outer);
        for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++) {
          paths.push(expolygons[a].holes[i]);
        }
      }
      return paths;
    };
    ClipperLib.JS.PolyTreeToExPolygons = function(polytree) {
      var expolygons = new ClipperLib.ExPolygons();
      var node, i, childs, ilen;
      for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++) {
        node = childs[i];
        ClipperLib.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
      }
      return expolygons;
    };
  })();
});
var module = createCommonjsModule(function(module2, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setErrorCallback = void 0;
  var _createClass = function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();
  var _clipper2 = _interopRequireDefault(clipper);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    } else {
      return Array.from(arr);
    }
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  var errorCallback = void 0;
  exports.setErrorCallback = function setErrorCallback(callback) {
    errorCallback = callback;
  };
  _clipper2.default.Error = function(message) {
    if (errorCallback)
      errorCallback(message);
  };
  var CLIPPER = new _clipper2.default.Clipper();
  var CLIPPER_OFFSET = new _clipper2.default.ClipperOffset();
  var Shape = function() {
    function Shape2() {
      var paths = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      var closed = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
      var capitalConversion = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
      var integerConversion = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
      var removeDuplicates = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : false;
      _classCallCheck(this, Shape2);
      this.paths = paths;
      if (capitalConversion)
        this.paths = this.paths.map(mapLowerToCapital);
      if (integerConversion)
        this.paths = this.paths.map(mapToRound);
      if (removeDuplicates)
        this.paths = this.paths.map(filterPathsDuplicates);
      this.closed = closed;
    }
    _createClass(Shape2, [{
      key: "_clip",
      value: function _clip(type) {
        var solution = new _clipper2.default.PolyTree();
        CLIPPER.Clear();
        CLIPPER.AddPaths(this.paths, _clipper2.default.PolyType.ptSubject, this.closed);
        for (var _len = arguments.length, clipShapes = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          clipShapes[_key - 1] = arguments[_key];
        }
        for (var i = 0; i < clipShapes.length; i++) {
          var clipShape = clipShapes[i];
          CLIPPER.AddPaths(clipShape.paths, _clipper2.default.PolyType.ptClip, clipShape.closed);
        }
        CLIPPER.Execute(type, solution);
        var newShape = _clipper2.default.Clipper.PolyTreeToPaths(solution);
        return new Shape2(newShape, this.closed);
      }
    }, {
      key: "union",
      value: function union() {
        for (var _len2 = arguments.length, clipShapes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          clipShapes[_key2] = arguments[_key2];
        }
        return this._clip.apply(this, [_clipper2.default.ClipType.ctUnion].concat(clipShapes));
      }
    }, {
      key: "difference",
      value: function difference() {
        for (var _len3 = arguments.length, clipShapes = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          clipShapes[_key3] = arguments[_key3];
        }
        return this._clip.apply(this, [_clipper2.default.ClipType.ctDifference].concat(clipShapes));
      }
    }, {
      key: "intersect",
      value: function intersect() {
        for (var _len4 = arguments.length, clipShapes = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          clipShapes[_key4] = arguments[_key4];
        }
        return this._clip.apply(this, [_clipper2.default.ClipType.ctIntersection].concat(clipShapes));
      }
    }, {
      key: "xor",
      value: function xor() {
        for (var _len5 = arguments.length, clipShapes = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          clipShapes[_key5] = arguments[_key5];
        }
        return this._clip.apply(this, [_clipper2.default.ClipType.ctXor].concat(clipShapes));
      }
    }, {
      key: "offset",
      value: function offset(_offset) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var _options$jointType = options.jointType, jointType = _options$jointType === void 0 ? "jtSquare" : _options$jointType, _options$endType = options.endType, endType = _options$endType === void 0 ? "etClosedPolygon" : _options$endType, _options$miterLimit = options.miterLimit, miterLimit = _options$miterLimit === void 0 ? 2 : _options$miterLimit, _options$roundPrecisi = options.roundPrecision, roundPrecision = _options$roundPrecisi === void 0 ? 0.25 : _options$roundPrecisi;
        CLIPPER_OFFSET.Clear();
        CLIPPER_OFFSET.ArcTolerance = roundPrecision;
        CLIPPER_OFFSET.MiterLimit = miterLimit;
        var offsetPaths = new _clipper2.default.Paths();
        CLIPPER_OFFSET.AddPaths(this.paths, _clipper2.default.JoinType[jointType], _clipper2.default.EndType[endType]);
        CLIPPER_OFFSET.Execute(offsetPaths, _offset);
        return new Shape2(offsetPaths, true);
      }
    }, {
      key: "scaleUp",
      value: function scaleUp(factor) {
        _clipper2.default.JS.ScaleUpPaths(this.paths, factor);
        return this;
      }
    }, {
      key: "scaleDown",
      value: function scaleDown(factor) {
        _clipper2.default.JS.ScaleDownPaths(this.paths, factor);
        return this;
      }
    }, {
      key: "firstPoint",
      value: function firstPoint() {
        var toLower = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (this.paths.length === 0) {
          return;
        }
        var firstPath = this.paths[0];
        var firstPoint2 = firstPath[0];
        if (toLower) {
          return vectorToLower(firstPoint2);
        } else {
          return firstPoint2;
        }
      }
    }, {
      key: "lastPoint",
      value: function lastPoint() {
        var toLower = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (this.paths.length === 0) {
          return;
        }
        var lastPath = this.paths[this.paths.length - 1];
        var lastPoint2 = this.closed ? lastPath[0] : lastPath[lastPath.length - 1];
        if (toLower) {
          return vectorToLower(lastPoint2);
        } else {
          return lastPoint2;
        }
      }
    }, {
      key: "areas",
      value: function areas() {
        var _this = this;
        var areas2 = this.paths.map(function(path2, i) {
          return _this.area(i);
        });
        return areas2;
      }
    }, {
      key: "area",
      value: function area(index) {
        var path2 = this.paths[index];
        var area2 = _clipper2.default.Clipper.Area(path2);
        return area2;
      }
    }, {
      key: "totalArea",
      value: function totalArea() {
        return this.areas().reduce(function(totalArea2, area) {
          return totalArea2 + area;
        }, 0);
      }
    }, {
      key: "perimeter",
      value: function perimeter(index) {
        var path2 = this.paths[index];
        var perimeter2 = _clipper2.default.JS.PerimeterOfPath(path2, this.closed, 1);
        return perimeter2;
      }
    }, {
      key: "perimeters",
      value: function perimeters() {
        var _this2 = this;
        return this.paths.map(function(path2) {
          return _clipper2.default.JS.PerimeterOfPath(path2, _this2.closed, 1);
        });
      }
    }, {
      key: "totalPerimeter",
      value: function totalPerimeter() {
        var perimeter = _clipper2.default.JS.PerimeterOfPaths(this.paths, this.closed);
        return perimeter;
      }
    }, {
      key: "reverse",
      value: function reverse() {
        _clipper2.default.Clipper.ReversePaths(this.paths);
        return this;
      }
    }, {
      key: "thresholdArea",
      value: function thresholdArea(minArea) {
        var _arr = [].concat(_toConsumableArray(this.paths));
        for (var _i = 0; _i < _arr.length; _i++) {
          var path2 = _arr[_i];
          var area = Math.abs(_clipper2.default.Clipper.Area(path2));
          if (area < minArea) {
            var index = this.paths.indexOf(path2);
            this.paths.splice(index, 1);
          }
        }
        return this;
      }
    }, {
      key: "join",
      value: function join(shape) {
        var _paths;
        (_paths = this.paths).splice.apply(_paths, [this.paths.length, 0].concat(_toConsumableArray(shape.paths)));
        return this;
      }
    }, {
      key: "clone",
      value: function clone2() {
        return new Shape2(_clipper2.default.JS.Clone(this.paths), this.closed);
      }
    }, {
      key: "shapeBounds",
      value: function shapeBounds() {
        return _clipper2.default.JS.BoundsOfPaths(this.paths);
      }
    }, {
      key: "pathBounds",
      value: function pathBounds(index) {
        var path2 = this.paths[index];
        return _clipper2.default.JS.BoundsOfPath(path2);
      }
    }, {
      key: "clean",
      value: function clean(cleanDelta) {
        return new Shape2(_clipper2.default.Clipper.CleanPolygons(this.paths, cleanDelta), this.closed);
      }
    }, {
      key: "orientation",
      value: function orientation(index) {
        var path2 = this.paths[index];
        return _clipper2.default.Clipper.Orientation(path2);
      }
    }, {
      key: "pointInShape",
      value: function pointInShape(point) {
        var capitalConversion = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        var integerConversion = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
        if (capitalConversion)
          point = vectorToCapital(point);
        if (integerConversion)
          point = roundVector(point);
        for (var i = 0; i < this.paths.length; i++) {
          var pointInPath = this.pointInPath(i, point);
          var orientation = this.orientation(i);
          if (!pointInPath && orientation || pointInPath && !orientation) {
            return false;
          }
        }
        return true;
      }
    }, {
      key: "pointInPath",
      value: function pointInPath(index, point) {
        var capitalConversion = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
        var integerConversion = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
        if (capitalConversion)
          point = vectorToCapital(point);
        if (integerConversion)
          point = roundVector(point);
        var path2 = this.paths[index];
        var intPoint = {X: Math.round(point.X), Y: Math.round(point.Y)};
        return _clipper2.default.Clipper.PointInPolygon(intPoint, path2) > 0;
      }
    }, {
      key: "fixOrientation",
      value: function fixOrientation() {
        if (!this.closed) {
          return this;
        }
        if (this.totalArea() < 0) {
          this.reverse();
        }
        return this;
      }
    }, {
      key: "simplify",
      value: function simplify(fillType) {
        if (this.closed) {
          var shape = _clipper2.default.Clipper.SimplifyPolygons(this.paths, _clipper2.default.PolyFillType[fillType]);
          return new Shape2(shape, true);
        } else {
          return this;
        }
      }
    }, {
      key: "separateShapes",
      value: function separateShapes() {
        var shapes = [];
        if (!this.closed) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = void 0;
          try {
            for (var _iterator = this.paths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var path2 = _step.value;
              shapes.push(new Shape2([path2], false));
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        } else {
          var areas = new WeakMap();
          var outlines = [];
          var holes = [];
          for (var i = 0; i < this.paths.length; i++) {
            var _path = this.paths[i];
            var orientation = this.orientation(i);
            if (orientation) {
              var area = this.area(i);
              areas.set(_path, area);
              outlines.push(_path);
            } else {
              holes.push(_path);
            }
          }
          outlines.sort(function(a, b) {
            return areas.get(a) - areas.get(b);
          });
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = void 0;
          try {
            for (var _iterator2 = outlines[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var outline = _step2.value;
              var shape = [outline];
              var index = this.paths.indexOf(outline);
              var _arr2 = [].concat(holes);
              for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
                var hole = _arr2[_i2];
                var pointInHole = this.pointInPath(index, hole[0]);
                if (pointInHole) {
                  shape.push(hole);
                  var _index = holes.indexOf(hole);
                  holes.splice(_index, 1);
                }
              }
              shapes.push(new Shape2(shape, true));
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
        return shapes;
      }
    }, {
      key: "round",
      value: function round() {
        return new Shape2(this.paths.map(mapToRound), this.closed);
      }
    }, {
      key: "removeDuplicates",
      value: function removeDuplicates() {
        return new Shape2(this.paths.map(filterPathsDuplicates), this.closed);
      }
    }, {
      key: "mapToLower",
      value: function mapToLower() {
        return this.paths.map(mapCapitalToLower);
      }
    }]);
    return Shape2;
  }();
  exports.default = Shape;
  function mapCapitalToLower(path2) {
    return path2.map(vectorToLower);
  }
  function vectorToLower(_ref) {
    var X = _ref.X, Y = _ref.Y;
    return {x: X, y: Y};
  }
  function mapLowerToCapital(path2) {
    return path2.map(vectorToCapital);
  }
  function vectorToCapital(_ref2) {
    var x = _ref2.x, y = _ref2.y;
    return {X: x, Y: y};
  }
  function mapToRound(path2) {
    return path2.map(roundVector);
  }
  function roundVector(_ref3) {
    var X = _ref3.X, Y = _ref3.Y;
    return {X: Math.round(X), Y: Math.round(Y)};
  }
  function filterPathsDuplicates(path2) {
    return path2.filter(filterPathDuplicates);
  }
  function filterPathDuplicates(point, i, array) {
    if (i === 0)
      return true;
    var prevPoint = array[i - 1];
    return !(point.X === prevPoint.X && point.Y === prevPoint.Y);
  }
});
var __pika_web_default_export_for_treeshaking__ = /* @__PURE__ */ getDefaultExportFromCjs(module);

// app/meta/Component.js
var Component = class extends GameObject {
  constructor() {
    super(...arguments);
    this.editing = false;
    this.position = {x: 400, y: 100};
    this.width = 100;
    this.height = 100;
    this.scope = new MetaStruct([]);
    this.outline = [];
    this.clipperShape = new __pika_web_default_export_for_treeshaking__([]);
    this.wirePorts = [];
    this.svgOutline = Svg_default.add("path", Svg_default.metaElm, {
      class: "component"
    });
  }
  getWirePortNear(pos) {
    const closestPoint = closestPointOnPolygon(this.outline, pos);
    const newPort = new WirePort(closestPoint, this.scope);
    this.wirePorts.push(newPort);
    return newPort;
  }
  render(dt, t) {
    Svg_default.update(this.svgOutline, {
      d: Svg_default.path(this.outline)
    });
    for (const child of this.children) {
      if (child instanceof Token_default) {
        child.hidden = !this.editing;
      }
      child.render(dt, t);
    }
  }
  distanceToPoint(pos) {
    if (this.clipperShape.pointInShape(pos, true)) {
      return 0;
    } else {
      return Infinity;
    }
  }
  updateOutline() {
    const strokes2 = this.findAll({what: aStroke});
    this.clipperShape = new __pika_web_default_export_for_treeshaking__(strokes2.map((stroke) => stroke.points), true, true, true, true);
    this.clipperShape = this.clipperShape.offset(7, {
      jointType: "jtRound",
      endType: "etOpenRound",
      miterLimit: 2,
      roundPrecision: 0.1
    });
    const shapePaths = this.clipperShape.paths.map((path2) => {
      const p = path2.map((pt) => {
        return {x: pt.X, y: pt.Y};
      });
      return p.concat([p[0]]);
    });
    this.outline = shapePaths[0];
  }
};
var Component_default = Component;
var aComponent = (gameObj) => gameObj instanceof Component ? gameObj : null;

// app/gestures/CreateWire.js
function createWire(ctx) {
  if (ctx.metaToggle.active) {
    if (ctx.root.find({
      what: aMetaToggle,
      near: ctx.event.position,
      recursive: false,
      tooFar: 35
    })) {
      return;
    }
    const find = ctx.page.find.bind(ctx.page);
    const near = ctx.event.position;
    const primaryToken = find({what: aPrimaryToken, near, recursive: true});
    const component = find({what: aComponent, near, recursive: false});
    const token = find({what: aToken, near, recursive: false});
    const gizmo = find({
      what: aGizmo,
      that: (g) => g.centerDistanceToPoint(ctx.event.position) < 30
    });
    const wire = ctx.page.adopt(new Wire_default());
    if (isTokenWithVariable(primaryToken)) {
      wire.attachFront(primaryToken.wirePort);
    } else if (component) {
      wire.attachFront(component.getWirePortNear(ctx.event.position));
    } else if (isPropertyPicker(token)) {
      wire.attachFront(token.wirePort);
    } else if (gizmo) {
      wire.attachFront(gizmo.wirePort);
    } else {
      return;
    }
    return new Gesture("Create Wire", {
      moved(ctx2) {
        wire.points[1] = ctx2.event.position;
      },
      ended(ctx2) {
        const near2 = ctx2.event.position;
        const primaryToken2 = find({what: aPrimaryToken, near: near2});
        const gizmo2 = find({what: aGizmo, near: near2});
        if (wire.isCollapsable()) {
          console.log(wire);
          if (wire.a && wire.a.deref()) {
            const token2 = wire.a.deref()?.parent;
            if (token2 instanceof Formula_default) {
              token2.edit();
            } else if (token2?.parent instanceof Formula_default) {
              token2.parent.edit();
            } else if (token2 instanceof Token_default) {
              const formula2 = Formula_default.createFromContext(ctx2, token2);
              formula2.position = vec_default.sub(token2.position, vec_default(-3, -3));
              formula2.edit();
            }
          } else {
            Formula_default.createFromContext(ctx2);
          }
          wire.remove();
        } else if (isTokenWithVariable(primaryToken2)) {
          wire.attachEnd(primaryToken2.wirePort);
          if (wire.a === null) {
            const n = ctx2.page.adopt(new NumberToken_default());
            n.variable.value = primaryToken2.getVariable().value;
            wire.attachFront(n.wirePort);
            n.render(0, 0);
            n.position = vec_default.sub(wire.points[0], vec_default(n.width / 2, n.height / 2));
            ctx2.page.adopt(wire);
          }
        } else if (gizmo2) {
          wire.attachEnd(gizmo2.wirePort);
        } else if (primaryToken2 instanceof EmptyToken_default) {
          if (wire.a?.deref()?.value instanceof MetaStruct) {
            const p = ctx2.page.adopt(new PropertyPicker_default());
            p.position = ctx2.event.position;
            primaryToken2.parent.insertInto(primaryToken2, p);
            wire.attachEnd(p.inputPort);
            ctx2.page.adopt(new PropertyPickerEditor_default(p));
          } else {
            const n = new NumberToken_default();
            primaryToken2.parent.insertInto(primaryToken2, n);
            wire.attachEnd(n.wirePort);
            n.editValue = (wire.a?.deref()?.value).variable.value.toFixed();
          }
        } else if (wire.a?.deref()?.value instanceof MetaStruct) {
          const p = ctx2.page.adopt(new PropertyPicker_default());
          p.position = ctx2.event.position;
          wire.attachEnd(p.inputPort);
          ctx2.page.adopt(new PropertyPickerEditor_default(p));
        } else {
          if (!wire.a) {
            wire.remove();
          } else {
            const n = ctx2.page.adopt(new NumberToken_default());
            wire.attachEnd(n.wirePort);
            n.render(0, 0);
            n.position = vec_default.sub(ctx2.event.position, vec_default(n.width / 2, n.height / 2));
            ctx2.page.adopt(wire);
          }
        }
      }
    });
  }
}

// app/gestures/PropertyPicker.js
function tapPropertyPicker(ctx) {
  if (ctx.metaToggle.active) {
    const propertyPicker = ctx.page.find({
      what: aPropertyPickerEditor,
      near: ctx.event.position,
      recursive: false
    });
    if (propertyPicker) {
      return new Gesture("Tap Property Picker", {
        began(ctx2) {
          propertyPicker.onTapInside(ctx2.event.position);
        }
      });
    }
  }
}

// app/gestures/CreateGizmo.js
function createGizmo(ctx) {
  if (ctx.metaToggle.active) {
    const handle = ctx.page.find({
      what: aCanonicalHandle,
      near: ctx.event.position
    });
    if (handle) {
      const a = ctx.page.adopt(Handle_default.create({...ctx.event.position}, true));
      const b = ctx.page.adopt(Handle_default.create({...ctx.event.position}, false));
      ctx.page.adopt(new Gizmo_default(a, b));
      return touchHandleHelper(b);
    }
  }
}

// app/gestures/Gizmo.js
function touchGizmo(ctx) {
  if (ctx.metaToggle.active) {
    const gizmo = ctx.root.find({
      what: aGizmo,
      that: (g) => g.centerDistanceToPoint(ctx.event.position) < 50
    });
    if (gizmo) {
      return new Gesture("Touch Gizmo", {
        ended(ctx2) {
          gizmo.cycleConstraints();
        }
      });
    }
  }
}

// app/gestures/Erase.js
function erase(ctx) {
  if (ctx.pseudoCount === 2) {
    return new Gesture("Erase", {
      moved(ctx2) {
        spawn(ctx2.event.position);
        const gos = ctx2.root.findAll({
          what: ctx2.metaToggle.active ? aMetaErasable : aConcreteErasable,
          near: ctx2.event.position,
          tooFar: 10
        });
        for (const go of gos) {
          if (--go.hp <= 0) {
            go.remove();
          }
        }
      }
    });
  }
}
function spawn(p) {
  const elm = Svg_default.add("g", Svg_default.guiElm, {
    class: "eraser",
    transform: `${Svg_default.positionToTransform(p)} rotate(${rand(0, 360)}) `
  });
  Svg_default.add("line", elm, {y2: 6});
  elm.onanimationend = () => elm.remove();
}
var concreteErasables = [StrokeGroup_default, Stroke_default, MetaToggle_default];
var aConcreteErasable = (gameObj) => concreteErasables.some((cls) => gameObj instanceof cls) ? gameObj : null;
var aMetaErasable = aGameObject;

// app/gestures/ToggleHandles.js
function toggleHandles(ctx) {
  if (ctx.metaToggle.active) {
    const strokeGroup = ctx.page.find({
      what: aStrokeGroup,
      near: ctx.event.position
    });
    if (strokeGroup) {
      return new Gesture("Remove Handles", {
        ended(ctx2) {
          if (!ctx2.state.drag && strokeGroup.a.canonicalInstance.absorbedHandles.size === 0 && strokeGroup.b.canonicalInstance.absorbedHandles.size === 0) {
            strokeGroup.breakApart();
          }
        }
      });
    }
    const stroke = ctx.page.find({
      what: aStroke,
      near: ctx.event.position
    });
    if (stroke) {
      return new Gesture("Add Handles", {
        ended(ctx2) {
          if (!ctx2.state.drag) {
            stroke.becomeGroup();
          }
        }
      });
    }
  }
}

// app/gestures/ToggleWire.js
function toggleWire(ctx) {
  if (ctx.metaToggle.active) {
    const wire = ctx.page.find({
      what: aWire,
      near: ctx.event.position
    });
    if (wire) {
      return new Gesture("Toggle Wire", {
        ended(ctx2) {
          if (!ctx2.state.drag) {
            wire.togglePaused();
          }
        }
      });
    }
  }
}

// app/gestures/CreateFormula.js
function createFormula(ctx) {
  if (ctx.metaToggle.active) {
    return new Gesture("Create Formula", {
      ended(ctx2) {
        if (!ctx2.state.drag) {
          Formula_default.createFromContext(ctx2);
        }
      }
    });
  }
}

// app/Input.js
var gestureCreators = {
  finger: [
    closeFormulaEditor,
    scrubNumberToken,
    tapPropertyPicker,
    touchToken,
    touchHandle,
    touchMetaToggle,
    touchGizmo,
    toggleWire,
    toggleHandles
  ],
  pencil: [
    erase,
    createGizmo,
    tapPropertyPicker,
    tapFormulaLabel,
    pencilFormulaEditor,
    createWire,
    createFormula,
    drawInk
  ]
};
var pseudoTouches = {};
var gesturesByTouchId = {};
function applyEvent(ctx) {
  if (Config_default.gesture.reapTouches) {
    for (const id in pseudoTouches) {
      if (!wasRecentlyUpdated(pseudoTouches[id])) {
        delete pseudoTouches[id];
      }
    }
    for (const id in gesturesByTouchId) {
      if (!wasRecentlyUpdated(gesturesByTouchId[id])) {
        delete gesturesByTouchId[id];
      }
    }
  }
  if (pseudoTouches[ctx.event.id]) {
    if (ctx.event.state === "ended") {
      delete pseudoTouches[ctx.event.id];
    } else {
      pseudoTouches[ctx.event.id] = ctx.event;
    }
    return;
  }
  ctx.pseudoTouches = pseudoTouches;
  ctx.pseudoCount = Object.keys(pseudoTouches).length + ctx.events.forcePseudo;
  ctx.pseudo = ctx.pseudoCount > 0;
  const gestureForTouch = gesturesByTouchId[ctx.event.id];
  if (gestureForTouch) {
    runGesture(gestureForTouch, ctx);
    if (ctx.event.state === "ended") {
      delete gesturesByTouchId[ctx.event.id];
    }
    return;
  }
  if (ctx.event.state !== "began") {
    return;
  }
  for (const id in gesturesByTouchId) {
    const gesture = gesturesByTouchId[id];
    if (gesture.claimsTouch(ctx)) {
      gesturesByTouchId[ctx.event.id] = gesture;
      runGesture(gesture, ctx);
      return;
    }
  }
  for (const gestureCreator of gestureCreators[ctx.event.type]) {
    const gesture = gestureCreator(ctx);
    if (gesture) {
      gesturesByTouchId[ctx.event.id] = gesture;
      runGesture(gesture, ctx);
      return;
    }
  }
  if (ctx.event.type === "finger") {
    pseudoTouches[ctx.event.id] = ctx.event;
    return;
  }
}
function runGesture(gesture, ctx) {
  const result = gesture.applyEvent(ctx);
  if (result instanceof Gesture) {
    for (const id in gesturesByTouchId) {
      if (gesturesByTouchId[id] === gesture) {
        gesturesByTouchId[id] = result;
      }
    }
    runGesture(result, ctx);
  }
}
function render() {
  for (const id in gesturesByTouchId) {
    gesturesByTouchId[id].render();
  }
  if (Config_default.gesture.debugVisualization) {
    for (const id in gesturesByTouchId) {
      gesturesByTouchId[id].debugRender();
    }
    for (const id in pseudoTouches) {
      const event = pseudoTouches[id];
      Svg_default.now("circle", {
        class: "pseudo-touch",
        cx: event.position.x,
        cy: event.position.y,
        r: 8
      });
    }
  }
}

// app/App.js
var page = new Page_default();
root.adopt(page);
root.currentPage = page;
var metaToggle = new MetaToggle_default();
root.adopt(metaToggle);
var events = new NativeEvents_default(metaToggle, (event, state) => {
  applyEvent({
    event,
    state,
    events,
    root,
    page,
    metaToggle,
    pseudo: false,
    pseudoCount: 0,
    pseudoTouches: {}
  });
});
onEveryFrame((dt, t) => {
  Svg_default.clearNow(t);
  events.update();
  VarMover_default.update(dt, t);
  solve(root);
  root.render(dt, t);
  render();
});
