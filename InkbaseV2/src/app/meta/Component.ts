import { closestPointOnPolygon } from '../../lib/polygon';
import { Position } from '../../lib/types';
import { GameObject } from '../GameObject';
import Svg from '../Svg';
import { aStroke } from '../ink/Stroke';
import { MetaStruct } from './MetaSemantics';
import Token from './Token';
import { WirePort } from './Wire';
import ClipperShape from '@doodle3d/clipper-js';

export default class Component extends GameObject {
  editing = false;

  position: Position = { x: 400, y: 100 };
  width = 100;
  height = 100;

  readonly scope = new MetaStruct([]);

  private outline: Array<Position> = [];
  private clipperShape: ClipperShape = new ClipperShape([]);

  readonly wirePorts: Array<WirePort> = [];

  protected readonly svgOutline = Svg.add('path', Svg.metaElm, {
    stroke: 'black',
    fill: 'none',
    'stroke-width': '0.5',
  });

  getWirePortNear(pos: Position): WirePort {
    const closestPoint = closestPointOnPolygon(this.outline, pos);

    const newPort = new WirePort(closestPoint, this.scope);
    this.wirePorts.push(newPort);
    return newPort;
  }

  render(dt: number, t: number): void {
    Svg.update(this.svgOutline, {
      d: Svg.path(this.outline),
    });

    for (const child of this.children) {
      if (child instanceof Token) {
        child.hidden = !this.editing;
      }
      child.render(dt, t);
    }
  }

  distanceToPoint(pos: Position): number | null {
    if (this.clipperShape.pointInShape(pos, true)) {
      return 0;
    } else {
      return Infinity;
    }
  }

  updateOutline() {
    const strokes = this.findAll({ what: aStroke });
    this.clipperShape = new ClipperShape(
      strokes.map(stroke => stroke.points),
      true,
      true,
      true,
      true
    );
    this.clipperShape = this.clipperShape.offset(7, {
      jointType: 'jtRound',
      endType: 'etOpenRound',
      miterLimit: 2.0,
      roundPrecision: 0.1,
    });
    const shapePaths = this.clipperShape.paths.map(path => {
      const p = path.map(pt => {
        return { x: pt.X, y: pt.Y };
      });
      return p.concat([p[0]]);
    });
    this.outline = shapePaths[0];
  }
}

export const aComponent = (gameObj: GameObject) =>
  gameObj instanceof Component ? gameObj : null;
