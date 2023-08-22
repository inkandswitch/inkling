import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import SVG, { updateSvgElement } from '../Svg';
import generateId from '../generateId';

const SHOW_IDS = false;

export interface HandleListener {
  onHandleMoved(moved: Handle): void;
}

export type HandleType = 'formal' | 'informal';

interface CanonicalInstanceState {
  isCanonical: true;
  id: number;
  type: HandleType;
  absorbedHandles: Set<Handle>;
  position: Position;
  elements: { normal: SVGElement; selected: SVGElement; label: SVGTextElement };
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
    return new Handle(
      svg,
      this.makeCanonicalInstanceState(svg, type, position)
    );
  }

  private static makeCanonicalInstanceState(
    svg: SVG,
    type: HandleType,
    position: Position
  ): CanonicalInstanceState {
    const label = svg.addElement('text', {
      x: 0,
      y: 0,
      visibility: SHOW_IDS ? 'visible' : 'hidden',
    }) as SVGTextElement;
    label.appendChild(document.createTextNode('?'));

    return {
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
        label,
      },
      selected: false,
      needsRerender: true,
      wasRemoved: false,
    };
  }

  // --- instance stuff ---

  private readonly listeners = new Set<HandleListener>();

  private constructor(
    private svg: SVG, // silly that we need to keep this...
    private instanceState: InstanceState
  ) {
    if (instanceState.isCanonical) {
      Handle.all.add(this);
    }

    Handle.allInstances.add(this);
  }

  // methods that can be called on any handle

  get id(): number {
    return !this.instanceState.isCanonical
      ? this.canonicalInstance.id
      : this.instanceState.id;
  }

  get type(): HandleType {
    return !this.instanceState.isCanonical
      ? this.canonicalInstance.type
      : this.instanceState.type;
  }

  get canonicalInstance(): Handle {
    return !this.instanceState.isCanonical
      ? this.instanceState.canonicalInstance
      : this;
  }

  get position(): Position {
    return !this.instanceState.isCanonical
      ? this.canonicalInstance.position
      : this.instanceState.position;
  }

  set position(pos: Position) {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.position = pos;
      return;
    }

    this.instanceState.position = pos;
    this.instanceState.needsRerender = true;

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

  remove() {
    if (!this.instanceState.isCanonical) {
      this.canonicalInstance.remove();
      return;
    }

    this.removeFromDOM();

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

    for (const handle of [that, ...that.instanceState.absorbedHandles]) {
      // update the instance state of the absorbed handle
      handle.instanceState = { isCanonical: false, canonicalInstance: this };

      // add it to my absorbed set
      this.instanceState.absorbedHandles.add(handle);

      // notify its listeners
      handle.notifyListeners(listener => listener.onHandleMoved(that));
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

  get absorbedHandles(): Set<Handle> {
    if (!this.instanceState.isCanonical) {
      throw new Error('accessed hasAbsorbedHandles on absorbed handle');
    }

    return this.instanceState.absorbedHandles;
  }

  breakOff(handle: Handle, destination: Handle | null = null) {
    if (!this.instanceState.isCanonical) {
      throw new Error('called breakOff() on an absorbed handle');
    } else if (this.instanceState.absorbedHandles.size < 1) {
      throw new Error('called breakOff() on a singleton handle');
    }

    if (this === handle) {
      const absorbedHandles = Array.from(this.absorbedHandles);

      // promote one of my absorbed handles to a canonical handle
      const newCanonicalInstance = absorbedHandles.pop()!;
      newCanonicalInstance.promoteToCanonical();

      // move my other absorbed handles to the new canonical handle
      while (absorbedHandles.length > 0) {
        const absorbedHandle = absorbedHandles.pop()!;
        this.breakOff(absorbedHandle, newCanonicalInstance);
      }

      destination?.absorb(this);
    } else if (this.absorbedHandles.has(handle)) {
      handle.promoteToCanonical();
      destination?.absorb(handle);
    } else {
      throw new Error('called breakOff(h) but h is unrelated to receiver');
    }
  }

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

    const label = state.elements.label;
    const labelText = label.firstChild!;
    labelText.textContent = '' + this.id;
    updateSvgElement(label, {
      transform: `translate(${state.position.x - label.getBBox().width / 2} ${
        state.position.y - 10
      })`,
    });

    state.needsRerender = false;
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

  private promoteToCanonical() {
    if (this.instanceState.isCanonical) {
      throw new Error('called promoteToCanonical() on canonical handle');
    }

    // remove me from my previous canonical handle
    this.canonicalInstance.absorbedHandles.delete(this);

    // change my instance state to make me a canonical handle
    this.instanceState = Handle.makeCanonicalInstanceState(
      this.svg,
      this.type,
      this.position
    );

    // add me to the list of canonical handles
    Handle.all.add(this);
  }
}
