import Token from './Token';
import SVG from '../Svg';
import COLORS from '../Colors';
import { Position } from '../../lib/types';
import { WirePort } from './Wire';
import * as constraints from '../constraints';
import Vec from '../../lib/vec';
import {
  MetaStruct,
  MetaNumber,
  MetaConnection,
  MetaNumberConnection,
} from './MetaSemantics';

function PropertyPickerPath(pos: Position, w: number, h: number) {
  return `
    M ${pos.x} ${pos.y}
    L ${pos.x + w} ${pos.y}
    L ${pos.x + w} ${pos.y + h}
    L ${pos.x} ${pos.y + h}
    L ${pos.x - 20} ${pos.y + h / 2}
  `;
}

export default class PropertyPicker extends Token {
  protected readonly boxElement = SVG.add('path', SVG.metaElm, {
    d: PropertyPickerPath(this.position, this.width, this.height),
    fill: COLORS.GREY_DARK,
  });

  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5,
    y: this.position.y + 24,
    fill: COLORS.WHITE,
    'font-size': '24px',
  });

  readonly inputVariable = new MetaStruct({});
  readonly inputPort = this.adopt(
    new WirePort(this.position, this.inputVariable)
  );

  readonly outputVariable = new MetaNumber(constraints.variable());
  readonly outputPort = this.adopt(
    new WirePort(this.position, this.outputVariable)
  );

  private property: string | null = null;

  internalConnection: MetaConnection | null = null;

  isPrimary(): boolean {
    return true;
  }

  render(): void {
    SVG.update(this.boxElement, {
      d: PropertyPickerPath(this.position, this.width, this.height),
    });

    this.inputPort.position = Vec.add(this.position, Vec(-20, this.height / 2));
    this.outputPort.position = Vec.add(
      this.position,
      Vec(this.width, this.height / 2)
    );

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 24,
    });

    this.textElement.textContent = this.property;
    this.width = this.textElement.getComputedTextLength() + 10;
  }

  setProperty(newValue: string) {
    this.property = newValue;
    this.update();
  }

  update() {
    if (!this.property) {
      return;
    }

    const pickedValue = this.inputVariable.get(this.property);
    if (pickedValue) {
      this.internalConnection = new MetaNumberConnection(
        pickedValue as MetaNumber,
        this.outputVariable
      );
    }
  }
}
