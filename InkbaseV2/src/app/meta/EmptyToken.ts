import Token from './Token';
import SVG from '../Svg';
import * as ohm from 'ohm-js';
import { WirePort } from './Wire';
import { MetaLabel } from './MetaSemantics';
import { boundingBoxFromStrokes } from '../../lib/bounding_box';
import WritingCell from './WritingCell';

export default class EmptyToken extends Token {
  width = 24;
  height = 30;
  value = "";

  constructor() {
    super();
  }

  isPrimary(): boolean {
    return true;
  }

  render(dt: number, t: number): void {
    // NOOP
  }
}
