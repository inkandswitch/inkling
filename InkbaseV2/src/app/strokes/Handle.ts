import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import SVG, { updateSvgElement } from '../Svg';
import generateId from '../generateId';

export interface HandleListener {
  onHandleMoved(handle: Handle): void;
  onHandleRemoved(handle: Handle): void;
}

export type HandleType = 'formal' | 'informal';

interface HandleState {
  id: number;
  type: HandleType;
  position: Position;
  listeners: Set<HandleListener>;
  elements: { normal: SVGElement; selected: SVGElement };
  selected: boolean;
  needsRerender: boolean;
}

export default class Handle {
  // --- static stuff ---

  // only canonical handles
  static readonly all = new Set<Handle>();

  // contains non-canonical handles, too
  private static readonly allInstances = new Set<Handle>();

  private static readonly stateById = new Map<number, HandleState>();

  static create(svg: SVG, type: HandleType, position: Position): Handle {
    const id = generateId();

    const state: HandleState = {
      id,
      type,
      position,
      listeners: new Set(),
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
    };
    return new Handle(id, state);
  }

  // --- instance stuff ---

  public canonicalInstance: Handle = this;

  private constructor(
    public id: number,
    state: HandleState
  ) {
    Handle.all.add(this);
    Handle.allInstances.add(this);
    Handle.stateById.set(id, state);
  }

  private getState(): HandleState {
    const state = Handle.stateById.get(this.id);
    if (!state) {
      throw new Error(`no state for handle w/ id ${this.id}`);
    } else {
      return state;
    }
  }

  select() {
    const state = this.getState();
    state.selected = true;
    state.needsRerender = true;
  }

  deselect() {
    const state = this.getState();
    state.selected = false;
    state.needsRerender = true;
  }

  get position(): Position {
    return this.getState().position;
  }

  setPosition(pos: Position) {
    const state = this.getState();
    state.position = pos;
    state.needsRerender = true;
    for (const listener of state.listeners) {
      listener.onHandleMoved(this);
    }
  }

  get listeners(): Set<HandleListener> {
    return this.getState().listeners;
  }

  remove() {
    // b/c of absorb operation, there may be several handle instances w/ the same id
    if (this !== this.canonicalInstance) {
      this.canonicalInstance.remove();
      return;
    }

    this.removeFromDOM();

    // tell everybody that I'm gone
    for (const listener of this.listeners) {
      listener.onHandleRemoved(this);
    }

    this.forEachSiblingThenMe(sibling => {
      Handle.allInstances.delete(sibling);
      sibling.id = -1; // to make it obvious that it's gone
    });

    // remove me from the set of canonical instances and the state map
    Handle.all.delete(this);
    Handle.stateById.delete(this.id);
  }

  absorb(that: Handle) {
    // b/c of this operation, there may be several handle instances w/ the same id
    that = that.canonicalInstance;

    const thisState = this.getState();
    const thatState = that.getState();

    if (thisState.type !== thatState.type) {
      throw new Error('cannot merge handles of different types!');
    }

    // remove the handle from the DOM and the state map
    that.removeFromDOM();
    Handle.stateById.delete(thatState.id);

    that.forEachSiblingThenMe(sibling => {
      sibling.id = this.id;
      sibling.canonicalInstance = this;
      Handle.all.delete(sibling); // not a canonical handle anymore
    });

    // tell the handle's listeners that it has moved,
    // then move its listeners them to me
    for (const listener of thatState.listeners) {
      listener.onHandleMoved(that);
      thisState.listeners.add(listener);
      thatState.listeners.delete(listener);
    }
  }

  absorbNearbyHandles() {
    const position = this.getState().position;
    for (const that of Handle.all) {
      if (that === this) {
        continue;
      }
      const dist = Vec.dist(position, that.getState().position);
      if (dist < 10) {
        this.absorb(that);
      }
    }
  }

  render() {
    const state = this.getState();
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

  private forEachSiblingThenMe(fn: (handle: Handle) => void) {
    for (const sibling of Handle.allInstances) {
      if (sibling !== this && sibling.id === this.id) {
        fn(sibling);
      }
    }
    fn(this);
  }

  private removeFromDOM() {
    const state = this.getState();
    state.elements.normal.remove();
    state.elements.selected.remove();
  }
}
