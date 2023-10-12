import { GameObject } from '../GameObject';
import COLORS from '../Colors';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import { MetaConnection, MetaValue } from './MetaSemantics';

export class WirePort extends GameObject {
  position: Position;
  value: MetaValue;

  constructor(position: Position, value: MetaValue) {
    super();
    this.position = position;
    this.value = value;
  }

  render(_dt: number, _t: number): void { }
}

export default class Wire extends GameObject {
  points: Position[] = [];
  a?: WeakRef<WirePort>;
  b?: WeakRef<WirePort>;
  connection: MetaConnection | null = null;

  protected readonly wireElement = SVG.add('polyline', SVG.metaElm, {
    points: '',
    stroke: 'black',
    fill: 'none',
    'stroke-width': '0.5'
  });

  render(): void {
    const a = this.a?.deref();
    const b = this.b?.deref();

    if (a) {
      this.points[0] = a.position;
    }

    if (b) {
      this.points[1] = b.position;
    }

    SVG.update(this.wireElement, { points: SVG.points(this.points) });
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
    this.wireElement.remove();
    super.remove();
  }
}
