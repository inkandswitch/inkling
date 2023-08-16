import { Position, PositionWithPressure } from '../../lib/types';
import Vec from '../../lib/vec';
import SVG from '../Svg';
import FreehandStroke from './FreehandStroke';

// A connection between two strokes
interface Connection {
  position: Position;
  strokes: FreehandStroke[];
  indexes: number[];
  aligned: boolean; // true if roughly aligned, false if roughly perpendicular
}

// Stroke Graph is the datastructure responsible for holding information about groupings of strokes
export default class StrokeGraph {
  strokes: FreehandStroke[] = [];
  connections: Connection[] = [];
  elements: SVGElement[] = [];

  private needsRerender = false;

  // Alex commented out this instance variable b/c it wasn't used anywhere
  // groups: any[] = [];

  addStroke(stroke: FreehandStroke) {
    // Generate closest strokes for this stroke
    for (const otherStroke of this.strokes) {
      const closestPoint = closestPointsBetweenStrokes(
        stroke.points,
        otherStroke.points
      );
      if (closestPoint.dist < 20) {
        const midPoint = Vec.mulS(
          Vec.add(
            stroke.points[closestPoint.indexA]!,
            otherStroke.points[closestPoint.indexB]!
          ),
          0.5
        );

        // Determine alignment at connection point
        const dirA = getDirectionAtStrokePoint(
          stroke.points,
          closestPoint.indexA
        );
        const dirB = getDirectionAtStrokePoint(
          otherStroke.points,
          closestPoint.indexB
        );
        const alignment = Math.abs(Vec.cross(dirA, dirB));
        const aligned = alignment < 0.3;

        this.connections.push({
          position: midPoint,
          strokes: [stroke, otherStroke],
          indexes: [closestPoint.indexA, closestPoint.indexB],
          aligned,
        });
      }
    }
    this.strokes.push(stroke);

    this.needsRerender = true;
  }

  render(svg: SVG) {
    if (!this.needsRerender) {
      return;
    }

    for (const elem of this.elements) {
      elem.remove();
    }

    this.elements = this.connections.map(c => {
      return svg.addElement('circle', {
        cx: c.position.x,
        cy: c.position.y,
        r: 3,
        fill: c.aligned ? 'pink' : 'green',
      });
    });

    this.needsRerender = false;
  }
}

function closestPointsBetweenStrokes(
  strokeA: Array<PositionWithPressure | null>,
  strokeB: Array<PositionWithPressure | null>
) {
  let minDist = Vec.dist(strokeA[0]!, strokeB[0]!);
  let indexA = 0;
  let indexB = 0;

  for (let i = 0; i < strokeA.length; i++) {
    for (let j = 0; j < strokeB.length; j++) {
      const pa = strokeA[i];
      const pb = strokeB[j];
      if (!pa || !pb) {
        continue;
      }

      const dist = Vec.dist(pa, pb);
      if (dist < minDist) {
        minDist = dist;
        indexA = i;
        indexB = j;
      }
    }
  }

  return { dist: minDist, indexA, indexB };
}

function getDirectionAtStrokePoint(
  stroke: Array<PositionWithPressure | null>,
  index: number
) {
  let backwardIndex = index - 10;
  if (backwardIndex < 0) {
    backwardIndex = 0;
  }
  while (!stroke[backwardIndex]) {
    backwardIndex++;
  }

  let forwardIndex = index + 10;
  if (forwardIndex > stroke.length - 1) {
    forwardIndex = stroke.length - 1;
  }
  while (!stroke[forwardIndex]) {
    forwardIndex--;
  }

  return Vec.normalize(Vec.sub(stroke[backwardIndex]!, stroke[forwardIndex]!));
}
