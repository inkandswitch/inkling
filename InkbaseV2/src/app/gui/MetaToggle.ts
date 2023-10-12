import { Position } from '../../lib/types';
import SVG from '../Svg';
import { GameObject } from '../GameObject';
import Vec from '../../lib/vec';

const padding = 30;
const radius = 20;

export const aMetaToggle = (gameObj: GameObject) =>
  gameObj instanceof MetaToggle ? gameObj : null;

export default class MetaToggle extends GameObject {
  private readonly element: SVGElement;
  position: Position;
  dragging = false;

  public active = true; // Temporary hack — this should be somewhere more global

  constructor() {
    super();

    this.position = {
      x: padding,
      y: padding,
    };

    this.element = SVG.add('g', SVG.guiElm, {
      id: 'meta-toggle',
      ...this.getAttrs(), // This avoids an unstyled flash on first load
    });

    SVG.add('circle', this.element, { class: 'outer', r: radius });
    SVG.add('circle', this.element, { class: 'inner', r: radius });
    SVG.add('circle', this.element, { class: 'secret', r: radius });
  }

  toggle() {
    this.active = !this.active;
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point);
  }

  dragTo(position: Position) {
    this.dragging = true;
    this.position = position;
  }

  snapToCorner() {
    this.dragging = false;

    const windowSize = Vec(window.innerWidth, window.innerHeight);

    // x and y will be exactly 0 or 1
    const normalizedPosition = Vec.round(Vec.div(this.position, windowSize));

    // x and y will be exactly in a screen corner
    const cornerPosition = Vec.mul(normalizedPosition, windowSize);

    // x and y will be exactly 1 (left&top) or -1 (right&bottom)
    const sign = Vec.addS(Vec.mulS(normalizedPosition, -2), 1);

    // Inset from the corner
    this.position = Vec.add(cornerPosition, Vec.mulS(sign, padding));
  }

  private getAttrs() {
    const classes: string[] = [];
    if (this.active) {
      classes.push('active');
    }
    if (this.dragging) {
      classes.push('dragging');
    }

    return {
      color: 'black',
      class: classes.join(' '),
      style: `translate: ${this.position.x}px ${this.position.y}px`,
    };
  }

  render() {
    SVG.update(this.element, this.getAttrs());
  }
}
