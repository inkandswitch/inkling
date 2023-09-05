import { Position, PositionWithPressure } from '../lib/types';

type AttributeValue = string | number;

const NS = 'http://www.w3.org/2000/svg';

const rootElm = document.querySelector('svg') as SVGSVGElement;
const nowElm = document.querySelector('#now') as SVGGElement;

function add(
  type: string,
  attributes: Record<string, AttributeValue> = {},
  parent: SVGElement = rootElm
) {
  return parent.appendChild(
    update(document.createElementNS(NS, type), attributes)
  );
}

/**
 * Use the sugar attribute `content` to set innerHTML.
 * E.g.: SVG.update(myTextElm, { content: 'hello' })
 */
function update<T extends SVGElement>(
  elm: T,
  attributes: Record<string, AttributeValue>
) {
  Object.entries(attributes).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = ((elm as any).__cache ||= {});
    if (cache[key] === value) {
      return;
    }
    cache[key] = value;

    if (key === 'content') {
      elm.innerHTML = '' + value;
    } else {
      elm.setAttribute(key, '' + value);
    }
  });
  return elm;
}

/**
 * Puts an element on the screen for just one frame, after which it's automatically deleted.
 * This allows for immediate-mode rendering — super useful for debug visuals.
 */
function now(type: string, attributes: Record<string, AttributeValue>) {
  return add(type, attributes, nowElm);
}

/**
 * Called every frame by App, but feel free to call it more frequently if needed
 * (E.g.: inside a tool that handles multiple pencil events per frame to see elements from
 * just the final event)
 */
function clearNow() {
  nowElm.replaceChildren();
}

/**
 * Helps you build a polyline from Positions (or arrays of Positions).
 * E.g.: SVG.now('polyline', { points: SVG.points(stroke.points), stroke: '#00F' });
 * E.g.: SVG.now('polyline', { points: SVG.points(pos1, pos2, posArr), stroke: '#F00' });
 */
function points(...positions: Array<Position | Position[]>) {
  return positions
    .flat()
    .map(p => p.x + ' ' + p.y)
    .join(' ');
}

/** Returns a string that can be used as the 'd' attribute of an SVG path element. */
function path(points: Position[] | PositionWithPressure[]) {
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

const statusElement = add('text', {
  x: 20,
  content: '',
  stroke: '#bbb',
});

let statusHideTimeMillis = 0;

function showStatus(text: string, time = 3_000) {
  update(statusElement, {
    content: text,
    visibility: 'visible',
    y: window.innerHeight - 5,
  });
  statusHideTimeMillis = Date.now() + time;
  setTimeout(() => {
    if (Date.now() >= statusHideTimeMillis) {
      update(statusElement, { visibility: 'hidden' });
    }
  }, time);
}

function text(content: string, attrs = {}) {
  now('text', {
    content,
    x: 100,
    y: 100,
    fill: 'black',
    ...attrs,
  });
}

export default {
  add,
  update,
  now,
  clearNow,
  points,
  path,
  showStatus,
  text,
};
