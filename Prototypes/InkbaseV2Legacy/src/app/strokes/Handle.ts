import { Position } from '../../lib/types';
import { generateId, notUndefined } from '../../lib/helpers';
import SVG from '../Svg';
import * as constraints from '../constraints';
import { GameObject, root } from '../GameObject';
import Vec from '../../lib/vec';

const SHOW_DEBUG_INFO = false;

export interface HandleListener {
  onHandleMoved(moved: Handle): void;
}

export type HandleType = 'formal' | 'informal';

interface CanonicalInstanceState {
  isCanonical: true;
  id: number;
  type: HandleType;
  absorbedHandles: WeakRef<Handle>[];
  position: Position;
  elements: {
    normal: SVGElement;
    selected: SVGElement;
    label: SVGTextElement;
  };
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
    type: HandleType,
    position: Position,
    listener: HandleListener | null = null
  ): Handle {
    const handle = new Handle(this.makeCanonicalInstanceState(type, position));
    if (listener) {
      handle.addListener(listener);
    }
    handle.absorbNearbyHandles();
    return handle;
  }

  private static makeCanonicalInstanceState(
    type: HandleType,
    position: Position,
    id = generateId()
  ): CanonicalInstanceState {
    return {
      isCanonical: true,
      id,
      type,
      absorbedHandles: [],
      position,
      elements: {
        normal: SVG.add(
          'circle',
          type === 'formal'
            ? { cx: 0, cy: 0, r: 3, fill: 'black' }
            : { r: 5, fill: 'rgba(100, 100, 100, .2)' }
        ),
        selected: SVG.add('circle', {
          cx: 0,
          cy: 0,
          r: 7,
          fill: 'none',
        }),
        label: SVG.add('text', {
          x: 0,
          y: 0,
          visibility: SHOW_DEBUG_INFO ? 'visible' : 'hidden',
          content: '?',
        }),
      },
      isSelected: false,
      wasRemoved: false,
    };
  }

  // --- instance stuff ---

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

  get type(): HandleType {
    return !this.instanceState.isCanonical
      ? this.canonicalInstance.type
      : this.instanceState.type;
  }

  get canonicalInstance(): Handle {
    return this.instanceState.isCanonical
      ? this
      : this.instanceState.canonicalInstance.deref() ??
          this.promoteToCanonical();
  }

  get position(): Position {
    return (this.canonicalInstance.instanceState as CanonicalInstanceState)
      .position;
  }

  set position(pos: Position) {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.position = pos;
      return;
    }

    this.instanceState.position = pos;

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
    } else if (this.instanceState.type !== that.instanceState.type) {
      throw new Error('handle type mismatch');
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

      // notify its listeners
      handle.notifyListeners(listener => listener.onHandleMoved(that));
    }

    constraints.onHandlesReconfigured();
  }

  absorbNearbyHandles() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.absorbNearbyHandles();
      return;
    }

    this.page.forEach({
      what: aHandle,
      near: this.position,
      tooFar: 10,
      do: that => this.absorb(that),
    });
  }

  // methods that can only be called on canonical handles

  get absorbedHandles(): Handle[] {
    if (!this.instanceState.isCanonical) {
      throw new Error('accessed absorbedHandles on absorbed handle');
    }

    return this.instanceState.absorbedHandles
      .map(wr => wr.deref())
      .filter(notUndefined);
  }

  breakOff(handle: Handle, destination: Handle | null = null) {
    if (!this.instanceState.isCanonical) {
      throw new Error('called breakOff() on an absorbed handle');
    }

    const absorbedHandles = this.absorbedHandles;
    if (absorbedHandles.length === 0) {
      throw new Error('called breakOff() on a singleton handle');
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
      throw new Error(
        'argument to Handle.breakOff() is not an absorbed handle'
      );
    }

    constraints.onHandlesReconfigured();
  }

  render(t: number, dt: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }

    const state = this.instanceState;
    if (!state.isCanonical) {
      return;
    }

    SVG.update(state.elements.normal, {
      transform: `translate(${state.position.x} ${state.position.y})`,
    });

    SVG.update(state.elements.selected, {
      transform: `translate(${state.position.x} ${state.position.y})`,
      fill: state.isSelected ? 'rgba(180, 134, 255, 0.42)' : 'none',
    });

    SVG.update(state.elements.label, {
      transform: `translate(${
        state.position.x - state.elements.label.getBBox().width / 2
      } ${state.position.y - 10})`,
      content: `${this.id}@(${Math.round(this.position.x)}, ${Math.round(
        this.position.y
      )})`,
    });
  }

  private removeFromDOM() {
    if (!this.instanceState.isCanonical) {
      throw new Error('called removeFromDOM() on absorbed handle');
    }

    this.instanceState.elements.normal.remove();
    this.instanceState.elements.selected.remove();
    this.instanceState.elements.label.remove();
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
      throw new Error('called  notifyAbsorbedListeners() on absorbed handle');
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
      throw new Error('called promoteToCanonical() on canonical handle');
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
      this.type,
      this.position,
      this.instanceState.origId
    );

    return this;
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point);
  }
}

export const aHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle ? gameObj : null;

export const aCanonicalHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle && gameObj.canonicalInstance === gameObj
    ? gameObj
    : null;
