import { GameObject } from '../GameObject';
import Stroke from '../strokes/Stroke';

import { PositionWithPressure, PositionWithRadius } from '../../lib/types';

export default class pencil extends GameObject {

  stroke: WeakRef<Stroke> | null = null;
  
  startStroke(point: PositionWithPressure) {
    const s = this.page.addStroke(new Stroke([point]));
    this.stroke = new WeakRef(s);
  }

  extendStroke(point: PositionWithPressure) {
    const s = this.stroke?.deref();
    if(s) {
      s.points.push(point);
    }
  }

  endStroke() {
    this.stroke = null;
  }

  render() {

  }
}