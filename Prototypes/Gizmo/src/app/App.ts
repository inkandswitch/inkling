import { TAU, clip, lerp } from '../lib/math';
import Events from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Selection from './Selection';
import FreehandSelection from './FreehandSelection';
import ToolPicker from './ToolPicker';
import FreehandTool from './tools/FreehandTool';
import FormalTool from './tools/FormalTool';
import ColorTool from './tools/ColorTool';
import Tool from './tools/Tool';
import ConstraintTool from './tools/ConstraintTool';
import SVG from './Svg';
import Handle from './strokes/Handle';
import Stroke from './strokes/Stroke';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import Vec from '../lib/vec';

const events = new Events();
const page = new Page({ strokeAnalyzer: false });
const snaps = new Snaps(page, { handleSnaps: true, alignmentSnaps: false });

const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);

const toolPicker = new ToolPicker([
  new FreehandTool('FREE', 30, 30, page),
  new FormalTool('FORM', 30, 80, page, snaps),
  new ColorTool('COLOR', 30, 130, page),
  new Tool('🧠', 30, 180, page, Stroke),
  new ConstraintTool('CONST', 30, 230, page, {
    vertical: true,
    horizontal: true,
    length: true,
    angle: true,
  }),
]);

let stroke = {
  fill: 'none',
  'stroke-linecap': 'round',
};

let green = {
  ...stroke,
  stroke: 'white',
  'stroke-dasharray': '20 20',
  'stroke-width': 4,
};

let black = {
  ...stroke,
  stroke: 'color(display-p3 0 1 0.8)',
  'stroke-width': 6,
};

let a = Handle.create('informal', { x: 500, y: 400 });
let b = Handle.create('informal', { x: 500, y: 200 });

let handles = new Map();
handles.set(a, { r: 0, seed: 10 });
handles.set(b, { r: 0, seed: 20 });

function gfx(dt: number, t: number) {
  selection.distPos = null;
  selection.anglePos = null;

  handles.forEach((state: Record<string, any>, handle: Handle) => {
    if (Object.values(selection.dragging).includes(handle)) {
      state.r = clip(state.r + dt / 1);
    } else {
      state.r = clip(state.r - dt / 0.3);
    }

    circ(
      8,
      lerp(state.r ** 0.05, 0, 1, 0, 1),
      handle.position.x,
      handle.position.y,
      (t + state.seed) * 15
    );
  });

  if (Object.values(selection.dragging).length == 2) crossbow();
}

function circ(
  radius: number,
  scale: number,
  cx: number,
  cy: number,
  t: number
) {
  SVG.now('circle', {
    r: radius,
    cx,
    cy,
    ...stroke,
    stroke: 'black',
    'stroke-width': 2,
    'stroke-dasharray': '8 4',
    'stroke-dashoffset': t,
    transform: `scale(${scale})`,
    'transform-origin': `${cx} ${cy}`,
  });
}

function crossbow() {
  let stateA = handles.get(a);
  let stateB = handles.get(b);

  let phase = ((stateA.r + stateB.r) / 2) ** 0.1;

  let dist = Vec.dist(a.position, b.position);

  let superA = Vec.lerp(b.position, a.position, 1 + (2000 / dist) * phase);
  let superB = Vec.lerp(a.position, b.position, 1 + (2000 / dist) * phase);

  SVG.now('polyline', {
    points: SVG.points(superA, superB),
    'stroke-dashoffset': -dist / 2,
    ...black,
  });

  SVG.now('polyline', {
    points: SVG.points(superA, superB),
    'stroke-dashoffset': -dist / 2,
    ...green,
  });

  let theta = Vec.angle(Vec.sub(b.position, a.position));

  let wedge = Math.PI * phase;

  let C = Vec.avg(a.position, b.position);
  dist /= 2;
  let D = Vec.add(C, Vec.polar(theta, dist));
  let O = Vec.add(C, Vec.polar(theta + wedge / 2, dist));
  let N = Vec.add(C, Vec.polar(theta - wedge / 2, dist));

  let blue = { stroke: 'color(display-p3 0 0.7 1)' };

  let A = {
    d: `
    M ${D.x}, ${D.y}
    A ${dist},${dist} 0 0,1  ${O.x}, ${O.y}
    M ${D.x}, ${D.y}
    A ${dist},${dist} 0 0,0  ${N.x}, ${N.y}
  `,
    'stroke-dashoffset': -dist / 2,
  };
  SVG.now('path', { ...black, ...blue, ...A });
  SVG.now('path', { ...green, ...A });

  D = Vec.add(C, Vec.polar(theta, -dist));
  O = Vec.add(C, Vec.polar(theta + wedge / 2, -dist));
  N = Vec.add(C, Vec.polar(theta - wedge / 2, -dist));

  let B = {
    d: `
    M ${D.x}, ${D.y}
    A ${dist},${dist} 0 0,1  ${O.x}, ${O.y}
    M ${D.x}, ${D.y}
    A ${dist},${dist} 0 0,0  ${N.x}, ${N.y}
  `,
    'stroke-dashoffset': -dist / 2,
  };

  SVG.now('path', { ...black, ...blue, ...B });
  SVG.now('path', { ...green, ...B });

  SVG.now('circle', {
    r: 50,
    cx: C.x,
    cy: C.y,
    stroke: 'black',
    fill: 'white',
    'stroke-width': 2,
  });
  selection.distPos = C;

  if (selection.distLocked) {
    SVG.now('circle', {
      r: 10,
      cx: C.x,
      cy: C.y,
      fill: 'black',
    });
  }
}

onEveryFrame((dt, t) => {
  SVG.clearNow();

  // handle events
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update(events);
  freehandSelection.update(events);
  events.clear();

  constraints.solve(selection);

  // render everything
  toolPicker.selected?.render();
  snaps.render();
  page.render();
  for (const handle of Handle.all) {
    handle.render();
  }

  gfx(dt, t);
});
