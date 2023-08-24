import { PositionWithPressure } from '../../lib/types';
import Events, { PencilEvent } from '../NativeEvents';
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

export default class FreehandTool extends Tool {
  private modeInfo: ModeInfo = { mode: 'unistroke' };
  private stroke?: FreehandStroke;
  private pencilIsDown = false;
  private needsRerender = false;

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page);
  }

  update(events: Events) {
    const pencilDown = events.did('pencil', 'began') as PencilEvent | undefined;
    if (pencilDown) {
      this.pencilIsDown = true;
      if (!this.stroke) {
        this.startStroke({
          ...pencilDown.position,
          pressure: pencilDown.pressure,
        });
      }
    }

    if (!this.stroke) {
      return;
    }

    const pencilMoves = events.didAll('pencil', 'moved') as PencilEvent[];
    pencilMoves.forEach(pencilMove => {
      this.extendStroke({
        ...pencilMove.position,
        pressure: pencilMove.pressure,
      });
    });

    const pencilUp = events.did('pencil', 'ended');
    if (pencilUp) {
      this.pencilIsDown = false;
    }

    if (!this.pencilIsDown) {
      this.endStroke();
    }
  }

  startStroke(point: PositionWithPressure) {
    this.stroke = this.page.addFreehandStroke([point]);
    if (this.modeInfo.mode === 'multistroke') {
      this.modeInfo.accumulatedStrokes.push(this.stroke);
    }
  }

  extendStroke(point: PositionWithPressure) {
    this.stroke!.points?.push(point);
  }

  endStroke() {
    this.stroke = undefined;
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
