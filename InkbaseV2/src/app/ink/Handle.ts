import { GameObject, root } from '../GameObject';
import SVG from '../Svg';
import * as constraints from '../constraints';
import { generateId } from '../../lib/helpers';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import { Constraint, Pin } from '../constraints';

export default class Handle extends GameObject {
  static create(position: Position, getAbsorbed = true): Handle {
    const handle = new Handle(position);
    if (getAbsorbed) {
      handle.getAbsorbedByNearestHandle();
    }
    return handle;
  }

  public readonly id = generateId();

  private readonly elm = SVG.add('g', SVG.inkElm, { class: 'handle' });
  private readonly circle = SVG.add('circle', this.elm, { r: 15 });
  private readonly pin = SVG.add('path', this.elm, {
    d: 'M-5,-5 L5,5 M-5,5 L5,-5',
  });

  public readonly xVariable = constraints.variable(0, {
    object: this,
    property: 'x',
  });
  public readonly yVariable = constraints.variable(0, {
    object: this,
    property: 'y',
  });

  private constructor(position: Position) {
    super(root);
    this.position = position;
  }

  get x() {
    return this.xVariable.value;
  }

  get y() {
    return this.yVariable.value;
  }

  get position(): Position {
    return this;
  }

  set position(pos: Position) {
    ({ x: this.xVariable.value, y: this.yVariable.value } = pos);
  }

  remove() {
    this.elm.remove();
    super.remove();
  }

  absorb(that: Handle) {
    constraints.absorb(this, that);
  }

  getAbsorbedByNearestHandle() {
    const nearestHandle = this.page.find({
      what: aCanonicalHandle,
      near: this.position,
      that: handle => handle !== this,
    });
    if (nearestHandle) {
      nearestHandle.absorb(this);
    }
  }

  private _canonicalHandle: Handle = this;
  readonly absorbedHandles = new Set<Handle>();

  get isCanonical() {
    return this._canonicalHandle === this;
  }

  get canonicalInstance() {
    return this._canonicalHandle;
  }

  private set canonicalInstance(handle: Handle) {
    this._canonicalHandle = handle;
  }

  /** This method should only be called by the constraint system. */
  _absorb(that: Handle) {
    if (that === this) {
      return;
    }

    that.canonicalInstance.absorbedHandles.delete(that);
    for (const handle of that.absorbedHandles) {
      this._absorb(handle);
    }
    that.canonicalInstance = this;
    this.absorbedHandles.add(that);
  }

  /** This method should only be called by the constraint system. */
  _forgetAbsorbedHandles() {
    this.canonicalInstance = this;
    this.absorbedHandles.clear();
  }

  breakOff(handle: Handle) {
    if (this.absorbedHandles.has(handle)) {
      constraints.absorb(this, handle).remove();
      return;
    } else if (handle === this) {
      const absorbedHandles = [...this.absorbedHandles];
      const newCanonicalHandle = absorbedHandles.shift()!;
      constraints.absorb(this, newCanonicalHandle).remove();
      for (const absorbedHandle of absorbedHandles) {
        constraints.absorb(newCanonicalHandle, absorbedHandle);
      }
    } else {
      throw new Error('tried to break off a handle that was not absorbed');
    }
  }

  get hasPin() {
    for (const constraint of Constraint.all) {
      if (
        constraint instanceof Pin &&
        constraint.handle.canonicalInstance === this.canonicalInstance
      ) {
        return true;
      }
    }
    return false;
  }

  togglePin(doPin: boolean = !this.hasPin): void {
    if (!this.isCanonical) {
      return this.canonicalInstance.togglePin(doPin);
    }

    for (const h of [this, ...this.absorbedHandles]) {
      if (doPin) {
        constraints.pin(h);
      } else {
        constraints.pin(h).remove();
      }
    }
  }

  render(t: number, dt: number) {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this),
      'is-canonical': this.isCanonical,
      'has-pin': this.hasPin,
    });
    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point);
  }
}

export const aHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle ? gameObj : null;

export const aCanonicalHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle && gameObj.isCanonical ? gameObj : null;
