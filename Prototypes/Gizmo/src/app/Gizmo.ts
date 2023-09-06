import { TAU, clip, lerp } from '../lib/math';
import Events from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import SVG from './Svg';
import Handle from './strokes/Handle';
import Vec from '../lib/vec';

let stroke = {
  fill: 'none',
  'stroke-linecap': 'round',
};

let green = {
  ...stroke,
  stroke: 'color(display-p3 0 1 0.8)',
  'stroke-width': 6,
};

let blue = {
  ...stroke,
  stroke: 'color(display-p3 0 0.7 1)',
  'stroke-width': 6,
};

let a = Handle.create('informal', { x: 500, y: 400 });
let b = Handle.create('informal', { x: 500, y: 200 });

let handles = [a, b];

export default class Gizmo {
  constructor(
    public page: Page,
    public selection: Selection
  ) {}

  render(dt: number, t: number) {
    this.selection.distPos = null;
    this.selection.anglePos = null;

    if (Object.values(this.selection.dragging).length == 2) this.crossbow();
  }

  crossbow() {
    let dist = Vec.dist(a.position, b.position);

    let superA = Vec.lerp(b.position, a.position, 10_000);
    let superB = Vec.lerp(a.position, b.position, 10_000);

    SVG.now('polyline', {
      points: SVG.points(superA, superB),
      ...green,
    });

    let theta = Vec.angle(Vec.sub(b.position, a.position));

    let wedge = Math.PI;

    let C = Vec.avg(a.position, b.position);
    dist /= 2;
    let D = Vec.add(C, Vec.polar(theta, dist));
    let O = Vec.add(C, Vec.polar(theta + wedge / 2, dist));
    let N = Vec.add(C, Vec.polar(theta - wedge / 2, dist));

    let A = {
      d: `
      M ${D.x}, ${D.y}
      A ${dist},${dist} 0 0,1  ${O.x}, ${O.y}
      M ${D.x}, ${D.y}
      A ${dist},${dist} 0 0,0  ${N.x}, ${N.y}
    `,
    };
    SVG.now('path', { ...blue, ...A });

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
    };

    SVG.now('path', { ...blue, ...B });

    this.selection.distPos = C;

    if (this.selection.distLocked) {
    }
  }
}
