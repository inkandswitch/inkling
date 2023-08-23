import { Position, PositionWithPressure } from '../lib/types';

type AttributeValue = string | number;

const NS = 'http://www.w3.org/2000/svg';

export default class SVG {
  static rootElm = document.querySelector('svg') as SVGSVGElement;
  static nowElm = document.querySelector('#now') as SVGGElement;

  // Deprecated — SVG doesn't need to be instanced anymore
  constructor() {}

  // Deprecated — use SVG.add()
  addElement = SVG.add;

  static add(
    type: string,
    attributes: Record<string, AttributeValue> = {},
    parent: SVGElement = SVG.rootElm
  ) {
    return parent.appendChild(
      SVG.update(document.createElementNS(NS, type), attributes)
    );
  }

  // Use the sugar attribute `content` to set innerHTML.
  // Eg: SVG.update(myTextElm, {content: "hello"})
  static update<T extends SVGElement>(
    elm: T,
    attributes: Record<string, AttributeValue>
  ) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'content') {
        elm.innerHTML = '' + value;
      } else {
        elm.setAttribute(key, '' + value);
      }
    });
    return elm;
  }

  // SVG.now() puts an element on the screen for just one frame, after which it's automatically deleted.
  // This allows for immediate-mode rendering — super useful for debug visuals.
  static now(type: string, attributes: Record<string, AttributeValue>) {
    return SVG.add(type, attributes, SVG.nowElm);
  }

  // Called every frame by App, but feel free to call it more frequently if needed
  // (Eg: inside a tool that handles multiple pencil events per frame to see elements from just the final event)
  static clearNow() {
    SVG.nowElm.replaceChildren();
  }

  // SVG.points() helps you build a polyline from Positions (or arrays of Positions).
  // Eg: SVG.now("polyline", { points: SVG.points(stroke.points), stroke: "#00F" });
  // Eg: SVG.now("polyline", { points: SVG.points(pos1, pos2, posArr), stroke: "#F00" });
  static points(...positions: (Position | Position[])[]) {
    return positions
      .flat()
      .map(p => p.x + ' ' + p.y)
      .join(' ');
  }
}

// Deprecated — use SVG.update()
export const updateSvgElement = SVG.update;

// Maybe deprecate in favor of SVG.points?
// TODO: maybe this should live somewhere else, tbd
export function generatePathFromPoints(
  points: (Position | PositionWithPressure)[]
) {
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}
