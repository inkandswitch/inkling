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
import { GameObject } from './GameObject';

function stroke(color: string, width = 6) {
  return {
    stroke: color,
    fill: 'none',
    'stroke-linecap': 'round',
    'stroke-width': width,
  };
}

const green = 'color(display-p3 0 1 0.8)';
const grey = 'color(display-p3 0.8 0.8 0.8)';

class GizmoInstance extends GameObject {
  line: Line;
  center: Position;
  radius: number;

  visible = true;

  polarVectorConstraint: constraints.AddConstraintResult<'angle' | 'distance'>;
  distanceConstraint: constraints.AddConstraintResult<never> | undefined;
  angleConstraint: constraints.AddConstraintResult<never> | undefined;

  constructor(
    // TODO: these guys should be weak refs
    public a: Handle,
    public b: Handle
  ) {
    super();
    this.line = this.updateLine();
    this.center = this.updateCenter();
    this.radius = this.updateRadius();
    this.polarVectorConstraint = constraints.polarVector(a, b);
  }

  updateLine() {
    const { a, b } = this;
    // let a_b = Vec.renormalize(Vec.sub(b.position, a.position), 10000);
    // return (this.line = Line(
    //   Vec.sub(a.position, a_b),
    //   Vec.add(b.position, a_b)
    // ));
    return (this.line = Line(a.position, b.position));
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
    return (this.radius = 20);
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

      const d = Vec.dist(this.center, fingerUp.position);
      if (Math.abs(d - this.radius) < 20) {
        this.toggleAngle();
        return true;
      }

      if (Line.distToPoint(this.line, fingerUp.position) < 20) {
        this.toggleDistance();
        return true;
      }
    }

    return false;
  }

  tap(pos: Position) {
    if (Vec.dist(this.center, pos) < this.radius * 2) {
      this.toggleAngle();
    } else {
      this.toggleDistance();
    }
  }

  toggleDistance() {
    if (!this.distanceConstraint) {
      this.distanceConstraint = constraints.constant(
        this.polarVectorConstraint.variables.distance,
        Vec.dist(this.a.position, this.b.position)
      );
    } else {
      this.distanceConstraint.remove();
      this.distanceConstraint = undefined;
    }
  }

  toggleAngle() {
    if (!this.angleConstraint) {
      this.angleConstraint = constraints.constant(
        this.polarVectorConstraint.variables.angle,
        Vec.angle(Vec.sub(this.b.position, this.a.position))
      );
    } else {
      this.angleConstraint.remove();
      this.angleConstraint = undefined;
    }
  }

  render() {
    this.updateLine();
    this.updateCenter();
    this.updateRadius();

    if (!this.visible) {
      return;
    }

    const angle = Vec.angle(Vec.sub(this.b.position, this.a.position));

    const d = [
      SVG.arcPath(this.center, 20, angle - TAU / 4, Math.PI / 3),
      SVG.arcPath(this.center, 20, angle + TAU / 4, Math.PI / 3),
    ].join();

    SVG.now('path', { d, ...stroke(this.angleConstraint ? green : grey) });

    SVG.now('polyline', {
      points: SVG.points(this.a.position, this.b.position),
      ...stroke(this.distanceConstraint ? green : grey, 3),
    });
  }

  distanceToPoint(point: Position) {
    const l = Line.distToPoint(this.line, point);
    const a = Vec.dist(this.center, point);
    return Math.min(l, a);
  }
}

export default class Gizmo {
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
    for (const { a, b } of this.page.strokeGroups) {
      this.findOrCreate(a, b);
    }
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
      const { a: _a1, b: _b1 } = this.addStrokeGroup(a, b);
    }
  }

  update(events: Events) {
    if (!this.enabled) {
      return;
    }

    // Assume all gizmos will be hidden
    // this.all.forEach(v => (v.visible = false));

    this.selection.touchingGizmo = false;

    for (const { a, b } of this.page.strokeGroups) {
      const gizmo = this.findOrCreate(a, b);
      if (gizmo.visible || a.isSelected || b.isSelected) {
        gizmo.visible = true; // Show this gizmo
        const didTouch = gizmo.update(events);
        this.selection.touchingGizmo ||= didTouch;
      } else {
        gizmo.visible = false;
      }
    }
  }

  // TODO: chat w/ Ivan about what happens to gizmos when handles are absorbed / broken off
  private findOrCreate(a: Handle, b: Handle) {
    // Sort a and b so that a has the lower id
    if (a.id > b.id) {
      [a, b] = [b, a];
    }

    for (const gizmo of a.children) {
      if (gizmo instanceof GizmoInstance && gizmo.a === a && gizmo.b === b) {
        return gizmo;
      }
    }

    const giz = new GizmoInstance(a, b);
    a.adopt(giz);
    return giz;
  }

  // render(dt: number, t: number) {
  //   this.all.forEach(gizmo => gizmo.render(dt, t));
  //   this.selection.distPos = null;
  //   this.selection.anglePos = null;
  //   if (Object.values(this.selection.dragging).length == 2) this.crossbow();
  // }

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

export const isGizmoInstance = (
  gameObj: GameObject
): gameObj is GizmoInstance => gameObj instanceof GizmoInstance;
