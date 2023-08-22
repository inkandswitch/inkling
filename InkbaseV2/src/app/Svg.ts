import { Position, PositionWithPressure } from '../lib/types';

type AttributeValue = string | number;

export default class SVG {
  constructor(private root: SVGSVGElement) {}

  addElement(type: string, attributes: Record<string, AttributeValue>) {
    const elem: SVGElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      type
    );
    updateSvgElement(elem, attributes);
    this.root.appendChild(elem);
    return elem;
  }
}

export function updateSvgElement(
  elem: SVGElement,
  attributes: Record<string, AttributeValue>
) {
  Object.entries(attributes).forEach(([key, value]) =>
    elem.setAttribute(key, '' + value)
  );
}

// TODO: maybe this should live somewhere else, tbd
export function generatePathFromPoints(
  points: Position[] | PositionWithPressure[]
) {
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}
