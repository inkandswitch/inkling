import Vec from "../lib/vec";
import SVG, { updateSvgElement } from "./Svg";

export default class Snaps {
  activeSnaps: any[] = [];

  // rendering
  snapSvgElementById = new Map<any, any>();
  dirty = false;

  constructor(private page) {}

  // returns Map<Point, snap position>
  snapPositions(transformedPositions) {
    const snaps: any[] = [];
    const snapPositions = new Map();
    const snapPoints = this.page.points.filter((p) => !transformedPositions.has(p));
    const selectedPoints = Array.from(transformedPositions.keys());
    const connectedPoints = this.page.pointsReachableFrom(selectedPoints);

    for (const [point, transformedPosition] of transformedPositions) {
      if (snaps.some((s) => s.snapPoint === point)) {
        // This point is already being used as a snap.
        // If we move it (by snapping it to another point), the UI feels shaky.
        snapPositions.set(point, transformedPosition);
        continue;
      }

      const snapVectors: any[] = [];

      // snap to point
      for (const snapPoint of snapPoints) {
        const v = Vec.sub(snapPoint.position, transformedPosition);
        if (Vec.len(v) < 10) {
          snapVectors.push(v);
          snaps.push(new PointSnap(point, snapPoint));
          break;
        }
      }

      if (snapVectors.length === 0) {
        // vertical alignment
        for (const snapPoint of connectedPoints) {
          if (snapPoint === point) {
            continue;
          }
          const dx = snapPoint.position.x - transformedPosition.x;
          if (Math.abs(dx) < 10) {
            const v = Vec(dx, 0);
            snapVectors.push(v);
            snaps.push(new AlignmentSnap(point, snapPoint));
            break;
          }
        }

        // horizontal alignment
        for (const snapPoint of connectedPoints) {
          if (snapPoint === point) {
            continue;
          }
          const dy = snapPoint.position.y - transformedPosition.y;
          if (Math.abs(dy) < 10) {
            const v = Vec(0, dy);
            snapVectors.push(v);
            snaps.push(new AlignmentSnap(point, snapPoint));
            break;
          }
        }
      }

      const snappedPos = snapVectors.reduce((p, v) => Vec.add(p, v), transformedPosition);

      snapPositions.set(point, snappedPos);
    }

    this.setActiveSnaps(snaps);

    return snapPositions;
  }

  setActiveSnaps(activeSnaps) {
    this.activeSnaps = activeSnaps;
    this.dirty = true;

    // Delete the svg elements associated w/ snaps that went away
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

  render(svg: SVG) {
    if (!this.dirty) {
      return;
    }

    for (const snap of this.activeSnaps) {
      const id = snap.id;
      const { shapeType, shapeData } = snap.getShape();

      let svgElem = this.snapSvgElementById.get(id);
      if (svgElem == null) {
        svgElem = svg.addElement(shapeType, {
          ...shapeData,
          fill: "none",
          stroke: "rgb(180, 134, 255)",
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
  id: string;

  constructor(protected point, protected snapPoint) {
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
        r: 7,
      },
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
        y2: this.snapPoint.position.y,
      },
    };
  }
}
