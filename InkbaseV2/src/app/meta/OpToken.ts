import COLORS from './Colors';
import Token from './Token';
import SVG from '../Svg';

export default class OpToken extends Token {
  protected readonly textElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.GREY_DARK,
    'font-size': '30px',
  });

  constructor(public stringValue: string) {
    super();
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
      y: this.position.y + 30,
    });
  }

  remove(): void {
    this.textElement.remove();
    super.remove();
  }
}
