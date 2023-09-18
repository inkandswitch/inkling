import SVG from '../Svg';
import { PositionWithPressure } from '../../lib/types';

export default class Stroke {
  protected element = SVG.add('polyline', {
    fill: 'none',
    stroke: '#000',
    'stroke-width': 2,
  });

  constructor(public points: PositionWithPressure[]) {}

  render(): void {
    SVG.update(this.element, { points: SVG.points(this.points) });
  }
}
