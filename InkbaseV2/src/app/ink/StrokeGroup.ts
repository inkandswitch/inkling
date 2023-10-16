import Stroke, { aStroke } from './Stroke';
import Handle from './Handle';

import TransformationMatrix from '../../lib/TransformationMatrix';
import { Position } from '../../lib/types';

import { farthestPair } from '../../lib/helpers';
import { GameObject } from '../GameObject';

export default class StrokeGroup extends GameObject {
  private pointData: Position[][];

  // These strong references are OK b/c a and b will always be my children
  readonly a: Handle;
  readonly b: Handle;

  // outlineShape: ClipperShape;
  skeleton: Position[] = [];
  dirty = false;

  svgElements: SVGElement[] = [];

  constructor(strokes: Set<Stroke>) {
    super();

    for (const stroke of strokes) {
      this.adopt(stroke);
    }

    // Generate Handles
    const points = this.strokes.flatMap(stroke => stroke.points);
    [this.a, this.b] = farthestPair(points).map(pos =>
      this.adopt(Handle.create(pos))
    );

    // Generate transform data
    const transform = TransformationMatrix.fromLine(
      this.a.position,
      this.b.position
    ).inverse();

    this.pointData = this.strokes.map(stroke =>
      stroke.points.map(p => transform.transformPoint(p))
    );
  }

  get strokes(): Stroke[] {
    return this.findAll({ what: aStroke, recursive: false });
  }

  private updatePaths() {
    const transform = TransformationMatrix.fromLine(
      this.a.position,
      this.b.position
    );

    for (const [i, stroke] of this.strokes.entries()) {
      const newPoints = this.pointData[i].map(p => transform.transformPoint(p));
      stroke.updatePath(newPoints);
    }
  }

  distanceToPoint(pos: Position) {
    let minDistance: number | null = null;
    for (const stroke of this.strokes) {
      const dist = stroke.distanceToPoint(pos);
      if (dist === null) {
        continue;
      } else if (minDistance === null) {
        minDistance = dist;
      } else {
        minDistance = Math.min(minDistance, dist);
      }
    }
    return minDistance;
  }

  render(dt: number, t: number) {
    // TODO: Ivan to speed this up if necessary
    this.updatePaths();

    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  remove() {
    for (const elem of this.svgElements) {
      elem.remove();
    }
    super.remove();
  }
}

export const aStrokeGroup = (gameObj: GameObject) =>
  gameObj instanceof StrokeGroup ? gameObj : null;
