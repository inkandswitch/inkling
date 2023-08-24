import Events from '../NativeEvents';
import Page from '../Page';
import FreehandStroke from '../strokes/FreehandStroke';
import StrokeGroup from '../strokes/StrokeGroup';
import Tool from './Tool';

export class ConstraintTool extends Tool {
  private referenceStrokeGroup?: StrokeGroup;

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page, FreehandStroke);
  }

  update(events: Events) {
    super.update(events);
    if (events.did('finger', 'moved')) {
      // This will result in lots of false positives, i.e., it will call
      // onHandleMoved() when no handles were moved. It also won't tell me
      // which handle(s) moved. It's just an expedient way to get something
      // going.
      this.onHandleMoved();

      // TODO: it would be nice if a Tool could just override methods like
      // onHandleMoved() to react to higher-level events.
    }
  }

  private onHandleMoved() {
    // TODO: add constraints relative to selected stroke group
  }
}
