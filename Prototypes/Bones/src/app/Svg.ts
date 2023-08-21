import { Position, PositionWithPressure } from "../lib/types";

type AttributeValue = string | number;

export default class SVG {
  constructor(private root: SVGSVGElement) {}

  addElement(
    type: string,
    attributes: Record<string, AttributeValue>,
    parent: SVGElement = this.root
  ) {
    const elem: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", type);
    updateSvgElement(elem, attributes);
    parent.appendChild(elem);
    return elem;
  }
}

export function updateSvgElement(elem: SVGElement, attributes: Record<string, AttributeValue>) {
  Object.entries(attributes).forEach(([key, value]) => elem.setAttribute(key, "" + value));
}

// TODO: maybe this should live somewhere else, tbd
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
