import { TAU } from '../../lib/math';
import SVG from '../Svg';
import Handle from '../ink/Handle';
import Vec from '../../lib/vec';
import { Position } from '../../lib/types';
import * as constraints from '../constraints';
import { Variable } from '../constraints';
import Line from '../../lib/line';
import { GameObject } from '../GameObject';
import { WirePort } from './Wire';
import { MetaLabel, MetaStruct } from './MetaSemantics';

export default class Gizmo extends GameObject {
  center: Position;

  private elm = SVG.add('g', SVG.gizmoElm, { class: 'gizmo' });
  private arcs = SVG.add('g', this.elm);
  private arc1 = SVG.add('path', this.arcs, {
    d: SVG.arcPath(Vec.zero, 10, TAU / 4, Math.PI / 3),
  });
  private arc2 = SVG.add('path', this.arcs, {
    d: SVG.arcPath(Vec.zero, 10, TAU / 4, Math.PI / 3),
  });
  private thickLine = SVG.add('polyline', this.elm, { class: 'thickLine' });
  private thinLine = SVG.add('polyline', this.elm, { class: 'thinLine' });

  readonly distance: Variable;
  readonly angleInRadians: Variable;
  readonly angleInDegrees: Variable;
  private readonly _a: WeakRef<Handle>;
  private readonly _b: WeakRef<Handle>;

  readonly wirePort: WirePort;

  get a(): Handle | undefined {
    return this._a.deref();
  }

  get b(): Handle | undefined {
    return this._b.deref();
  }

  get handles() {
    const a = this.a;
    const b = this.b;
    return a && b ? { a, b } : null;
  }

  constructor(a: Handle, b: Handle) {
    super();
    this._a = new WeakRef(a);
    this._b = new WeakRef(b);
    this.center = this.updateCenter();
    ({ distance: this.distance, angle: this.angleInRadians } =
      constraints.polarVector(a, b));
    this.angleInDegrees = constraints.linearRelationship(
      constraints.variable((this.angleInRadians.value * 180) / Math.PI),
      180 / Math.PI,
      this.angleInRadians,
      0
    ).y;

    this.distance.represents = {
      object: this,
      property: 'distance',
    };
    this.angleInRadians.represents = {
      object: this,
      property: 'angle-radians',
    };
    this.angleInDegrees.represents = {
      object: this,
      property: 'angle-degrees',
    };

    this.wirePort = this.adopt(
      new WirePort(
        this.center,
        new MetaStruct([
          new MetaLabel('distance', this.distance),
          new MetaLabel('angle', this.angleInDegrees),
        ])
      )
    );
  }

  updateCenter() {
    const handles = this.handles;
    if (!handles) {
      return this.center;
    }

    return (this.center = Vec.avg(handles.a.position, handles.b.position));
  }

  midPoint() {
    return this.center;
  }

  cycleConstraints() {
    const aLock = this.angleInRadians.isLocked;
    const dLock = this.distance.isLocked;

    // There's probably some smarter way to do this with a bitmask or something
    // but this is just a temporary hack so don't bother
    if (!aLock && !dLock) {
      this.toggleDistance();
    } else if (dLock && !aLock) {
      this.toggleAngle();
    } else if (dLock && aLock) {
      this.toggleDistance();
    } else if (!dLock && aLock) {
      this.toggleAngle();
    }
  }

  toggleDistance() {
    this.distance.toggleLock();
  }

  toggleAngle() {
    // doesn't matter which angle we lock, one is absorbed by the other
    // so they this results in locking/unlocking both
    this.angleInRadians.toggleLock();
  }

  render() {
    this.updateCenter();

    this.wirePort.position = this.center;

    const handles = this.handles;
    if (!handles) {
      return;
    }

    const angle = this.angleInDegrees.value;
    const aLock = this.angleInRadians.isLocked;
    const dLock = this.distance.isLocked;

    const xOffset = aLock ? 0 : dLock ? 9.4 : 12;
    const yOffset = dLock ? -3.5 : 0;

    SVG.update(this.elm, {
      'is-constrained': aLock || dLock,
    });

    SVG.update(this.arcs, {
      style: `transform: translate(${this.center.x}px, ${this.center.y}px) rotate(${angle}deg)`,
    });
    SVG.update(this.arc1, {
      style: `transform: translate(${xOffset}px, ${yOffset}px)`,
    });
    SVG.update(this.arc2, {
      style: `transform: rotate(${180}deg) translate(${xOffset}px, ${yOffset}px)`,
    });

    const a = handles.a.position;
    const b = handles.b.position;
    let ab = Vec.sub(b, a);

    let _a = Vec.sub(this.center, Vec.renormalize(ab, 22));
    let _b = Vec.add(this.center, Vec.renormalize(ab, 22));

    SVG.update(this.thickLine, {
      points: SVG.points(_a, _b),
    });

    _a = Vec.add(a, Vec.renormalize(ab, 0));
    _b = Vec.sub(b, Vec.renormalize(ab, 0));

    SVG.update(this.thinLine, {
      points: SVG.points(_a, _b),
    });
  }

  distanceToPoint(point: Position) {
    if (!this.handles) {
      return Infinity;
    }
    const line = Line(this.handles.a.position, this.handles.b.position);
    const l = Line.distToPoint(line, point);
    const a = Vec.dist(this.center, point);
    return Math.min(l, a);
  }

  remove() {
    this.elm.remove();
    this.a?.remove();
    this.b?.remove();
    super.remove();
  }
}

export const aGizmo = (gameObj: GameObject) =>
  gameObj instanceof Gizmo ? gameObj : null;
