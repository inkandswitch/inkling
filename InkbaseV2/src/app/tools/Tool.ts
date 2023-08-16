import Events from '../NativeEvents';
import SVG, { updateSvgElement } from '../Svg';

export class Tool {
  private button: SVGElement;
  private isSelected = false;

  constructor(
    svg: SVG,
    public buttonX: number,
    public buttonY: number
  ) {
    this.button = svg.addElement('circle', { cx: buttonX, cy: buttonY, r: 20 });
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(svg: SVG) {
    // no op by default, but can be overridden by subclass
  }

  private refreshButton() {
    updateSvgElement(this.button, {
      fill: this.isSelected ? 'black' : 'lightgrey',
    });
  }
}
