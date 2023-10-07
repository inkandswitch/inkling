import COLORS from './Colors';
import Token from './Token';
import SVG from '../Svg';
import * as ohm from 'ohm-js';

export default class OpToken extends Token {
  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 24,
    fill: COLORS.GREY_DARK,
    'font-size': '24px',
  });

  constructor(
    public stringValue: string,
    source?: ohm.Interval
  ) {
    super(source);
  }

  isPrimary() {
    return false;
  }

  render() {
    // Update text content
    this.textElement.textContent = this.stringValue;
    this.width = this.textElement.getComputedTextLength() + 10;

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24,
    });
  }

  remove(): void {
    this.textElement.remove();
    super.remove();
  }
}
