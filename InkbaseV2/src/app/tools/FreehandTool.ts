import { PositionWithPressure } from '../../lib/types';
import Events, { PencilEvent } from '../NativeEvents';
import Page from '../Page';
import SVG from '../Svg';
import { STROKE_SVG_PROPERTIES } from '../strokes/FreehandStroke';
import { Tool } from './Tool';

type Mode = 'unistroke' | 'multistroke';

export default class FreehandTool extends Tool {
  private mode: Mode = 'unistroke';
  private points?: Array<PositionWithPressure>;
  private strokeElement: SVGElement;
  private multistrokeModeDotElement?: SVGElement;
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

  startStroke(point: PositionWithPressure) {
    this.points = [point];
    this.needsRerender = true;
  }

  extendStroke(point: PositionWithPressure) {
    this.points!.push(point);
    this.needsRerender = true;
  }

  endStroke() {
    this.page.addFreehandStroke(this.points!);
    this.points = undefined;
    this.needsRerender = true;
  }

  onAction() {
    if (this.mode === 'unistroke') {
      this.mode = 'multistroke';
      this.multistrokeModeDotElement = SVG.add('circle', {
        cx: this.buttonX,
        cy: this.buttonY,
        r: 10,
        fill: 'white',
      });
    } else {
      this.mode = 'unistroke';
      this.multistrokeModeDotElement!.remove();
      this.multistrokeModeDotElement = undefined;
    }
  }

  onDeselected() {
    if (this.points) {
      this.endStroke();
      this.updatePath();
    }

    super.onDeselected();
    this.mode = 'unistroke';
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    this.updatePath();
    this.needsRerender = false;
  }

  updatePath() {
    SVG.update(this.strokeElement, {
      d: this.points ? SVG.path(this.points) : '',
    });
  }
}
