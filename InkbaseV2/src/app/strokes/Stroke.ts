import SVG from '../Svg';
import { PositionWithPressure } from '../../lib/types';
import { GameObject } from '../GameObject';

export default class Stroke extends GameObject {
  protected element = SVG.add('polyline', {
    fill: 'none',
    stroke: '#000',
    'stroke-width': 2,
  });

  constructor(public points: PositionWithPressure[]) {
    super();
  }

  render(): void {
    SVG.update(this.element, { points: SVG.points(this.points) });
  }
}
