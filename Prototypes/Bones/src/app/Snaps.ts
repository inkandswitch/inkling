import { Position } from "../lib/types";
import Vec from "../lib/vec";
import Page from "./Page";
import SVG, { updateSvgElement } from "./Svg";
import Point from "./strokes/Point";

export default class Snaps {
  activeSnaps: Snap[] = [];

  // rendering
  snapSvgElementById = new Map<string, SVGElement>();
  dirty = false;

  constructor(private page: Page) {}

  // returns Map<Point, snap position>
  snapPositions(transformedPositions: Map<Point, Position>) {
    const snaps: Snap[] = [];
    const snapPositions = new Map<Point, Position>();
    const snapPoints = this.page.points.filter((p) => !transformedPositions.has(p));
    const selectedPoints = Array.from(transformedPositions.keys());
    return snapPositions;
  }

  setActiveSnaps(activeSnaps: Snap[]) {
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

type Shape = CircleShape | LineShape;

interface CircleShape {
  shapeType: "circle";
  shapeData: {
    cx: number;
    cy: number;
    r: number;
  };
}

interface LineShape {
  shapeType: "line";
  shapeData: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

class Snap {
  id: string;

  constructor(public point: Point, public snapPoint: Point) {
    this.id = `${point.id}.${snapPoint.id}.${this.constructor.name}`;
  }

  getShape(): Shape {
    throw new Error("subclass responsibility!");
  }
}

class PointSnap extends Snap {
  constructor(point: Point, snapPoint: Point) {
    super(point, snapPoint);
  }

  getShape(): CircleShape {
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
  constructor(point: Point, snapPoint: Point) {
    super(point, snapPoint);
  }

  getShape(): LineShape {
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
