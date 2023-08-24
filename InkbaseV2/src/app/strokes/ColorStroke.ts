import Stroke from './Stroke';
import SVG from '../Svg';
import { PositionWithPressure } from '../../lib/types';

export default class ColorStroke extends Stroke {
  lastLength = 0;

  constructor(points: PositionWithPressure[]) {
    super(points);
    this.element = SVG.add('g', { fill: 'none', 'stroke-width': 2 });
  }

  render() {
    if (this.points.length == this.lastLength) return;
    this.lastLength = this.points.length;

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
