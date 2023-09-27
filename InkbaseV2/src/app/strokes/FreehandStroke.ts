import { PositionWithPressure } from '../../lib/types';
import { generateId } from '../../lib/helpers';
import StrokeGroup from './StrokeGroup';
import Vec from '../../lib/vec';
import Stroke from './Stroke';
import SVG from '../Svg';
import { GameObject } from '../GameObject';

export default class FreehandStroke extends Stroke {
  readonly id = generateId();
  private selected = false;
  public group: StrokeGroup | null = null;
  private highlight = SVG.add('polyline', {
    fill: 'none',
    stroke: 'rgba(255, 255, 0, 0.25)',
    'stroke-width': 12,
    visibility: 'hidden',
  });

  constructor(points: PositionWithPressure[]) {
    super(points);
    SVG.update(this.element, { stroke: 'rgba(0, 0, 0, .5)' });
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
    SVG.update(this.highlight, {
      points: this.element.getAttribute('points')!,
      visibility: this.selected ? 'visible' : 'hidden',
    });
  }

  getLocalDirection(index: number) {
    const a = this.points[Math.max(index - 10, 0)];
    const b = this.points[Math.min(index + 10, this.points.length - 1)];

    return Vec.normalize(Vec.sub(b, a));
  }

  distanceBetweenPoints(pIdx1: number, pIdx2: number) {
    let dist = 0;
    for (let i = pIdx1; i < pIdx2 - 1; i++) {
      const pointA = this.points[i];
      const pointB = this.points[i + 1];
      dist += Vec.dist(pointA, pointB);
    }

    return dist;
  }
}

export const freehandStrokePred = (gameObj: GameObject) =>
  gameObj instanceof FreehandStroke ? gameObj : null;
