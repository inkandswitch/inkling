import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import Events, { Event } from '../NativeEvents';
import Page from '../Page';
import * as constraints from '../constraints';
import FreehandStroke from '../strokes/FreehandStroke';
import StrokeGroup from '../strokes/StrokeGroup';
import Tool from './Tool';
import SVG from '../Svg';

interface ConstraintCandidate {
  type: 'horizontal' | 'vertical' | 'length' | 'angle';
  strokeGroup: StrokeGroup;
  refStrokeGroup: StrokeGroup | null;
}

export default class ConstraintTool extends Tool {
  private fingerDown?: Event;
  private fingerMoved?: Event;
  private refStrokeGroup: StrokeGroup | null = null;
  private readonly constraintCandidates = new Set<ConstraintCandidate>();
  private readonly appliedCandidates = new Set<ConstraintCandidate>();

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page, FreehandStroke);
  }

  update(events: Events) {
    super.update(events);

    const fingerDown = events.find('finger', 'began');
    if (fingerDown) {
      this.fingerDown = fingerDown;
      setTimeout(() => {
        if (
          this.fingerDown &&
          (!this.fingerMoved ||
            Vec.dist(this.fingerDown.position, this.fingerMoved.position) < 10)
        ) {
          this.onLongPress(this.fingerDown.position);
        }
      }, 1_500);
    }

    if (!this.fingerDown) {
      return;
    }

    const firstFingerDownMoved = events.find(
      'finger',
      'moved',
      this.fingerDown.id
    );
    if (firstFingerDownMoved) {
      this.fingerMoved = firstFingerDownMoved;
    }

    const fingerMoved = events.find('finger', 'moved');
    if (fingerMoved) {
      // This will result in lots of false positives, i.e., it will call
      // onHandleMoved() when no handles were moved. It also won't tell me
      // which handle(s) moved. It's just an expedient way to get something
      // going.
      this.onHandleMoved();

      // TODO: it would be nice if a Tool could just override methods like
      // onHandleMoved() to react to higher-level events.
    }

    const fingerEnded = events.find('finger', 'ended'); //, this.fingerDown.id);
    if (fingerEnded) {
      this.fingerDown = undefined;
      this.applyConstraintCandidates();
    }
  }

  private onLongPress(pos: Position) {
    this.refStrokeGroup = this.page.findStrokeGroupNear(pos);
  }

  private onHandleMoved() {
    this.constraintCandidates.clear();
    for (const strokeGroup of this.page.strokeGroups) {
      if (strokeGroup.a.isSelected || strokeGroup.b.isSelected) {
        this.addConstraintCandidates(strokeGroup);
      }
    }
  }

  private addConstraintCandidates(strokeGroup: StrokeGroup) {
    // add constraints based on this stroke group alone

    const a = strokeGroup.a;
    const b = strokeGroup.b;

    // if (Math.abs(a.position.x - b.position.x) < 5) {
    //   this.addConstraintCandidate('vertical', strokeGroup);
    // }

    // if (Math.abs(a.position.y - b.position.y) < 5) {
    //   this.addConstraintCandidate('horizontal', strokeGroup);
    // }

    if (strokeGroup === this.refStrokeGroup || !this.refStrokeGroup) {
      return;
    }

    // add constraints relative to the reference stroke group

    const ra = this.refStrokeGroup.a;
    const rb = this.refStrokeGroup.b;

    const refLen = Vec.dist(ra.position, rb.position);
    const len = Vec.dist(a.position, b.position);
    const lenDiff = Math.abs(refLen - len);
    if (lenDiff < 10) {
      this.addConstraintCandidate('length', strokeGroup);
    }

    const angle =
      constraints.computeAngle(
        a.position,
        b.position,
        ra.position,
        rb.position
      ) ?? 0;
    if ((((angle + 2 * Math.PI) % (Math.PI / 4)) * 180) / Math.PI < 5) {
      this.addConstraintCandidate('angle', strokeGroup);
    }
  }

  private addConstraintCandidate(
    type: ConstraintCandidate['type'],
    strokeGroup: StrokeGroup
  ) {
    for (const applied of this.appliedCandidates) {
      if (
        applied.type === type &&
        applied.strokeGroup === strokeGroup &&
        applied.refStrokeGroup === this.refStrokeGroup
      ) {
        return;
      }
    }
    this.constraintCandidates.add({
      type,
      strokeGroup,
      refStrokeGroup: this.refStrokeGroup,
    });
  }

  render() {
    super.render();

    for (const { type, strokeGroup } of this.constraintCandidates) {
      const a = strokeGroup.a;
      const b = strokeGroup.b;
      switch (type) {
        case 'vertical':
          SVG.now('polyline', {
            points: SVG.points([
              { x: a.position.x, y: 0 },
              { x: a.position.x, y: 1_000_000 },
            ]),
            stroke: 'rgba(0, 0, 255, 0.2)',
            'stroke-dasharray': '10, 10',
          });
          break;
        case 'horizontal':
          SVG.now('polyline', {
            points: SVG.points([
              { x: 0, y: a.position.y },
              { x: 1_000_000, y: a.position.y },
            ]),
            stroke: 'rgba(0, 0, 255, 0.2)',
            'stroke-dasharray': '10, 10',
          });
          break;
        case 'length':
          SVG.now('polyline', {
            points: SVG.points([a.position, b.position]),
            stroke: 'cornflowerblue',
            'stroke-width': 4,
          });
          break;
        case 'angle': {
          SVG.now('polyline', {
            points: SVG.points([
              Vec.lerp(a.position, b.position, 1_000),
              Vec.lerp(a.position, b.position, -1_000),
            ]),
            stroke: 'rgba(0, 0, 255, 0.2)',
            'stroke-dasharray': '10, 10',
          });
          const { a: ra, b: rb } = this.refStrokeGroup!;
          SVG.now('polyline', {
            points: SVG.points([
              Vec.lerp(ra.position, rb.position, 1_000),
              Vec.lerp(ra.position, rb.position, -1_000),
            ]),
            stroke: 'rgba(0, 0, 255, 0.2)',
            'stroke-dasharray': '10, 10',
          });
          break;
        }
      }
    }

    if (this.refStrokeGroup) {
      const { a, b } = this.refStrokeGroup;
      SVG.now('polyline', {
        points: SVG.points([a.position, b.position]),
        stroke: '#0F0',
        'stroke-width': 4,
      });
    }
  }

  private applyConstraintCandidates() {
    const ra = this.refStrokeGroup?.a;
    const rb = this.refStrokeGroup?.b;

    for (const candidate of this.constraintCandidates) {
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
          const refLenVar = constraints.length(ra!, rb!).length;
          const newLenVar = constraints.length(a, b).length;
          constraints.variableEquals(refLenVar, newLenVar);
          break;
        }
        case 'angle': {
          const angleVar = constraints.angle(a, b, ra!, rb!).angle;
          constraints.fixedValue(angleVar);
          break;
        }
      }
      this.appliedCandidates.add(candidate);
    }
    this.constraintCandidates.clear();
  }
}
