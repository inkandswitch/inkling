import { Position } from "../../lib/types";
import SVG, { updateSvgElement } from "../Svg";
import generateId from "../generateId";

export interface HandleListener {
  onHandleMoved(handle: Handle): void;
  onHandleRemoved(handle: Handle): void;
}

export type HandleType = "formal" | "informal";

export default class Handle {
  // static stuff

  static handleById = new Map<number, Handle>();

  static create(svg: SVG, type: HandleType, position: Position): number {
    const handle = new Handle(svg, type, position);
    Handle.handleById.set(handle.id, handle);
    return handle.id;
  }

  static addListener(id: number, listener: HandleListener) {
    Handle.get(id).listeners.add(listener);
  }

  static get(id: number): Handle {
    const handle = this.handleById.get(id);
    if (handle == null) {
      throw new Error("invalid handle id: " + id);
    } else {
      return handle;
    }
  }

  static get all(): IterableIterator<Handle> {
    return Handle.handleById.values();
  }

  // instance stuff

  readonly id = generateId();
  readonly listeners = new Set<HandleListener>();

  private readonly elements: { normal: SVGElement; selected: SVGElement };
  private selected = false;
  private needsRerender = false;

  private constructor(svg: SVG, readonly type: HandleType, public position: Position) {
    this.elements = {
      normal: svg.addElement(
        "circle",
        this.type === "formal"
          ? { cx: 0, cy: 0, r: 3, fill: "black" }
          : { r: 5, fill: "rgba(100, 100, 100, .2)" }
      ),
      selected: svg.addElement("circle", { cx: 0, cy: 0, r: 7, fill: "none" }),
    };
  }

  select() {
    this.needsRerender = true;
    this.selected = true;
  }

  deselect() {
    this.needsRerender = true;
    this.selected = false;
  }

  setPosition(pos: Position) {
    this.position = pos;
    this.needsRerender = true;
    for (const listener of this.listeners) {
      listener.onHandleMoved(this);
    }
  }

  remove() {
    // remove me from the map
    Handle.handleById.delete(this.id);

    // remove my SVG elements from the DOM
    this.elements.normal.remove();
    this.elements.selected.remove();

    // tell everybody about this
    for (const listener of this.listeners) {
      listener.onHandleRemoved(this);
    }
  }

  absorb(that: Handle) {
    if (this.type !== that.type) {
      throw new Error("cannot merge handles of different types!");
    }

    // move the other handle's listeners to me, and tell them that the handle has moved
    for (const listener of that.listeners) {
      this.listeners.add(listener);
      listener.onHandleMoved(this);
    }

    // remove the other handle from the DOM and the map
    that.remove();

    // update the map so that any references to the old handle now come to me
    Handle.handleById.set(that.id, this);
  }

  absorbNearby() {
    // TODO
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    updateSvgElement(this.elements.normal, {
      transform: `translate(${this.position.x} ${this.position.y})`,
    });

    updateSvgElement(this.elements.selected, {
      transform: `translate(${this.position.x} ${this.position.y})`,
      fill: this.selected ? "rgba(180, 134, 255, 0.42)" : "none",
    });

    this.needsRerender = false;
  }
}
