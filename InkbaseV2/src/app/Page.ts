import StrokeGroup, { aStrokeGroup } from './strokes/StrokeGroup';
import Stroke from './strokes/Stroke';
import { Position } from '../lib/types';
import { GameObject } from './GameObject';
import Wire from './meta/Wire';
import Namespace from './meta/Namespace';
import { TokenWithVariable } from './meta/token-helpers';
import Gizmo from './Gizmo';

interface Options {
  strokeAnalyzer: boolean;
}

export default class Page extends GameObject {
  readonly namespace = new Namespace();

  constructor(options: Options) {
    super();
  }

  get strokeGroups() {
    return this.findAll({ what: aStrokeGroup, recursive: false });
  }

  addStrokeGroup(strokes: Set<Stroke>): StrokeGroup {
    return this.adopt(new StrokeGroup(strokes));
  }

  addStroke<S extends Stroke>(stroke: S) {
    return this.adopt(stroke);
  }

  addWireFromPosition(position: Position) {
    const w = new Wire();
    w.points = [{ ...position }, { ...position }];
    return this.adopt(w);
  }

  addWireFromToken(token: TokenWithVariable) {
    const w = new Wire();
    w.attachFront(token.wirePort);
    return this.adopt(w);
  }

  addWireFromGizmo(gizmo: Gizmo) {}

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }
  }
}
