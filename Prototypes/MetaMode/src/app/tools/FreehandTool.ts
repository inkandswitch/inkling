import { PositionWithPressure } from '../../lib/types';
import Page from '../Page';
import SVG from '../Svg';
import FreehandStroke from '../strokes/FreehandStroke';
import Tool from './Tool';

type ModeInfo =
  | { mode: 'unistroke' }
  | {
      mode: 'multistroke';
      accumulatedStrokes: FreehandStroke[];
      multistrokeModeDotElement: SVGElement;
    };

export default class FreehandTool extends Tool<FreehandStroke> {
  private modeInfo: ModeInfo = { mode: 'unistroke' };

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page, FreehandStroke);
  }

  startStroke(point: PositionWithPressure) {
    super.startStroke(point);
    if (this.modeInfo.mode === 'multistroke') {
      this.modeInfo.accumulatedStrokes.push(this.stroke!);
    }
  }

  onAction() {
    this.toggleModes();
  }

  onDeselected() {
    super.onDeselected();
    this.setMode('unistroke');
  }

  private toggleModes() {
    this.setMode(
      this.modeInfo.mode === 'unistroke' ? 'multistroke' : 'unistroke'
    );
  }

  private setMode(mode: ModeInfo['mode']) {
    switch (mode) {
      case 'multistroke':
        if (this.modeInfo.mode !== 'multistroke') {
          this.modeInfo = {
            mode: 'multistroke',
            accumulatedStrokes: [],
            multistrokeModeDotElement: SVG.add('circle', {
              cx: this.buttonX,
              cy: this.buttonY,
              r: 17,
              stroke: '#fff',
              fill: 'none',
            }),
          };
        }
        break;
      case 'unistroke':
        if (this.modeInfo.mode !== 'unistroke') {
          this.addStrokeGroupForAccumulatedStrokes(
            this.modeInfo.accumulatedStrokes
          );
          this.modeInfo.multistrokeModeDotElement.remove();
          this.modeInfo = { mode: 'unistroke' };
        }
        break;
      default:
        throw new Error('unsupported mode: ' + mode);
    }
  }

  private addStrokeGroupForAccumulatedStrokes(
    accumulatedStrokes: FreehandStroke[]
  ) {
    accumulatedStrokes = accumulatedStrokes.filter(stroke => !stroke.group);
    if (accumulatedStrokes.length > 0) {
      this.page.addStrokeGroup(new Set(accumulatedStrokes));
    }
  }
}
