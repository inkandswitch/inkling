import { Position, isPosition } from '../../lib/types';
import SVG from '../Svg';
import { GameObject } from '../GameObject';
import Vec from '../../lib/vec';
import Store, { Serializable } from '../Store';
import { TAU, lerpN, rand } from '../../lib/math';

const padding = 30;
const radius = 20;

export const aMetaToggle = (gameObj: GameObject) =>
  gameObj instanceof MetaToggle ? gameObj : null;

export default class MetaToggle extends GameObject {
  private readonly element: SVGElement;
  position: Position;
  dragging = false;

  public active = false; // Temporary hack — this should be somewhere more global

  private splats: SVGElement[] = [];

  constructor() {
    super();

    this.position = Store.init({
      name: 'Meta Toggle Position',
      isValid: isPosition,
      def: { x: padding, y: padding },
    });

    this.element = SVG.add('g', SVG.guiElm, {
      ...this.getAttrs(), // This avoids an unstyled flash on first load
    });

    SVG.add('circle', this.element, { class: 'outer', r: radius });
    SVG.add('circle', this.element, { class: 'inner', r: radius });
    const splatsElm = SVG.add('g', this.element, { class: 'splats' });
    for (let i = 0; i < 24; i++) {
      const points: Position[] = [];
      const steps = 6;
      for (let s = 0; s < steps; s++) {
        const a = (TAU * (rand(-0.1, 0.1) + s)) / steps;
        const d = rand(1, 3);
        points.push(Vec.polar(a, d));
      }
      this.splats.push(
        SVG.add('polyline', splatsElm, {
          points: SVG.points(points),
          class: 'splat',
        })
      );
    }
    SVG.add('circle', this.element, { class: 'secret', r: radius });
    this.resplat();
  }

  resplat() {
    if (!this.active) {
      const angles = [rand(0, 360), rand(0, 360), rand(0, 360), rand(0, 360)];
      this.splats.forEach(splat => {
        const energy = rand(0, 1) ** 8;
        const a = angles[rand(0, angles.length) | 0];
        const t = lerpN(energy, 4, 8);
        const s = rand(0.4, 1.3);
        SVG.update(splat, {
          style: `scale: ${s + rand(-0.1, 0.1)} ${s + rand(-0.1, 0.1)}`,
          transform: `rotate(${a}) translate(${t} 0)`,
        });
      });
    } else {
      this.splats.forEach(splat => {
        SVG.update(splat, { style: `scale: ${0.6}` });
      });
    }
  }

  toggle() {
    this.active = !this.active;
    document.documentElement.toggleAttribute('meta-mode', this.active);
    this.resplat();
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point);
  }

  dragTo(position: Position) {
    this.dragging = true;
    this.position = position;
  }

  remove() {
    window.location.reload();
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

    Store.set('Meta Toggle Position', this.position as unknown as Serializable);
  }

  private getAttrs() {
    const classes: string[] = ['meta-toggle'];

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
