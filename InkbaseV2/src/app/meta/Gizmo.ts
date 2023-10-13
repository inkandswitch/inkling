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

  private g = SVG.add('g', SVG.metaElm, { class: 'gizmo' });
  private path = SVG.add('path', this.g);
  private polyline = SVG.add('polyline', this.g);

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
      constraints.polarVector(a, b).variables);
    this.angleInDegrees = constraints.linearRelationship(
      180 / Math.PI,
      this.angleInRadians,
      0
    ).variables.y;

    // this helps w/ debugging
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

  toggleDistance() {
    this.distance.toggleLock();
  }

  toggleAngle() {
    // doesn't matter which angle we lock, one is absorbed by the other
    // so they share the same lock
    this.angleInRadians.toggleLock();
  }

  render() {
    this.updateCenter();

    this.wirePort.position = this.center;

    const handles = this.handles;
    if (!handles) {
      return;
    }

    const angle = Vec.angle(Vec.sub(handles.b.position, handles.a.position));

    const d = [
      SVG.arcPath(this.center, 20, angle - TAU / 4, Math.PI / 3),
      SVG.arcPath(this.center, 20, angle + TAU / 4, Math.PI / 3),
    ].join();

    SVG.update(this.path, { d });
    SVG.update(this.polyline, {
      points: SVG.points(handles.a.position, handles.b.position),
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
}

export const aGizmo = (gameObj: GameObject) =>
  gameObj instanceof Gizmo ? gameObj : null;
