import Events from '../NativeEvents';
import SVG from '../Svg';

export class Tool {
  private button: SVGElement;
  private isSelected = false;

  constructor(
    public buttonX: number,
    public buttonY: number
  ) {
    this.button = SVG.add('circle', { cx: buttonX, cy: buttonY, r: 20 });
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(events: Events) {
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
