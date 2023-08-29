import { Position, PositionWithPressure } from "../lib/types";

type AttributeValue = string | number;

const NS = "http://www.w3.org/2000/svg";

export default class SVG {
  static rootElm = document.querySelector("svg") as SVGSVGElement;
  static nowElm = document.querySelector("#now") as SVGGElement;

  // Deprecated — SVG doesn't need to be instanced anymore
  constructor() {}

  // Deprecated — use SVG.add()
  addElement = SVG.add;

  static add(
    type: string,
    attributes: Record<string, AttributeValue> = {},
    parent: SVGElement = SVG.rootElm
  ) {
    return parent.appendChild(SVG.update(document.createElementNS(NS, type), attributes));
  }

  // SVG.update() allows you to set attributes on an SVG element in bulk.
  // Use the sugar attribute `content` to set innerHTML:
  // • SVG.update(myTextElm, {content: "hello"})
  static update<T extends SVGElement>(elm: T, attributes: Record<string, AttributeValue>) {
    Object.entries(attributes).forEach(([key, value]) => {
      let cache = ((elm as any).__cache ||= {});
      if (cache[key] === value) return;
      cache[key] = value;

      if (key === "content") {
        elm.innerHTML = "" + value;
      } else {
        elm.setAttribute(key, "" + value);
      }
    });
    return elm;
  }

  // SVG.now() puts an element on the screen for just one frame, after which it's automatically deleted.
  // This allows for immediate-mode rendering — super useful for debug visuals.
  static now(type: string, attributes: Record<string, AttributeValue>) {
    return SVG.add(type, attributes, SVG.nowElm);
  }

  static clearNow() {
    SVG.nowElm.replaceChildren();
  }

  // SVG.points() helps you build a polyline from Positions (or arrays of Positions). Example usage:
  // • SVG.now("polyline", { points: SVG.points(this.stroke.points), stroke: "#00F" });
  // • SVG.now("polyline", { points: SVG.points(point1, point2, pointsArr), stroke: "#F00" });
  static points(...points: (Position | Position[])[]) {
    return points
      .flat()
      .map((p) => p.x + " " + p.y)
      .join(" ");
  }
}

// Deprecated — use SVG.update()
export const updateSvgElement = SVG.update;

// Maybe deprecated in favor of SVG.points?
export function generatePathFromPoints(points: Array<Position | PositionWithPressure | null>) {
  const parts: string[] = [];
  let nextCommand = "M";
  for (const p of points) {
    if (p == null || (p.pressure !== undefined && p.pressure < 0)) {
      nextCommand = "M";
      continue;
    }

    parts.push(`${nextCommand} ${p.x} ${p.y}`);
    nextCommand = "L";
  }
  return parts.filter((part) => part != null).join(" ");
}
