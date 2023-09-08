import { TAU, clip, lerp } from '../lib/math';
import Events from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import SVG from './Svg';
import Handle from './strokes/Handle';
import Vec from '../lib/vec';
import { Position } from '../lib/types';
import FreehandStroke from './strokes/FreehandStroke';
import * as constraints from './constraints';
import Line from '../lib/line';

const stroke = {
  fill: 'none',
  'stroke-linecap': 'round',
};

const green = {
  ...stroke,
  stroke: 'color(display-p3 0 1 0.8)',
  'stroke-width': 6,
};

const blue = {
  ...stroke,
  stroke: 'color(display-p3 0.8 0.8 0.8)',
  'stroke-width': 6,
};

class GizmoInstance {
  private line: Line;
  private center: Position;
  private radius: number;

  visible = true;

  polarVectorConstraint: constraints.AddConstraintResult<'angle' | 'distance'>;
  distanceConstraint: constraints.AddConstraintResult<never> | undefined;
  angleConstraint: constraints.AddConstraintResult<never> | undefined;

  constructor(
    public a: Handle,
    public b: Handle
  ) {
    this.line = this.updateLine();
    this.center = this.updateCenter();
    this.radius = this.updateRadius();
    this.polarVectorConstraint = constraints.polarVector(a, b);
  }

  updateLine() {
    const { a, b } = this;
    const a_b = Vec.renormalize(Vec.sub(b.position, a.position), 10000);
    return (this.line = Line(
      Vec.sub(a.position, a_b),
      Vec.add(b.position, a_b)
    ));
  }

  updateCenter() {
    return (this.center = Vec.avg(this.a.position, this.b.position));
  }

  updateRadius() {
    // let d = Vec.dist(this.b.position, this.a.position) / 2;
    // let unscaled = lerp(d, 100, 200, 0, 1, true);
    // let curved = 0.5 + 0.5 * unscaled ** 2;
    // let scaled = lerp(curved, 0, 1, 100, 200, true);
    // return (this.radius = Math.max(d, scaled));
    return (this.radius = 50);
  }

  update(events: Events) {
    const fingerDown = events.find('finger', 'began');

    if (fingerDown) {
      const dist = Line.distToPoint(this.line, fingerDown.position);
      if (dist < 20) {
        return true;
      }
    }

    // const fingerMove = events.findLast('finger', 'moved');
    // if (fingerMove) {
    //   return true;
    // }

    const fingerUp = events.find('finger', 'ended');

    if (fingerUp) {
      if (Vec.dist(this.a.position, fingerUp.position) < 20) {
        return true;
      }
      if (Vec.dist(this.b.position, fingerUp.position) < 20) {
        return true;
      }

      if (Line.distToPoint(this.line, fingerUp.position) < 20) {
        if (!this.distanceConstraint) {
          this.distanceConstraint = constraints.constant(
            this.polarVectorConstraint.variables.distance,
            Vec.dist(this.a.position, this.b.position)
          );
        } else {
          this.distanceConstraint.remove();
          this.distanceConstraint = undefined;
        }

        return true;
      }

      const d = Vec.dist(this.center, fingerUp.position);
      if (Math.abs(d - this.radius) < 20) {
        if (!this.angleConstraint) {
          this.angleConstraint = constraints.constant(
            this.polarVectorConstraint.variables.angle,
            Vec.angle(Vec.sub(this.b.position, this.a.position))
          );
        } else {
          this.angleConstraint.remove();
          this.angleConstraint = undefined;
        }

        return true;
      }
    }

    return false;
  }

  render(_dt: number, _t: number) {
    this.updateLine();
    this.updateCenter();
    this.updateRadius();

    if (!this.visible) {
      return;
    }

    SVG.now('polyline', {
      points: SVG.points(this.line.a, this.line.b),
      ...(this.distanceConstraint ? green : blue),
    });

    SVG.now('circle', {
      cx: this.center.x,
      cy: this.center.y,
      r: this.radius,
      ...(this.angleConstraint ? green : blue),
    });
  }
}

export default class Gizmo {
  all: GizmoInstance[] = [];

