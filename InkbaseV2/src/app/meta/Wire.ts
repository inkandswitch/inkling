import { GameObject } from '../GameObject';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import { MetaConnection, MetaValue } from './MetaSemantics';
import { distanceToPath } from '../../lib/helpers';

// TODO: maybe this shouldn't be a GameObject
export class WirePort extends GameObject {
  position: Position;
  value: MetaValue;

  constructor(position: Position, value: MetaValue) {
    super();
    this.position = position;
    this.value = value;
  }

  distanceToPoint(point: Position) {
    return null;
  }

  render(dt: number, t: number): void {}
}

export default class Wire extends GameObject {
  points: Position[] = [];
  a?: WeakRef<WirePort>;
  b?: WeakRef<WirePort>;
  connection: MetaConnection | null = null;

  protected readonly elm = SVG.add('polyline', SVG.wiresElm, {
    points: '',
    class: 'wire',
  });

  distanceToPoint(point: Position) {
    return distanceToPath(point, this.points);
  }

  togglePaused(isPaused = !this.connection?.paused) {
    return this.connection?.togglePaused(isPaused);
  }

  render(): void {
    const a = this.a?.deref();
    const b = this.b?.deref();

    if (a) {
      this.points[0] = a.position;
    }

    if (b) {
      this.points[1] = b.position;
    }

    SVG.update(this.elm, {
      points: SVG.points(this.points),
      'is-paused': this.connection?.paused,
    });
  }

  isCollapsable() {
    const [p1, p2] = this.points;
    return p1 && p2 && Vec.dist(p1, p2) < 10;
  }

  attachFront(element: WirePort) {
    this.a = new WeakRef(element);
    this.updateConstraint();
  }

  attachEnd(element: WirePort) {
    this.b = new WeakRef(element);
    this.updateConstraint();
  }

  private updateConstraint() {
    const a = this.a?.deref();
    const b = this.b?.deref();
    if (a && b) {
      this.connection = a.value.wireTo(b.value);
    }
  }

  remove(): void {
    this.elm.remove();
    super.remove();
  }
}

export const aWire = (g: GameObject) => (g instanceof Wire ? g : null);
