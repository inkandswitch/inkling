import { Position, PositionWithPressure } from '../../lib/types';
import { generateId } from '../../lib/helpers';
import StrokeGroup from './StrokeGroup';
import Vec from '../../lib/vec';
import Stroke from './Stroke';
import SVG from '../Svg';

export default class FreehandStroke extends Stroke {
  readonly id = generateId();
  private selected = false;
  public group: StrokeGroup | null = null;

  constructor(points: PositionWithPressure[]) {
    super(points);
    this.element = SVG.add('polyline', {
      fill: 'none',
      stroke: 'rgba(0, 0, 0, .5)',
      'stroke-width': 2,
    });
  }

  updatePath(newPoints: Array<PositionWithPressure>) {
    this.points = newPoints;
  }

  select() {
    this.selected = true;
  }

  deselect() {
    this.selected = false;
  }

  render() {
    super.render();
    SVG.update(this.element, {
      stroke: this.selected ? 'rgba(255, 0, 0, .5)' : 'rgba(0, 0, 0, .5)',
    });
  }

  getLocalDirection(index: number) {
    const a = this.points[Math.max(index - 10, 0)];
    const b = this.points[Math.min(index + 10, this.points.length - 1)];

    return Vec.normalize(Vec.sub(b, a));
  }

  distanceBetweenPoints(a: number, b: number) {
    let dist = 0;
    for (let i = a; i < b - 1; i++) {
      const pointA = this.points[i];
      const pointB = this.points[i + 1];
      dist += Vec.dist(pointA, pointB);
    }

    return dist;
  }

  minDistanceFrom(pos: Position) {
    let minDistance = Infinity;
    for (const point of this.points) {
      minDistance = Math.min(minDistance, Vec.dist(point, pos));
    }
    return minDistance;
  }
}
