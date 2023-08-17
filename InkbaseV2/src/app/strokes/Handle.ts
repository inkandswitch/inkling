import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import SVG, { updateSvgElement } from '../Svg';
import generateId from '../generateId';

export interface HandleListener {
  onHandleMoved(handle: Handle): void;
  onHandleAbsorbed(handle: Handle): void;
  onHandleRemoved(handle: Handle): void;
}

export type HandleType = 'formal' | 'informal';

interface CanonicalInstanceState {
  isCanonical: true;
  id: number;
  type: HandleType;
  absorbedHandles: Set<Handle>;
  position: Position;
  elements: { normal: SVGElement; selected: SVGElement };
  selected: boolean;
  needsRerender: boolean;
  wasRemoved: boolean;
}

interface AbsorbedInstanceState {
  isCanonical: false;
  canonicalInstance: Handle;
}

type InstanceState = CanonicalInstanceState | AbsorbedInstanceState;

export default class Handle {
  // --- static stuff ---

  // only canonical handles
  static readonly all = new Set<Handle>();

  // contains canonical and absorbed handles
  private static readonly allInstances = new Set<Handle>();

  static create(svg: SVG, type: HandleType, position: Position): Handle {
    return new Handle({
      isCanonical: true,
      id: generateId(),
      type,
      absorbedHandles: new Set(),
      position,
      elements: {
        normal: svg.addElement(
          'circle',
          type === 'formal'
            ? { cx: 0, cy: 0, r: 3, fill: 'black' }
            : { r: 5, fill: 'rgba(100, 100, 100, .2)' }
        ),
        selected: svg.addElement('circle', {
          cx: 0,
          cy: 0,
          r: 7,
          fill: 'none',
        }),
      },
      selected: false,
      needsRerender: true,
      wasRemoved: false,
    });
  }

  // --- instance stuff ---

  private readonly listeners = new Set<HandleListener>();

  private constructor(private instanceState: InstanceState) {
    if (instanceState.isCanonical) {
      Handle.all.add(this);
    }

    Handle.allInstances.add(this);
  }

  // methods that can be called on any handle

  addListener(listener: HandleListener) {
    this.listeners.add(listener);
  }

  get canonicalInstance(): Handle {
    return !this.instanceState.isCanonical
      ? this.instanceState.canonicalInstance
      : this;
  }

  select() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.select();
      return;
    }

    this.instanceState.selected = true;
    this.instanceState.needsRerender = true;
  }

  deselect() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.deselect();
      return;
    }

    this.instanceState.selected = false;
    this.instanceState.needsRerender = true;
  }

  get position(): Position {
    return !this.instanceState.isCanonical
      ? this.canonicalInstance.position
      : this.instanceState.position;
  }

  setPosition(pos: Position) {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.setPosition(pos);
      return;
    }

    this.instanceState.position = pos;
    this.instanceState.needsRerender = true;
    this.notifyListeners((handle, listener) => listener.onHandleMoved(handle));
  }

  remove() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.remove();
      return;
    }

    this.removeFromDOM();

    this.notifyListeners((handle, listener) =>
      listener.onHandleRemoved(handle)
    );

    // remove me and my absorbed handles from the set of all handles
    Handle.allInstances.delete(this);
    for (const handle of this.instanceState.absorbedHandles) {
      Handle.allInstances.delete(handle);
    }

    // remove me from the set of canonical handles
    Handle.all.delete(this);

    // record that I've been removed -- this is to make debugging easier,
    // should we ever find that some code is holding onto a removed handle
    this.instanceState.wasRemoved = true;
  }

  absorb(that: Handle) {
    // the absorb operation needs canonical instances!
    if (!this.instanceState.isCanonical || !that.instanceState.isCanonical) {
      this.canonicalInstance.absorb(that.canonicalInstance);
      return;
    }

    if (this.instanceState.type !== that.instanceState.type) {
      throw new Error('handle type mismatch');
    }

    // remove the absorbed canonical handle from the DOM and canonical instance set
    that.removeFromDOM();
    Handle.all.delete(that);

    // update the instance state of the new absorbed handles,
    // add them to my set of absorbed handles, and
    // tell their listeners that they've been absorbed and moved
    for (const handle of [that, ...that.instanceState.absorbedHandles]) {
      handle.instanceState = { isCanonical: false, canonicalInstance: this };
      this.instanceState.absorbedHandles.add(handle);
      for (const listener of handle.listeners) {
        listener.onHandleAbsorbed(handle);
        listener.onHandleMoved(handle);
      }
    }
  }

  absorbNearbyHandles() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.absorbNearbyHandles();
      return;
    }

    for (const that of Handle.all) {
      if (that === this) {
        continue;
      }

      const dist = Vec.dist(this.position, that.position);
      if (dist < 10) {
        this.absorb(that);
      }
    }
  }

  // methods that can only be called on canonical handles

  render() {
    const state = this.instanceState;

    if (!state.isCanonical) {
      throw new Error('called render() on absorbed handle');
    }

    if (!state.needsRerender) {
      return;
    }

    updateSvgElement(state.elements.normal, {
      transform: `translate(${state.position.x} ${state.position.y})`,
    });

    updateSvgElement(state.elements.selected, {
      transform: `translate(${state.position.x} ${state.position.y})`,
      fill: state.selected ? 'rgba(180, 134, 255, 0.42)' : 'none',
    });

    state.needsRerender = false;
  }

  private removeFromDOM() {
    if (!this.instanceState.isCanonical) {
      throw new Error('called removeFromDOM() on absorbed handle');
    }

    this.instanceState.elements.normal.remove();
    this.instanceState.elements.selected.remove();
  }

  private notifyListeners(
    fn: (handle: Handle, listener: HandleListener) => void
  ) {
    if (!this.instanceState.isCanonical) {
      throw new Error('called notifyListeners() on absorbed handle');
    }

    // notify my listeners
    for (const listener of this.listeners) {
      fn(this, listener);
    }

    // notify the listeners of my absorbed handles
    for (const handle of this.instanceState.absorbedHandles) {
      for (const listener of handle.listeners) {
        fn(handle, listener);
      }
    }
  }
}
