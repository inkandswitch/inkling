import Vec from "../lib/vec.js";
import SVG from "./Svg.js";
import Handle from "./strokes/Handle.js";
export default class Snaps {
  constructor(page, options) {
    this.page = page;
    this.options = options;
    this.activeSnaps = [];
    this.snapSvgElementById = new Map();
    this.needsRerender = false;
  }
  snapPositions(transformedPositions) {
    const snaps = [];
    const snapPositions = new Map();
    const snapHandles = Array.from(Handle.all).filter((h) => !transformedPositions.has(h));
    const selectedHandles = Array.from(transformedPositions.keys());
    const connectedHandles = this.page.handlesReachableFrom(selectedHandles);
    for (const [handle, transformedPosition] of transformedPositions) {
      if (snaps.some((s) => s.snapHandle === handle)) {
        snapPositions.set(handle, transformedPosition);
        continue;
      }
      const snapVectors = [];
      if (this.options.handleSnaps) {
        for (const snapHandle of snapHandles) {
          const v = Vec.sub(snapHandle.position, transformedPosition);
          if (Vec.len(v) < 10) {
            snapVectors.push(v);
            snaps.push(new HandleSnap(handle, snapHandle));
            break;
          }
        }
      }
      if (this.options.alignmentSnaps && snapVectors.length === 0) {
        for (const snapHandle of connectedHandles) {
          if (snapHandle === handle) {
            continue;
          }
          const dx = snapHandle.position.x - transformedPosition.x;
          if (Math.abs(dx) < 10) {
            const v = Vec(dx, 0);
            snapVectors.push(v);
            snaps.push(new AlignmentSnap(handle, snapHandle));
            break;
          }
        }
        for (const snapHandle of connectedHandles) {
          if (snapHandle === handle) {
            continue;
          }
          const dy = snapHandle.position.y - transformedPosition.y;
          if (Math.abs(dy) < 10) {
            const v = Vec(0, dy);
            snapVectors.push(v);
            snaps.push(new AlignmentSnap(handle, snapHandle));
            break;
          }
        }
      }
      const snappedPos = snapVectors.reduce((p, v) => Vec.add(p, v), transformedPosition);
      snapPositions.set(handle, snappedPos);
    }
    this.setActiveSnaps(snaps);
    return snapPositions;
  }
  setActiveSnaps(activeSnaps) {
    this.activeSnaps = activeSnaps;
    this.needsRerender = true;
    const activeSnapIds = new Set(activeSnaps.map((snap) => snap.id));
    for (const [id, svgElem] of this.snapSvgElementById) {
      if (!activeSnapIds.has(id)) {
        svgElem.remove();
        this.snapSvgElementById.delete(id);
      }
    }
  }
  clear() {
    this.setActiveSnaps([]);
  }
  render() {
    if (!this.needsRerender) {
      return;
    }
    for (const snap of this.activeSnaps) {
      const id = snap.id;
      const {shapeType, shapeData} = snap.getShape();
      let svgElem = this.snapSvgElementById.get(id);
      if (!svgElem) {
        svgElem = SVG.add(shapeType, {
          ...shapeData,
          fill: "none",
          stroke: "rgb(180, 134, 255)"
        });
        this.snapSvgElementById.set(id, svgElem);
      } else {
        SVG.update(svgElem, shapeData);
      }
    }
    this.needsRerender = false;
  }
}
class Snap {
  constructor(handle, snapHandle) {
    this.handle = handle;
    this.snapHandle = snapHandle;
    this.id = `${handle.id}.${snapHandle.id}.${this.constructor.name}`;
  }
}
class HandleSnap extends Snap {
  constructor(handle, snapHandle) {
    super(handle, snapHandle);
  }
  getShape() {
    return {
      shapeType: "circle",
      shapeData: {
        cx: this.handle.position.x,
        cy: this.handle.position.y,
        r: 7
      }
    };
  }
}
class AlignmentSnap extends Snap {
  constructor(handle, snapHandle) {
    super(handle, snapHandle);
  }
  getShape() {
    return {
      shapeType: "line",
      shapeData: {
        x1: this.handle.position.x,
        y1: this.handle.position.y,
        x2: this.snapHandle.position.x,
        y2: this.snapHandle.position.y
      }
    };
  }
}
