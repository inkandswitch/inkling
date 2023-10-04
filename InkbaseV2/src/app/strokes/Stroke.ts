import SVG from '../Svg';
import { Position, PositionWithPressure } from '../../lib/types';
import { GameObject } from '../GameObject';
import Vec from '../../lib/vec';
import Line from '../../lib/line';
import Rect from '../../lib/rect';

export default class Stroke extends GameObject {
  color: string = "#000"

  protected element = SVG.add('polyline', {
    fill: 'none',
    stroke: this.color,
    'stroke-width': 2,
  });

  constructor(public points: PositionWithPressure[]) {
    super();
  }

  render(): void {
    SVG.update(this.element, { points: SVG.points(this.points), stroke: this.color });
  }

  distanceToPoint(pos: Position): number | null {
    switch (this.points.length) {
      case 0:
        return null;
      case 1:
        return Vec.dist(pos, this.points[0]);
      default: {
        let minDist = Infinity;
        for (let idx = 0; idx < this.points.length - 1; idx++) {
          const p1 = this.points[idx];
          const p2 = this.points[idx + 1];
          minDist = Math.min(minDist, Line.distToPoint(Line(p1, p2), pos));
        }
        return minDist;
      }
    }
  }

  overlapsRect(rect: Rect): boolean {
    for(const point of this.points) {
      if(Rect.isPointInside(rect, point)) {
        return true;
      }
    }
    return false;
  }

  remove(): void {
    this.element.remove();
    super.remove();
  }
}


export const aStroke = (gameObj: GameObject) =>
  gameObj instanceof Stroke ? gameObj : null;
