import Events, { FingerEvent, PencilEvent } from '../NativeEvents';
import { PositionWithPressure, PositionWithRadius } from '../../lib/types';
import SVG from '../Svg';
import Page from '../Page';
import Stroke from '../strokes/Stroke';

export default class Tool {
  button: SVGElement;
  private isSelected = false;
  stroke?: Stroke;

  constructor(
    label: string,
    public buttonX: number,
    public buttonY: number,
    public page: Page,
    public strokeClass?: typeof Stroke
  ) {
    this.button = SVG.add('circle', { cx: buttonX, cy: buttonY, r: 20 });

    SVG.add('text', { x: buttonX, y: buttonY, class: 'tool', content: label });

    this.refreshButton();
  }

  onSelected() {
    if (this.isSelected) {
      this.onAction();
    } else {
      this.isSelected = true;
      this.refreshButton();
    }
  }

  onAction() {
    // no op by default, but can be overridden by subclass
  }

  onDeselected() {
    this.isSelected = false;
    this.refreshButton();
  }

  update(events: Events) {
    const pencilDown = events.did('pencil', 'began') as PencilEvent | undefined;
    if (pencilDown) {
      this.startStroke({ ...pencilDown.position, ...pencilDown });
    }

    const pencilMoves = events.didAll('pencil', 'moved') as PencilEvent[];
    pencilMoves.forEach(pencilMove => {
      this.extendStroke({ ...pencilMove.position, ...pencilMove });
    });

    const pencilUp = events.did('pencil', 'ended');
    if (pencilUp) {
      this.endStroke();
    }

    const fingerDown = events.did('finger', 'began') as FingerEvent | undefined;
    if (fingerDown) {
      this.startFinger({ ...fingerDown.position, ...fingerDown });
    }

    const fingerMoves = events.didAll('finger', 'moved') as FingerEvent[];
    fingerMoves.forEach(fingerMove => {
      this.moveFinger({ ...fingerMove.position, ...fingerMove });
    });

    const fingerUp = events.did('finger', 'ended');
    if (fingerUp) {
      this.endFinger();
    }
  }

  startStroke(point: PositionWithPressure) {
    if (this.strokeClass) {
      this.stroke = this.page.addStroke(new this.strokeClass([point]));
    }
  }

  extendStroke(point: PositionWithPressure) {
    this.stroke?.points?.push(point);
  }

  endStroke() {
    this.stroke = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startFinger(point: PositionWithRadius) {
    // no op by default, but can be overridden by subclass
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moveFinger(point: PositionWithRadius) {
    // no op by default, but can be overridden by subclass
  }

  endFinger() {
    // no op by default, but can be overridden by subclass
  }

  render() {
    // no op by default, but can be overridden by subclass
  }

  private refreshButton() {
    SVG.update(this.button, {
      fill: this.isSelected ? 'black' : 'lightgrey',
    });
  }
}
