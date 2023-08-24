import SVG from '../Svg';
import generateId from '../generateId';
import { PositionWithPressure } from '../../lib/types';
import StrokeGroup from './StrokeGroup';
import Vec from '../../lib/vec';

export const STROKE_SVG_PROPERTIES = Object.freeze({
  stroke: 'rgba(0, 0, 0, .5)',
  fill: 'none',
  'stroke-width': 2,
});

export default class FreehandStroke {
  readonly id = generateId();
  private readonly element: SVGElement;
  private needsRerender = true;
  private selected = false;
  public group: StrokeGroup | null = null;

  constructor(public points: Array<PositionWithPressure>) {
    // Store normalised point data based on control points
    this.element = SVG.add('path', {
      d: '',
      ...STROKE_SVG_PROPERTIES,
    });
  }

  updatePath(newPoints: Array<PositionWithPressure>) {
    this.points = newPoints;
    this.needsRerender = true;
  }

  select() {
    this.selected = true;
    this.needsRerender = true;
  }

  deselect() {
    this.selected = false;
    this.needsRerender = true;
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    SVG.update(this.element, {
      d: SVG.path(this.points),
      stroke: this.selected ? 'rgba(255, 0, 0, .5)' : 'rgba(0, 0, 0, .5)',
    });

    this.needsRerender = false;
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
}
