// import { getStroke } from "perfect-freehand"

type AttributeValue = string | number;

export default class SVG {
  constructor(private root: SVGSVGElement) {}

  addElement(type: string, attributes: Record<string, AttributeValue>) {
    const elem: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", type);
    updateSvgElement(elem, attributes);
    this.root.appendChild(elem);
    return elem;
  }
}

export function updateSvgElement(elem: SVGElement, attributes: Record<string, AttributeValue>) {
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
    cap: true,
  },
  end: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
  simulatePressure: false,
};

function toSvgPath(stroke) {
  console.log("s", stroke);
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

// TODO: maybe this should live somewhere else, tbd
export function generatePathFromPoints(points) {
  return pointsToPath(points);

  // if (points[0]?.pressure == null) {
  //     return pointsToPath(points);
  // } else {
  //     const subStrokes = [[]];
  //     for (const p of points) {
  //         if (p == null) {
  //             subStrokes.push([]);
  //         } else {
  //             subStrokes[subStrokes.length - 1].push(p);
  //         }
  //     }
  //     return subStrokes.map(points => toSvgPath(getStroke(points, GET_STROKE_OPTIONS))).join(' ');
  // }
}

// function pointsToPath(points) {
//     const parts = points.map(
//         (p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
//     );
//     return parts.join(' ');
// }

function pointsToPath(points) {
  const parts: string[] = [];
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
