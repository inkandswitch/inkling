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
        let closestPoint = null
        let closestDistance = dist

        for(const point of this.points) {
            let d = Vec.dist(point.position, position)
            if(d < closestDistance) {
                closestDistance = d
                closestPoint = point
            }
        }
        
        return closestPoint
    }

    mergePoint(point) {
        let mergable = this.points.filter(p => {
            return p != point && Vec.dist(p.position, point.position) == 0
        })
        let mergableIds = mergable.map(p=>p.id)

        console.log(point, mergable);

        this.lineSegments.forEach(ls=>{
            if(mergableIds.indexOf(ls.a.id) > -1) {
                ls.a = point
            }
            if(mergableIds.indexOf(ls.b.id) > -1) {
                ls.b = point
            }
            if(ls.c && mergableIds.indexOf(ls.c.id) > -1) {
                ls.c = point
            }
        })

        mergable.forEach(other=>{
            other.remove()
            this.points = this.points.filter(p=>p!=other)
        })
    }

    render(svg) {
        this.lineSegments.forEach(line => line.render(svg));

        this.freehandStrokes.forEach(stroke => stroke.render(svg));

        this.points.forEach(point => point.render(svg));
    }
}