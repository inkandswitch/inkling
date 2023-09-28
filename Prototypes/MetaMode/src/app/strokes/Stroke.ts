import SVG from '../Svg';
import { PositionWithPressure } from '../../lib/types';

export default class Stroke {
  color: string = "#000"

  protected element = SVG.add('polyline', {
    fill: 'none',
    stroke: this.color,
    'stroke-width': 2,
  });

  constructor(public points: PositionWithPressure[]) {}

  render(): void {
    SVG.update(this.element, { points: SVG.points(this.points), stroke: this.color });
  }
}
