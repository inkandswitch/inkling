import Vec from '../../lib/vec';
import Events from '../NativeEvents';
import Page from '../Page';
import * as constraints from '../constraints';
import FreehandStroke from '../strokes/FreehandStroke';
import StrokeGroup from '../strokes/StrokeGroup';
import Tool from './Tool';
import SVG from '../Svg';
import { toDegrees } from '../../lib/helpers';

interface Options {
  vertical: boolean;
  horizontal: boolean;
  length: boolean;
  angle: boolean;
}

interface ConstraintCandidate {
  type: 'horizontal' | 'vertical' | 'length' | 'angle';
  strokeGroup: StrokeGroup;
  refStrokeGroup: StrokeGroup | null;
}

type LastTapInfo = {
  timestampMillis: number;
  strokeGroup: StrokeGroup | null;
};

export default class ConstraintTool extends Tool<FreehandStroke> {
  private lastTapInfo: LastTapInfo = {
    timestampMillis: 0,
    strokeGroup: null,
  };
  private refStrokeGroup: StrokeGroup | null = null;
  private readonly constraintCandidates = new Set<ConstraintCandidate>();
  private readonly appliedCandidates = new Set<ConstraintCandidate>();

  constructor(
    label: string,
    buttonX: number,
    buttonY: number,
    page: Page,
    private options: Options
  ) {
    super(label, buttonX, buttonY, page, FreehandStroke);
  }

  update(events: Events) {
    super.update(events);

    const fingerDown = events.find('finger', 'began');
    if (fingerDown) {
      this.updateLastTap(
        this.page.findStrokeGroupNear(fingerDown.position, 40)
      );
    }

    if (events.find('finger', 'moved')) {
      this.onFingerMoved();

      // TODO: it would be nice if a Tool could just override methods like
      // onHandleMoved() to react to higher-level events.
    }

    if (events.find('finger', 'ended')) {
      this.applyConstraintCandidates();
    }
  }

  private updateLastTap(strokeGroup: StrokeGroup | null) {
    const timestampMillis = Date.now();
    const isDoubleTap =
      timestampMillis - this.lastTapInfo.timestampMillis <= 150;
    const oldStrokeGroup = this.lastTapInfo.strokeGroup;

    if (isDoubleTap && strokeGroup === oldStrokeGroup) {
      if (strokeGroup) {
        for (const stroke of strokeGroup.strokes) {
          stroke.deselect();
        }
      }
      this.refStrokeGroup = strokeGroup;
    }

    this.lastTapInfo = { timestampMillis, strokeGroup };
  }

  private onFingerMoved() {
    this.constraintCandidates.clear();
    for (const strokeGroup of this.page.strokeGroups) {
      if (strokeGroup.a.isSelected || strokeGroup.b.isSelected) {
        this.addConstraintCandidates(strokeGroup);
      }
    }
  }

  private addConstraintCandidates(strokeGroup: StrokeGroup) {
    // add constraints based on this stroke group alone

    const { a, b } = strokeGroup;

    const vertical =
      this.options.vertical && Math.abs(a.position.x - b.position.x) < 5;
    if (vertical) {
      this.addConstraintCandidate('vertical', strokeGroup);
    }

    const horizontal =
      this.options.horizontal && Math.abs(a.position.y - b.position.y) < 5;
    if (horizontal) {
      this.addConstraintCandidate('horizontal', strokeGroup);
    }

    if (strokeGroup === this.refStrokeGroup || !this.refStrokeGroup) {
      return;
    }

    // add constraints relative to the reference stroke group

    const { a: ra, b: rb } = this.refStrokeGroup;

    const refLen = Vec.dist(ra.position, rb.position);
    const len = Vec.dist(a.position, b.position);
    const lenDiff = Math.abs(refLen - len);
    const length = this.options.length && lenDiff < 10;
    if (length) {
      this.addConstraintCandidate('length', strokeGroup, this.refStrokeGroup);
    }

    if (this.options.angle && !vertical && !horizontal) {
      const refAngle = toDegrees(Vec.angle(Vec.sub(rb.position, ra.position)));
      const angle = toDegrees(Vec.angle(Vec.sub(b.position, a.position)));
      const diff = refAngle - angle;
      if (
        Math.abs(diff - nearestMultiple(diff, 90)) < 1 &&
        // ... but don't sugest nearly vertical or horizontal angles,
        // since there are better constraints for that.
        Math.abs(refAngle - nearestMultiple(refAngle, 90)) > 5
      ) {
        this.addConstraintCandidate('angle', strokeGroup, this.refStrokeGroup);
      }
    }
  }

