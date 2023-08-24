import Vec from '../../lib/vec';
import { PositionWithPressure, PositionWithRadius } from '../../lib/types';
import Page from '../Page';
import Tool from './Tool';
import ColorStroke from '../strokes/ColorStroke';

export default class ColorTool extends Tool {
  last?: PositionWithPressure;

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page);
  }

  startStroke(point: PositionWithPressure) {
    this.stroke = this.page.addStroke(new ColorStroke([point]));
    this.last = point;
  }

  extendStroke(point: PositionWithPressure) {
    if (this.last && Vec.dist(this.last, point) > 50) {
      this.stroke?.points?.push(point);
      this.last = point;
    }
  }
}
