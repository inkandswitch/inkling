import {clip} from "../lib/math.js";
import Vec from "../lib/vec.js";
const NS = "http://www.w3.org/2000/svg";
const rootElm = document.querySelector("svg");
const nowElm = document.querySelector("#now");
function add(type, attributes = {}, parent = rootElm) {
  return parent.appendChild(update(document.createElementNS(NS, type), attributes));
}
function update(elm, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    const cache = elm.__cache || (elm.__cache = {});
    if (cache[key] === value) {
      return;
    }
    cache[key] = value;
    if (key === "content") {
      elm.innerHTML = "" + value;
    } else {
      elm.setAttribute(key, "" + value);
    }
  });
  return elm;
}
let lastTime = 0;
function now(type, attributes) {
  const life = +attributes.life || 0;
  delete attributes.life;
  const elm = add(type, attributes, nowElm);
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
  return positions.flat().map((p) => p.x + " " + p.y).join(" ");
}
function arcPath(center, radius, angle, rotation, mirror = true) {
  rotation = clip(rotation, -Math.PI, Math.PI);
  let S = Vec.add(center, Vec.polar(angle, radius));
  let path2 = "";
  if (mirror) {
    let B = Vec.add(center, Vec.polar(angle - rotation, radius));
    path2 += `M ${B.x}, ${B.y} A ${radius},${radius} 0 0,1 ${S.x}, ${S.y}`;
  } else {
    path2 += `M ${S.x}, ${S.y}`;
  }
  let A = Vec.add(center, Vec.polar(angle + rotation, radius));
  path2 += `A ${radius},${radius} 0 0,1 ${A.x}, ${A.y}`;
  return path2;
}
function path(points2) {
  return points2.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}
const statusElement = add("text", {
  x: 20,
  content: "",
  stroke: "#bbb"
});
let statusHideTimeMillis = 0;
function showStatus(text, time = 3e3) {
  update(statusElement, {
    content: text,
    visibility: "visible",
    y: window.innerHeight - 5
  });
  statusHideTimeMillis = Date.now() + time;
  setTimeout(() => {
    if (Date.now() >= statusHideTimeMillis) {
      update(statusElement, {visibility: "hidden"});
    }
  }, time);
}
export default {
  add,
  update,
  now,
  clearNow,
  points,
  arcPath,
  path,
  showStatus
};
