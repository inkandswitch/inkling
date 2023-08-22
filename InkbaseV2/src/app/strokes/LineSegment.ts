import { Position } from '../../lib/types';
import SVG, { updateSvgElement } from '../Svg';
import generateId from '../generateId';
import Handle from './Handle';

export default class LineSegment {
  readonly id = generateId();
  readonly a: Handle;
  readonly b: Handle;

  private selected = false;
  private readonly elements: { normal: SVGElement; selected: SVGElement };
  private needsRerender = true;

  constructor(svg: SVG, aPos: Position, bPos: Position) {
    this.a = Handle.create(svg, 'formal', aPos, this);
    this.b = Handle.create(svg, 'formal', bPos, this);

    const commonAttributes = {
      x1: aPos.x,
      y1: aPos.y,
      x2: bPos.x,
      y2: bPos.y,
      'stroke-width': 1,
      stroke: 'black',
    };
    this.elements = {
      normal: svg.addElement('line', commonAttributes),
      selected: svg.addElement('line', {
        ...commonAttributes,
        'stroke-width': 7,
        stroke: 'none',
      }),
    };
  }

  select() {
    this.needsRerender = true;
    this.selected = true;
  }

  deselect() {
    this.needsRerender = true;
    this.selected = false;
  }

  onHandleMoved() {
    this.needsRerender = true;
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    const commonAttributes = {
      x1: this.a.position.x,
      y1: this.a.position.y,
      x2: this.b.position.x,
      y2: this.b.position.y,
    };
    updateSvgElement(this.elements.normal, commonAttributes);
    updateSvgElement(this.elements.selected, {
      ...commonAttributes,
      stroke: this.selected ? 'rgba(180, 134, 255, 0.42)' : 'none',
    });

    this.needsRerender = false;
  }
}
