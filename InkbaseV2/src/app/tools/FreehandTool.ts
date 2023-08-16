import {PositionWithPressure} from '../../lib/types';
import Events, {PencilEvent} from '../NativeEvents';
import Page from '../Page';
import SVG, {generatePathFromPoints, updateSvgElement} from '../Svg';
import {strokeSvgProperties} from '../strokes/FreehandStroke';
import {Tool} from './Tool';

type Mode = 'unistroke' | 'multistroke';

export default class FreehandTool extends Tool {
  private mode: Mode = 'unistroke';
  private points?: Array<PositionWithPressure | null>;
  private strokeElement: SVGElement;
  private multistrokeModeDotElement?: SVGElement;
  private pencilIsDown = false;
  private needsRerender = false;

  constructor(
    private svg: SVG,
    buttonX: number,
    buttonY: number,
    private page: Page
  ) {
    super(svg, buttonX, buttonY);
    this.strokeElement = svg.addElement('path', {
      d: '',
      ...strokeSvgProperties,
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
      } else {
        this.extendStroke(null);
        this.extendStroke({
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

    if (!this.pencilIsDown && this.mode === 'unistroke') {
      this.endStroke();
    }
  }

  startStroke(point: PositionWithPressure) {
    this.points = [point];
    this.needsRerender = true;
  }

  extendStroke(point: PositionWithPressure | null) {
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
      this.multistrokeModeDotElement = this.svg.addElement('circle', {
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
    const path = this.points ? generatePathFromPoints(this.points) : '';
    updateSvgElement(this.strokeElement, {d: path});
  }
}
