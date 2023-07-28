import Vec from "../lib/vec";
import ArcSegment from "./strokes/ArcSegment";
import LineSegment from "./strokes/LineSegment";
import FreehandStroke from "./strokes/FreehandStroke";

import Point from "./strokes/Point";

export default class Page {
    constructor(svg) {
        this.svg = svg;
        this.points = [];

        // TODO: figure out a better model for how to store different kinds of strokes
        // For now just keep them separate, until we have a better idea of what freehand strokes look like
        this.lineSegments = [];
        this.freehandStrokes = [];
    }

    addPoint(position) {
        const p = new Point(this.svg, position);
        this.points.push(p);
        return p;
    }

    addLineSegment(a, b) {
        const ls = new LineSegment(this.svg, a, b);
        this.lineSegments.push(ls);
        return ls;
    }

    addArcSegment(a, b, c) {
        const as = new ArcSegment(this.svg, a, b, c);
        this.lineSegments.push(as);
        return as;
    }

    addFreehandStroke(points) {
        const s = new FreehandStroke(this.svg, points);
        this.freehandStrokes.push(s)
        return s;
    }

    findPointNear(position, dist = 20) {
        return this.points.find(p => Vec.dist(p.position, position) < dist);
    }

    render(svg) {
        this.lineSegments.forEach(line => line.render(svg));

        this.freehandStrokes.forEach(stroke => stroke.render(svg));

        this.points.forEach(point => point.render(svg));
    }
}