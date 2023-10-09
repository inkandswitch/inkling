import PropertyPicker from './PropertyPicker';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import COLORS from '../Colors';
import { MetaStruct } from './MetaSemantics';
import { GameObject } from '../GameObject';
import { signedDistanceToBox } from '../../lib/SignedDistance';
import Label from './Label';

const LINEHEIGHT = 30;

export default class PropertyPickerEditor extends GameObject {
  width = 200;
  height = 44;
  position: Position = { x: 100, y: 100 };

  props: Array<Label>;

  protected readonly boxElement: SVGElement;

  svgTextElements: Array<SVGElement> = [];
  propertyPicker: PropertyPicker;

  constructor(propertyPicker: PropertyPicker) {
    super();

    this.propertyPicker = propertyPicker;

    this.props = (propertyPicker.inputPort.value as MetaStruct).list();
    this.height = this.props.length * LINEHEIGHT;
    this.position = propertyPicker.position;

    this.boxElement = SVG.add('rect', SVG.metaElm, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      rx: 3,
      fill: COLORS.GREY_LIGHT,
    });

    this.svgTextElements = this.props.map((label, index) => {
      const text = SVG.add('text', SVG.metaElm, {
        x: this.position.x + 5,
        y: this.position.y + 24 + index * LINEHEIGHT,
        fill: COLORS.GREY_DARK,
        'font-size': '24px',
        'font-family': 'monospace',
      });
      text.textContent = label.display as string;
      return text;
    });
  }

  onTapInside(position: Position) {
    const index = Math.floor((position.y - this.position.y) / LINEHEIGHT);

    this.propertyPicker.setProperty(this.props[index]);
    this.remove();
  }

  distanceToPoint(pos: Position): number | null {
    return signedDistanceToBox(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      pos.x,
      pos.y
    );
  }

  render() {
    // NOOP
  }

  remove() {
    for (const element of this.svgTextElements) {
      element.remove();
    }

    this.boxElement.remove();
    super.remove();
  }
}

export const aPropertyPickerEditor = (gameObj: GameObject) =>
  gameObj instanceof PropertyPickerEditor ? gameObj : null;
