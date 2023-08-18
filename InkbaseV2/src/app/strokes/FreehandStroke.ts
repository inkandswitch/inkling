import Vec from '../../lib/vec';
import TransformationMatrix from '../../lib/transform_matrix';

import SVG, { generatePathFromPoints, updateSvgElement } from '../Svg';
import generateId from '../generateId';
import { PositionWithPressure } from '../../lib/types';
import Handle from './Handle';

export const strokeSvgProperties = {
  stroke: 'rgba(0, 0, 0, .5)',
  // fill: 'rgba(0, 0, 0, .5)',
  // 'stroke-width': 1,
  fill: 'none',
  'stroke-width': 2,
};

export default class FreehandStroke {
  readonly id = generateId();
  private readonly pointData: Array<PositionWithPressure | null>;
  private readonly element: SVGElement;
  private needsRerender = true;

  constructor(
    svg: SVG,
    public points: Array<PositionWithPressure | null>,
    public readonly a: Handle,
    public readonly b: Handle
  ) {
    a.addListener(this);
    b.addListener(this);

    // Store normalised point data based on control points
    const transform = new TransformationMatrix()
      .fromLine(a.position, b.position)
      .inverse();
    this.pointData = points.map(p => {
      if (p === null) {
        return null;
      } else {
        const np = transform.transformPoint(p);
        return { ...np, pressure: p.pressure };
      }
    });

    this.element = svg.addElement('path', {
      d: '',
      ...strokeSvgProperties,
    });
  }

  currentAngle() {
    return Vec.angle(Vec.sub(this.b.position, this.a.position));
  }

  updatePath() {
    const transform = new TransformationMatrix().fromLine(
      this.a.position,
      this.b.position
    );

    this.points = this.pointData.map(p => {
      if (p === null) {
        return null;
      }
      const np = transform.transformPoint(p);
      return { ...np, pressure: p.pressure };
    });
    const path = generatePathFromPoints(this.points);
    updateSvgElement(this.element, { d: path });
  }

  onHandleMoved() {
    this.needsRerender = true;
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    this.updatePath();
    this.needsRerender = false;
  }
}
