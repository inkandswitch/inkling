import { PositionWithPressure } from '../../lib/types';
import Events, { PencilEvent } from '../NativeEvents';
import Page from '../Page';
import SVG from '../Svg';
import FreehandStroke, {
  STROKE_SVG_PROPERTIES,
} from '../strokes/FreehandStroke';
import { Tool } from './Tool';

type ModeInfo =
  | { mode: 'unistroke' }
  | {
      mode: 'multistroke';
      accumulatedStrokes: FreehandStroke[];
      multistrokeModeDotElement: SVGElement;
    };

export default class FreehandTool extends Tool {
  private modeInfo: ModeInfo = { mode: 'unistroke' };
  private points?: Array<PositionWithPressure>;
  private strokeElement: SVGElement;
  private pencilIsDown = false;
  private needsRerender = false;

  constructor(
    buttonX: number,
    buttonY: number,
    private page: Page
  ) {
    super(buttonX, buttonY);
    this.strokeElement = SVG.add('path', {
      d: '',
      ...STROKE_SVG_PROPERTIES,
    });
  }

  update(events: Events) {
    const pencilDown = events.did('pencil', 'began') as PencilEvent | undefined;
    if (pencilDown) {
      this.pencilIsDown = true;
      if (!this.points) {
        this.startStroke({
          ...pencilDown.position,
          pressure: pencilDown.pressure,
        });
      }
    }

    if (!this.points) {
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

  private startStroke(point: PositionWithPressure) {
    this.points = [point];
    this.needsRerender = true;
  }

  private extendStroke(point: PositionWithPressure) {
    this.points!.push(point);
    this.needsRerender = true;
  }

  private endStroke() {
    const stroke = this.page.addFreehandStroke(this.points!);
    if (this.modeInfo.mode === 'multistroke') {
      this.modeInfo.accumulatedStrokes.push(stroke);
    }
    this.points = undefined;
    this.needsRerender = true;
  }

  onAction() {
    this.toggleModes();
  }

  onDeselected() {
    if (this.points) {
      this.endStroke();
      this.updatePath();
    }

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
              r: 10,
              fill: 'white',
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

  render() {
    if (!this.needsRerender) {
      return;
    }

    this.updatePath();
    this.needsRerender = false;
  }

  private updatePath() {
    SVG.update(this.strokeElement, {
      d: this.points ? SVG.path(this.points) : '',
    });
  }
}
