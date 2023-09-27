import { Position } from '../../lib/types';
import { generateId } from '../../lib/helpers';
import SVG from '../Svg';
import Handle from './Handle';
import { GameObject } from '../GameObject';
import Line from '../../lib/line';

export default class LineSegment extends GameObject {
  readonly id = generateId();
  readonly a: Handle;
  readonly b: Handle;

  private selected = false;
  private readonly elements: { normal: SVGElement; selected: SVGElement };

  constructor(aPos: Position, bPos: Position) {
    super();

    this.a = this.adopt(Handle.create('formal', aPos));
    this.b = this.adopt(Handle.create('formal', bPos));

    const commonAttributes = {
      x1: aPos.x,
      y1: aPos.y,
      x2: bPos.x,
      y2: bPos.y,
      'stroke-width': 1,
      stroke: 'black',
    };
    this.elements = {
      normal: SVG.add('line', commonAttributes),
      selected: SVG.add('line', {
        ...commonAttributes,
        'stroke-width': 7,
        stroke: 'none',
      }),
    };
  }

  select() {
    this.selected = true;
  }

  deselect() {
    this.selected = false;
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }

    const commonAttributes = {
      x1: this.a.position.x,
      y1: this.a.position.y,
      x2: this.b.position.x,
      y2: this.b.position.y,
    };
    SVG.update(this.elements.normal, commonAttributes);
    SVG.update(this.elements.selected, {
      ...commonAttributes,
      stroke: this.selected ? 'rgba(180, 134, 255, 0.42)' : 'none',
    });
  }

  distanceToPoint(point: Position) {
    return Line.distToPoint(Line(this.a.position, this.b.position), point);
  }
}

export const aLineSegment = (gameObj: GameObject) =>
  gameObj instanceof LineSegment ? gameObj : null;