  private addConstraintCandidate(
    type: ConstraintCandidate['type'],
    strokeGroup: StrokeGroup,
    refStrokeGroup: StrokeGroup | null = null
  ) {
    for (const applied of this.appliedCandidates) {
      if (
        applied.type === type &&
        applied.strokeGroup === strokeGroup &&
        applied.refStrokeGroup === refStrokeGroup
      ) {
        return;
      }
    }
    this.constraintCandidates.add({ type, strokeGroup, refStrokeGroup });
  }

  endStroke() {
    const stroke = this.stroke;
    super.endStroke();
    this.page.addStrokeGroup(new Set([stroke!]));
  }

  onAction() {
    // const stroke = this.page.addStroke(
    //   new FreehandStroke([
    //     { x: 100, y: 500, pressure: 1 },
    //     { x: 400, y: 400, pressure: 1 },
    //   ])
    // );
    // const strokeGroup = this.page.addStrokeGroup(new Set([stroke]));
    // constraints.length(strokeGroup.a, strokeGroup.b);

    let prevPos = { x: 50, y: 500 };
    for (let idx = 0; idx < 10; idx++) {
      const nextPos = Vec.add(prevPos, {
        x: 50,
        y: idx % 2 === 0 ? 100 : -100,
      });
      const stroke = this.page.addStroke(
        new FreehandStroke([prevPos, nextPos].map(p => ({ ...p, pressure: 1 })))
      );
      const strokeGroup = this.page.addStrokeGroup(new Set([stroke]));
      const lengthVar = constraints.length(strokeGroup.a, strokeGroup.b)
        .variables[0];
      constraints.constant(lengthVar);
      prevPos = nextPos;
    }
  }

  render() {
    super.render();

    for (const { type, strokeGroup } of this.constraintCandidates) {
      const { a, b } = strokeGroup;
      switch (type) {
        case 'vertical':
          SVG.now('polyline', {
            points: SVG.points([
              { x: a.position.x, y: 0 },
              { x: a.position.x, y: 10_000 },
            ]),
            stroke: 'rgba(0, 0, 255, 0.2)',
          });
          break;
        case 'horizontal':
          SVG.now('polyline', {
            points: SVG.points([
              { x: 0, y: a.position.y },
              { x: 10_000, y: a.position.y },
            ]),
            stroke: 'rgba(0, 0, 255, 0.2)',
          });
          break;
        case 'length':
          SVG.now('polyline', {
            points: SVG.points([a.position, b.position]),
            stroke: 'cornflowerblue',
            'stroke-width': 12,
          });
          break;
        case 'angle': {
          SVG.now('polyline', {
            points: SVG.points([
              Vec.lerp(a.position, b.position, 10_000),
              Vec.lerp(a.position, b.position, -10_000),
            ]),
            stroke: 'rgba(255, 0, 0, 0.2)',
          });
          const { a: ra, b: rb } = this.refStrokeGroup!;
          SVG.now('polyline', {
            points: SVG.points([
              Vec.lerp(ra.position, rb.position, 10_000),
              Vec.lerp(ra.position, rb.position, -10_000),
            ]),
            stroke: 'rgba(255, 0, 0, 0.2)',
          });
          break;
        }
      }
    }

    if (this.refStrokeGroup) {
      const { a, b } = this.refStrokeGroup;
      SVG.now('polyline', {
        points: SVG.points([a.position, b.position]),
        stroke: 'rgba(243, 149, 57, 0.5)',
        'stroke-width': 12,
      });
    }
  }

  private applyConstraintCandidates() {
    const ra = this.refStrokeGroup?.a;
    const rb = this.refStrokeGroup?.b;

    for (const candidate of this.constraintCandidates) {
      // console.log('applying constraint candidate', candidate);
      const {
        type,
        strokeGroup: { a, b },
      } = candidate;
      switch (type) {
        case 'vertical':
          constraints.vertical(a, b);
          break;
        case 'horizontal':
          constraints.horizontal(a, b);
          break;
        case 'length': {
          const refLenVar = constraints.length(ra!, rb!).variables[0];
          const newLenVar = constraints.length(a, b).variables[0];
          constraints.equals(refLenVar, newLenVar);
          break;
        }
        case 'angle': {
          const refAngleVar = constraints.angle(ra!, rb!).variables[0];
          const angleVar = constraints.angle(a, b).variables[0];
          const diffVar = constraints.variable(
            nearestMultiple(refAngleVar.value - angleVar.value, Math.PI / 2)
          );
          constraints.sum(refAngleVar, angleVar, diffVar);
          constraints.constant(diffVar);
          break;
        }
      }
      this.appliedCandidates.add(candidate);
    }
    this.constraintCandidates.clear();
  }
}

function nearestMultiple(n: number, m: number) {
  return Math.round(n / m) * m;
}
