export default class SVG {
  constructor(root) {
    this.root = root;
  }
  addElement(type, attributes) {
    const elem = document.createElementNS("http://www.w3.org/2000/svg", type);
    updateSvgElement(elem, attributes);
    this.root.appendChild(elem);
    return elem;
  }
}
export function updateSvgElement(elem, attributes) {
  Object.entries(attributes).forEach(([key, value]) => elem.setAttribute(key, "" + value));
}
const GET_STROKE_OPTIONS = {
  size: 0.5,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true
  },
  end: {
    taper: 0,
    easing: (t) => t,
    cap: true
  },
  simulatePressure: false
};
function toSvgPath(stroke) {
  console.log("s", stroke);
  const d = stroke.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length];
    acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    return acc;
  }, ["M", ...stroke[0], "Q"]);
  d.push("Z");
  return d.join(" ");
}
export function generatePathFromPoints(points) {
  return pointsToPath(points);
}
function pointsToPath(points) {
  const parts = [];
  let nextCommand = "M";
  for (const p of points) {
    if (p == null) {
      nextCommand = "M";
      continue;
    }
    parts.push(`${nextCommand} ${p.x} ${p.y}`);
    nextCommand = "L";
  }
  return parts.filter((part) => part != null).join(" ");
}
