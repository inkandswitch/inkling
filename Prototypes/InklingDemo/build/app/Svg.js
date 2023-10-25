import {clip} from "../lib/math.js";
import Vec from "../lib/vec.js";
const NS = "http://www.w3.org/2000/svg";
const gizmoElm = document.querySelector("#gizmo");
const handleElm = document.querySelector("#handle");
const inkElm = document.querySelector("#ink");
const constraintElm = document.querySelector("#constraint");
const boxElm = document.querySelector("#box");
const wiresElm = document.querySelector("#wires");
const metaElm = document.querySelector("#meta");
const labelElm = document.querySelector("#label");
const guiElm = document.querySelector("#gui");
const nowElm = document.querySelector("#now");
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
let lastTime = 0;
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
function arcPath(center, radius, angle, rotation, mirror = true) {
  rotation = clip(rotation, -Math.PI, Math.PI);
  const S = Vec.add(center, Vec.polar(angle, radius));
  let path2 = "";
  if (mirror) {
    const B = Vec.add(center, Vec.polar(angle - rotation, radius));
    path2 += `M ${B.x}, ${B.y} A ${radius},${radius} 0 0,1 ${S.x}, ${S.y}`;
  } else {
    path2 += `M ${S.x}, ${S.y}`;
  }
  const A = Vec.add(center, Vec.polar(angle + rotation, radius));
  path2 += `A ${radius},${radius} 0 0,1 ${A.x}, ${A.y}`;
  return path2;
}
function path(points2) {
  return points2.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}
const statusElement = add("text", guiElm, {class: "status-text"});
let statusHideTimeMillis = 0;
function showStatus(content, time = 3e3) {
  update(statusElement, {content, "is-visible": true});
  statusHideTimeMillis = performance.now() + time;
  setTimeout(() => {
    if (performance.now() >= statusHideTimeMillis) {
      update(statusElement, {"is-visible": false});
    }
  }, time);
}
export default {
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
