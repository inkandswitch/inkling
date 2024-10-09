import Token from './Token';
import SVG from '../Svg';
import * as ohm from 'ohm-js';
import { WirePort } from './Wire';
import { MetaLabel } from './MetaSemantics';
import { boundingBoxFromStrokes } from '../../lib/bounding_box';
import { generateId } from '../../lib/helpers';
import { GameObject } from '../GameObject';

export default class LabelToken extends Token {
  readonly id = generateId();

  private lastRenderedValue = '';

  protected readonly boxElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    class: 'label-box',
  });

  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 24,
    class: 'label-text',
  });

  readonly strokeElements: SVGElement[] = [];

  wirePort: WirePort;

  constructor(
    public readonly label: MetaLabel,
    source?: ohm.Interval
  ) {
    super(source);
    if (typeof label.display === 'string') {
      // getComputedTextLength() is slow, so we're gonna do some dirty checking here
      const content = label.display;
      if (content !== this.lastRenderedValue) {
        this.lastRenderedValue = content;
        SVG.update(this.textElement, { content });
        this.width = this.textElement.getComputedTextLength() + 10;
      }
    } else {
      for (const stroke of label.display) {
        const strokeElement = SVG.add('polyline', SVG.labelElm, {
          class: 'label-stroke',
          points: SVG.points(stroke),
          transform: SVG.positionToTransform(this.position),
        });
        this.strokeElements.push(strokeElement);
      }

      const bb = boundingBoxFromStrokes(label.display);
      const leftPadding = bb.minX;
      this.width = bb.width + leftPadding * 2;
    }
    SVG.update(this.boxElement, { width: this.width });

    this.wirePort = this.adopt(new WirePort(this.position, this.label));
  }

  isPrimary() {
    return true;
  }

  render() {
    SVG.update(this.boxElement, {
      x: this.position.x,
      y: this.position.y,
      'is-hidden': this.hidden,
    });

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24,
      'is-hidden': this.hidden,
    });

    for (const strokeElement of this.strokeElements) {
      SVG.update(strokeElement, {
        transform: SVG.positionToTransform(this.position),
        'is-hidden': this.hidden,
      });
    }

    this.wirePort.position = this.midPoint();
  }

  getVariable() {
    return this.label.variable;
  }
}

export const aLabelToken = (gameObj: GameObject) =>
  gameObj instanceof LabelToken ? gameObj : null;
