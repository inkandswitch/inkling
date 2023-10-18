import Token from './Token';
import SVG from '../Svg';
import * as ohm from 'ohm-js';

export default class OpToken extends Token {
  private lastRenderedValue = '';

  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 24,
    class: 'op token',
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
    // getComputedTextLength() is slow, so we're gonna do some dirty checking here
    const content = this.stringValue;
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content;
      SVG.update(this.textElement, { content });
      this.width = this.textElement.getComputedTextLength() + 10;
    }

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