  constructor(
    public page: Page,
    public selection: Selection,
    public enabled = true
  ) {
    if (!enabled) {
      return;
    }
    this.createStructure(
      { x: 100, y: 500 },
      { x: 400, y: 400 },
      { x: 500, y: 200 },
      { x: 600, y: 100 },
      { x: 700, y: 300 },
      { x: 600, y: 500 },
      { x: 900, y: 600 }
    );
    this.page.strokeGroups.forEach(strokeGroup => {
      const { a, b } = strokeGroup;
      this.findOrCreate(a, b);
    });
  }

  private addStrokeGroup(p1: Position, p2: Position) {
    const stroke = this.page.addStroke(
      new FreehandStroke([
        { ...p1, pressure: 1 },
        { ...p2, pressure: 1 },
      ])
    );
    return this.page.addStrokeGroup(new Set([stroke]));
  }

  private createStructure(...positions: Position[]) {
    for (let i = 1; i < positions.length; i++) {
      const a = positions[i - 1];
      const b = positions[i];
      const { a: a1, b: b1 } = this.addStrokeGroup(a, b);
    }
  }

  update(events: Events) {
    if (!this.enabled) {
      return;
    }

    // Assume all gizmos will be hidden
    // this.all.forEach(v => (v.visible = false));

    this.selection.touchingGizmo = false;

    this.page.strokeGroups.forEach(strokeGroup => {
      const { a, b } = strokeGroup;
      if (a.isSelected || b.isSelected) {
        const gizmo = this.findOrCreate(a, b);
        gizmo.visible = true; // Show this gizmo
        const didTouch = gizmo.update(events);
        this.selection.touchingGizmo ||= didTouch;
      }
    });
  }

  private findOrCreate(a: Handle, b: Handle) {
    // Sort a and b so that a has the lower id
    if (a.id > b.id) {
      [a, b] = [b, a];
    }
    let giz = this.all.find(gizmo => gizmo.a === a && gizmo.b === b);
    if (!giz) {
      this.all.push((giz = new GizmoInstance(a, b)));
    }
    return giz;
  }

  render(dt: number, t: number) {
    this.all.forEach(gizmo => gizmo.render(dt, t));
    //   this.selection.distPos = null;
    //   this.selection.anglePos = null;
    //   if (Object.values(this.selection.dragging).length == 2) this.crossbow();
  }

  // crossbow() {
  //   let dist = Vec.dist(a.position, b.position);

  //   let superA = Vec.lerp(b.position, a.position, 10_000);
  //   let superB = Vec.lerp(a.position, b.position, 10_000);

  //   SVG.now('polyline', {
  //     points: SVG.points(superA, superB),
  //     ...green,
  //   });

  //   let theta = Vec.angle(Vec.sub(b.position, a.position));

  //   let wedge = Math.PI;

  //   let C = Vec.avg(a.position, b.position);
  //   dist /= 2;
  //   let D = Vec.add(C, Vec.polar(theta, dist));
  //   let O = Vec.add(C, Vec.polar(theta + wedge / 2, dist));
  //   let N = Vec.add(C, Vec.polar(theta - wedge / 2, dist));

  //   let A = {
  //     d: `
  //     M ${D.x}, ${D.y}
  //     A ${dist},${dist} 0 0,1  ${O.x}, ${O.y}
  //     M ${D.x}, ${D.y}
  //     A ${dist},${dist} 0 0,0  ${N.x}, ${N.y}
  //   `,
  //   };
  //   SVG.now('path', { ...blue, ...A });

  //   D = Vec.add(C, Vec.polar(theta, -dist));
  //   O = Vec.add(C, Vec.polar(theta + wedge / 2, -dist));
  //   N = Vec.add(C, Vec.polar(theta - wedge / 2, -dist));

  //   let B = {
  //     d: `
  //     M ${D.x}, ${D.y}
  //     A ${dist},${dist} 0 0,1  ${O.x}, ${O.y}
  //     M ${D.x}, ${D.y}
  //     A ${dist},${dist} 0 0,0  ${N.x}, ${N.y}
  //   `,
  //   };

  //   SVG.now('path', { ...blue, ...B });

  //   this.selection.distPos = C;

  //   if (this.selection.distLocked) {
  //   }
  // }
}
