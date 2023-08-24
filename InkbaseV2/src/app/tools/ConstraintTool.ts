import Page from '../Page';
import Snaps from '../Snaps';
import FreehandStroke from '../strokes/FreehandStroke';
import Tool from './Tool';

export class ConstraintTool extends Tool {
  constructor(
    label: string,
    buttonX: number,
    buttonY: number,
    page: Page,
    private readonly snaps: Snaps
  ) {
    super(label, buttonX, buttonY, page, FreehandStroke);
  }
}
