import { GameObject } from '../GameObject';
import COLORS from './Colors';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import * as constraints from '../constraints';

export interface Wireable {
  midPoint(): Position;
  getVariable(): constraints.Variable;
}

export default class Wire extends GameObject {
  points: Position[] = [];
  a?: WeakRef<Wireable>;
  b?: WeakRef<Wireable>;

  protected readonly wireElement = SVG.add('polyline', {
    points: '',
    stroke: COLORS.BLUE,
    fill: 'none',
  });

  render(): void {
    const a = this.a?.deref();
    const b = this.b?.deref();

    if (a) {
      this.points[0] = a.midPoint();
    }

    if (b) {
      this.points[1] = b.midPoint();
    }

    SVG.update(this.wireElement, { points: SVG.points(this.points) });
  }

  isCollapsable() {
    const [p1, p2] = this.points;
    return p1 && p2 && Vec.dist(p1, p2) < 10;
  }

  attachFront(element: Wireable) {
    this.a = new WeakRef(element);
    this.updateConstraint();
  }

  attachEnd(element: Wireable) {
    this.b = new WeakRef(element);
    this.updateConstraint();
  }

  updateConstraint() {
    const a = this.a?.deref();
    const b = this.b?.deref();
    if (a && b) {
      constraints.equals(a.getVariable(), b.getVariable());
    }
  }

  remove(): void {
    this.wireElement.remove();
    super.remove();
  }
}
