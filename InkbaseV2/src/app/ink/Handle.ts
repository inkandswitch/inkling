import { Position } from '../../lib/types';
import { generateId, notUndefined } from '../../lib/helpers';
import SVG from '../Svg';
import { Variable } from '../constraints';
import { GameObject, root } from '../GameObject';
import Vec from '../../lib/vec';

const SHOW_DEBUG_INFO = false;

export interface HandleListener {
  onHandleMoved(moved: Handle): void;
}

interface CanonicalInstanceState {
  isCanonical: true;
  id: number;
  absorbedHandles: WeakRef<Handle>[];
  element: SVGElement;
  isSelected: boolean;
  wasRemoved: boolean;
}

interface AbsorbedInstanceState {
  isCanonical: false;
  canonicalInstance: WeakRef<Handle>;
  origId: number;
}

type InstanceState = CanonicalInstanceState | AbsorbedInstanceState;

export default class Handle extends GameObject {
  // --- static stuff ---

  static create(
    position: Position,
    listener: HandleListener | null = null
  ): Handle {
    const handle = new Handle(this.makeCanonicalInstanceState());
    handle.position = position;
    if (listener) {
      handle.addListener(listener);
    }
    handle.absorbNearbyHandles();
    return handle;
  }

  private static makeCanonicalInstanceState(
    id = generateId()
  ): CanonicalInstanceState {
    return {
      isCanonical: true,
      id,
      absorbedHandles: [],
      element: SVG.add('circle', SVG.inkElm, { class: 'handle', r: 3 }),
      isSelected: false,
      wasRemoved: false,
    };
  }

  // --- instance stuff ---

  public readonly xVariable = new Variable(0, { object: this, property: 'x' });
  public readonly yVariable = new Variable(0, { object: this, property: 'y' });
  private readonly listeners = new Set<HandleListener>();

  private constructor(private instanceState: InstanceState) {
    super(root);
  }

  // methods that can be called on any handle

  /**
   * Returns this handle's id, if it's canonical,
   * or the id of its canonical instance, if it's been absorbed.
   */
  get id(): number {
    return !this.instanceState.isCanonical
      ? this.canonicalInstance.id
      : this.instanceState.id;
  }

  /** Returns this handle's own id, which doesn't change when the handle is absorbed. */
  get ownId(): number {
    return this.instanceState.isCanonical
      ? this.instanceState.id
      : this.instanceState.origId;
  }

  get canonicalInstance(): Handle {
    return this.instanceState.isCanonical
      ? this
      : this.instanceState.canonicalInstance.deref() ??
          this.promoteToCanonical();
  }

  get isCanonical(): boolean {
    return this.instanceState.isCanonical;
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

  // TODO: if the handle's x and/or y are changed by the
  // constraint solver, should notify handlers
  // (but only once per frame).
  set position(pos: Position) {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.position = pos;
      return;
    }

    ({ x: this.xVariable.value, y: this.yVariable.value } = pos);

    // notify listeners
    this.notifyListeners(listener => listener.onHandleMoved(this));
    this.notifyAbsorbedListeners((handle, listener) =>
      listener.onHandleMoved(handle)
    );
  }

  addListener(listener: HandleListener) {
    this.listeners.add(listener);
  }

