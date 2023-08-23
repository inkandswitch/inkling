import SVG from '../Svg';
import generateId from '../generateId';
import { PositionWithPressure } from '../../lib/types';
import StrokeGroup from './StrokeGroup';

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

    const path = SVG.generatePathFromPoints(this.points);
    SVG.update(this.element, {
      d: path,
      stroke: this.selected ? 'rgba(255, 0, 0, .5)' : 'rgba(0, 0, 0, .5)',
    });

    this.needsRerender = false;
  }
}
