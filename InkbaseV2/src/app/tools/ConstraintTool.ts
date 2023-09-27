import Vec from '../../lib/vec';
import Events from '../NativeEvents';
import * as constraints from '../constraints';
import FreehandStroke from '../strokes/FreehandStroke';
import StrokeGroup, { strokeGroupPred } from '../strokes/StrokeGroup';
import Tool from './Tool';
import SVG from '../Svg';
import { toDegrees } from '../../lib/helpers';
import { Position } from '../../lib/types';
import Handle from '../strokes/Handle';

interface Options {
  vertical: boolean;
  horizontal: boolean;
  distance: boolean;
  angle: boolean;
}

interface ConstraintCandidate {
  type: 'horizontal' | 'vertical' | 'distance' | 'angle';
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
    private options: Options
  ) {
    super(label, buttonX, buttonY, FreehandStroke);
  }

  private addStrokeGroup(p1: Position, p2: Position) {
    const stroke = this.page.addStroke(
      new FreehandStroke([
        { ...p1, pressure: 1 },
        { ...p2, pressure: 1 },
      ])
    );
    return this.page.addStrokeGroup(new Set([stroke]));
  }

  onActionState: { result: constraints.Variable } | undefined = undefined;

  onAction() {
    if (!this.onActionState) {
      const a = this.page.adopt(Handle.create('informal', { x: 100, y: 100 }));
      const { variable: ay } = constraints.property(a, 'y').variables;
      const b = this.page.adopt(Handle.create('informal', { x: 200, y: 100 }));
      const { variable: by } = constraints.property(b, 'y').variables;
      const { result } = (this.onActionState = constraints.formula(
        [ay, by],
        ([ay, by]) => ay + by
      ).variables);
      setInterval(() => {
        SVG.showStatus(
          `ay=${ay.value}, by=${by.value}, result=${result.value}`
        );
      }, 10);
    } else {
      const { result } = this.onActionState;
      result.value = 450;
      console.log('set result value to', result.value);
      constraints.now.constant(result);
      console.log('added temp constant constraint on result');
    }

    // --- formula example ---
    // const { a, b } = this.addStrokeGroup(
    //   { x: 100, y: 500 },
    //   { x: 400, y: 400 }
    // );
    // const { variable: ax } = constraints.property(a, 'x').variables;
    // const { result: ax2 } = constraints.formula(
    //   [ax],
    //   ([ax]) => ax * 2
    // ).variables;
    // const { variable: by } = constraints.property(b, 'y').variables;
    // constraints.equals(by, ax2);

    // --- polar vector example ---
    // const { a: a1, b: b1 } = this.addStrokeGroup(
    //   { x: 100, y: 500 },
    //   { x: 400, y: 400 }
    // );
    // const { a: a2, b: b2 } = this.addStrokeGroup(
    //   { x: 400, y: 400 },
    //   { x: 500, y: 200 }
    // );
    // const { angle: angle1, distance: distance1 } = constraints.polarVector(
    //   a1,
    //   b1
    // ).variables;
    // const { angle: angle2, distance: distance2 } = constraints.polarVector(
    //   a2,
    //   b2
    // ).variables;
    // constraints.constant(angle1);
    // constraints.constant(angle2);
    // constraints.equals(distance1, distance2);

    // --- length example ---
    // let prevPos = { x: 50, y: 500 };
    // for (let idx = 0; idx < 10; idx++) {
    //   const nextPos = Vec.add(prevPos, {
    //     x: 50,
    //     y: idx % 2 === 0 ? 100 : -100,
    //   });
    //   const { a, b } = this.addStrokeGroup(prevPos, nextPos);
    //   const { distance } = constraints.distance(a, b).variables;
    //   constraints.constant(distance);
    //   prevPos = nextPos;
    // }
  }

  update(events: Events) {
    super.update(events);

    const fingerDown = events.find('finger', 'began');
    if (fingerDown) {
      this.updateLastTap(
        this.page.find({
          pred: strokeGroupPred,
          nearPosition: fingerDown.position,
          tooFar: 40,
        })
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

    const refDist = Vec.dist(ra.position, rb.position);
    const dist = Vec.dist(a.position, b.position);
    const diff = Math.abs(refDist - dist);
    if (this.options.distance && diff < 10) {
      this.addConstraintCandidate('distance', strokeGroup, this.refStrokeGroup);
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
        case 'distance':
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
        case 'distance': {
          constraints.equalDistance(ra!, rb!, a, b);
          break;
        }
        case 'angle': {
          constraints.fixedAngle(
            ra!,
            rb!,
            a,
            b,
            nearestMultiple(
              Vec.angle(Vec.sub(rb!.position, ra!.position)) -
                Vec.angle(Vec.sub(b.position, a.position)),
              Math.PI / 2
            )
          );
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