  select() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.select();
      return;
    }

    this.instanceState.isSelected = true;
  }

  deselect() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.deselect();
      return;
    }

    this.instanceState.isSelected = false;
  }

  get isSelected(): boolean {
    return this.instanceState.isCanonical
      ? this.instanceState.isSelected
      : this.canonicalInstance.isSelected;
  }

  remove() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.remove();
      return;
    }

    this.removeFromDOM();

    // record that I've been removed -- this is to make debugging easier,
    // should we ever find that some code is holding onto a removed handle
    this.instanceState.wasRemoved = true;
  }

  absorb(that: Handle) {
    // the absorb operation needs canonical instances!
    if (!this.instanceState.isCanonical || !that.instanceState.isCanonical) {
      this.canonicalInstance.absorb(that.canonicalInstance);
      return;
    } else if (this === that) {
      return;
    }

    // remove the absorbed canonical handle from the DOM and canonical instance set
    that.removeFromDOM();

    for (const handle of [that, ...that.absorbedHandles]) {
      // update the instance state of the absorbed handle
      handle.instanceState = {
        isCanonical: false,
        canonicalInstance: new WeakRef(this),
        origId: handle.ownId,
      };

      // add it to my absorbed set
      this.instanceState.absorbedHandles.push(new WeakRef(handle));

      // my x and y vars absorb its x and y vars, resp.
      this.xVariable.absorb(that.xVariable);
      this.yVariable.absorb(that.yVariable);

      // notify its listeners
      handle.notifyListeners(listener => listener.onHandleMoved(that));
    }
  }

  absorbNearbyHandles() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.absorbNearbyHandles();
      return;
    }

    this.page.forEach({
      what: aHandle,
      near: this.position,
      tooFar: 20,
      do: that => this.absorb(that),
    });
  }

  setupVariableRelationships() {
    if (!this.instanceState.isCanonical) {
      return;
    }

    for (const handle of this.absorbedHandles) {
      this.xVariable.absorb(handle.xVariable);
      this.yVariable.absorb(handle.yVariable);
    }
  }

  // methods that can only be called on canonical handles

  get absorbedHandles(): Handle[] {
    if (!this.instanceState.isCanonical) {
      throw new Error('Accessed absorbedHandles on absorbed handle');
    }

    return this.instanceState.absorbedHandles
      .map(wr => wr.deref())
      .filter(notUndefined);
  }

  breakOff(handle: Handle, destination: Handle | null = null) {
    if (!this.instanceState.isCanonical) {
      throw new Error('Called breakOff() on an absorbed handle');
    }

    const absorbedHandles = this.absorbedHandles;
    if (absorbedHandles.length === 0) {
      throw new Error('Called breakOff() on a singleton handle');
    }

    if (this === handle) {
      // promote one of my absorbed handles to a canonical handle
      const newCanonicalInstance = absorbedHandles.pop()!;
      newCanonicalInstance.promoteToCanonical();

      // move my other absorbed handles to the new canonical handle
      for (const absorbedHandle of absorbedHandles) {
        this.breakOff(absorbedHandle, newCanonicalInstance);
      }

      destination?.absorb(this);
    } else if (absorbedHandles.includes(handle)) {
      handle.promoteToCanonical();
      destination?.absorb(handle);
    } else {
      throw new Error("Argument to Handle.breakOff() isn't an absorbed handle");
    }
  }

  render(t: number, dt: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }

    const state = this.instanceState;
    if (!state.isCanonical) {
      return;
    }

    SVG.update(state.element, { cx: this.x, cy: this.y });
  }

  private removeFromDOM() {
    if (!this.instanceState.isCanonical) {
      throw new Error('Called removeFromDOM() on absorbed handle');
    }
    this.instanceState.element.remove();
  }

  private notifyListeners(fn: (listener: HandleListener) => void) {
    for (const listener of this.listeners) {
      fn(listener);
    }
  }

  private notifyAbsorbedListeners(
    fn: (handle: Handle, listener: HandleListener) => void
  ) {
    if (!this.instanceState.isCanonical) {
      throw new Error('Called notifyAbsorbedListeners() on absorbed handle');
    }

    for (const handle of this.absorbedHandles) {
      for (const listener of handle.listeners) {
        fn(handle, listener);
      }
    }
  }

  // methods that can only be called on absorbed handles

  private promoteToCanonical(): this {
    if (this.instanceState.isCanonical) {
      throw new Error('Called promoteToCanonical() on canonical handle');
    }

    // remove me from my previous canonical handle
    const prevCanonicalInstanceState = this.canonicalInstance
      .instanceState as CanonicalInstanceState;
    const idxToRemove = prevCanonicalInstanceState.absorbedHandles.findIndex(
      wr => wr.deref() === this
    );
    if (idxToRemove >= 0) {
      prevCanonicalInstanceState.absorbedHandles.splice(idxToRemove, 1);
    }
    prevCanonicalInstanceState.absorbedHandles;

    // change my instance state to make me a canonical handle
    this.instanceState = Handle.makeCanonicalInstanceState(
      this.instanceState.origId
    );

    // promote my x and y variables to canonical variables, too
    // (so that their values are not tied to my x and y variables' values)
    this.xVariable.promoteToCanonical();
    this.yVariable.promoteToCanonical();

    return this;
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point);
  }
}

export const aHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle ? gameObj : null;

export const aCanonicalHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle && gameObj.isCanonical ? gameObj : null;
