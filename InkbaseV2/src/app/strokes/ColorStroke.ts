import Stroke from './Stroke';
import SVG from '../Svg';
import { PositionWithPressure } from '../../lib/types';

export default class ColorStroke extends Stroke {
  constructor(points: PositionWithPressure[]) {
    super(points);
    this.element = SVG.add('g', { fill: 'none', 'stroke-width': 2 });
  }

  render() {
    this.element.replaceChildren();

    this.points.forEach((p1, i) => {
      if (i == 0) return;

      let p2 = this.points[i - 1];

      let hue = (360 * i) / this.points.length;

      SVG.add('polyline', {
        points: SVG.points(p1, p2),
        stroke: `hsl(${hue}, 100%, 50%)`,
      });
    });
  }
}
