import Vec from '../../lib/vec';
import { PositionWithPressure } from '../../lib/types';
import Tool from './Tool';
import ColorStroke from '../strokes/ColorStroke';

export default class ColorTool extends Tool<ColorStroke> {
  last?: PositionWithPressure;

  constructor(label: string, buttonX: number, buttonY: number) {
    super(label, buttonX, buttonY, ColorStroke);
  }

  startStroke(point: PositionWithPressure) {
    super.startStroke(point);
    this.last = point;
  }

  extendStroke(point: PositionWithPressure) {
    if (this.last && Vec.dist(this.last, point) > 50) {
      super.extendStroke(point);
      this.last = point;
    }
  }
}
