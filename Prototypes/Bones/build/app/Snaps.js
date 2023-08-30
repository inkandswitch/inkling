import {updateSvgElement} from "./Svg.js";
export default class Snaps {
  constructor(page) {
    this.page = page;
    this.activeSnaps = [];
    this.snapSvgElementById = new Map();
    this.dirty = false;
  }
  snapPositions(transformedPositions) {
    const snaps = [];
    const snapPositions = new Map();
    const snapPoints = this.page.points.filter((p) => !transformedPositions.has(p));
    const selectedPoints = Array.from(transformedPositions.keys());
    return snapPositions;
  }
  setActiveSnaps(activeSnaps) {
    this.activeSnaps = activeSnaps;
    this.dirty = true;
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
  render(svg) {
    if (!this.dirty) {
      return;
    }
    for (const snap of this.activeSnaps) {
      const id = snap.id;
      const {shapeType, shapeData} = snap.getShape();
      let svgElem = this.snapSvgElementById.get(id);
      if (svgElem == null) {
        svgElem = svg.addElement(shapeType, {
          ...shapeData,
          fill: "none",
          stroke: "rgb(180, 134, 255)"
        });
        this.snapSvgElementById.set(id, svgElem);
      } else {
        updateSvgElement(svgElem, shapeData);
      }
    }
    this.dirty = false;
  }
}
class Snap {
  constructor(point, snapPoint) {
    this.point = point;
    this.snapPoint = snapPoint;
    this.id = `${point.id}.${snapPoint.id}.${this.constructor.name}`;
  }
  getShape() {
    throw new Error("subclass responsibility!");
  }
}
class PointSnap extends Snap {
  constructor(point, snapPoint) {
    super(point, snapPoint);
  }
  getShape() {
    return {
      shapeType: "circle",
      shapeData: {
        cx: this.point.position.x,
        cy: this.point.position.y,
        r: 7
      }
    };
  }
}
class AlignmentSnap extends Snap {
  constructor(point, snapPoint) {
    super(point, snapPoint);
  }
  getShape() {
    return {
      shapeType: "line",
      shapeData: {
        x1: this.point.position.x,
        y1: this.point.position.y,
        x2: this.snapPoint.position.x,
        y2: this.snapPoint.position.y
      }
    };
  }
}
