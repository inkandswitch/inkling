import SVG, {updateSvgElement} from '../Svg';
import generateId from '../generateId';
import Handle from './Handle';

export default class LineSegment {
  id = generateId();
  selected = false;
  elements: {normal: SVGElement; selected: SVGElement};

  private needsRerender = true;

  constructor(
    svg: SVG,
    public a: Handle,
    public b: Handle
  ) {
    a.listeners.add(this);
    b.listeners.add(this);

    const normalAttributes = {
      x1: a.position.x,
      y1: a.position.y,
      x2: b.position.x,
      y2: b.position.y,
      'stroke-width': 1,
      stroke: 'black',
    };
    this.elements = {
      normal: svg.addElement('line', normalAttributes),
      selected: svg.addElement('line', {
        ...normalAttributes,
        'stroke-width': 7,
        stroke: 'none',
      }),
    };
  }

  onHandleMoved() {
    this.needsRerender = true;
  }

  onHandleRemoved() {
    // no-op
  }

  select() {
    this.needsRerender = true;
    this.selected = true;
  }

  deselect() {
    this.needsRerender = true;
    this.selected = false;
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    const normalAttributes = {
      x1: this.a.position.x,
      y1: this.a.position.y,
      x2: this.b.position.x,
      y2: this.b.position.y,
    };
    updateSvgElement(this.elements.normal, normalAttributes);
    updateSvgElement(this.elements.selected, {
      ...normalAttributes,
      stroke: this.selected ? 'rgba(180, 134, 255, 0.42)' : 'none',
    });

    this.needsRerender = false;
  }
}
