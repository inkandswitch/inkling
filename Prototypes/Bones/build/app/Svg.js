const NS = "http://www.w3.org/2000/svg";
const _SVG = class {
  constructor() {
    this.addElement = _SVG.add;
  }
  static add(type, attributes = {}, parent = _SVG.rootElm) {
    return parent.appendChild(_SVG.update(document.createElementNS(NS, type), attributes));
  }
  static update(elm, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      let cache = elm.__cache || (elm.__cache = {});
      if (cache[key] === value)
        return;
      cache[key] = value;
      if (key === "content") {
        elm.innerHTML = "" + value;
      } else {
        elm.setAttribute(key, "" + value);
      }
    });
    return elm;
  }
  static now(type, attributes) {
    return _SVG.add(type, attributes, _SVG.nowElm);
  }
  static clearNow() {
    _SVG.nowElm.replaceChildren();
  }
  static points(...points) {
    return points.flat().map((p) => p.x + " " + p.y).join(" ");
  }
};
let SVG = _SVG;
SVG.rootElm = document.querySelector("svg");
SVG.nowElm = document.querySelector("#now");
export default SVG;
export const updateSvgElement = SVG.update;
export function generatePathFromPoints(points) {
  const parts = [];
  let nextCommand = "M";
  for (const p of points) {
    if (p == null || p.pressure !== void 0 && p.pressure < 0) {
      nextCommand = "M";
      continue;
    }
    parts.push(`${nextCommand} ${p.x} ${p.y}`);
    nextCommand = "L";
  }
  return parts.filter((part) => part != null).join(" ");
}
