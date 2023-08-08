import Vec from "../lib/vec";
import ArcSegment from "./strokes/ArcSegment";
import LineSegment from "./strokes/LineSegment";
import FreehandStroke from "./strokes/FreehandStroke";

import Point from "./strokes/Point";
import MorphPoint from "./strokes/MorphPoint";
import StrokeGraph from "./strokes/StrokeGraph";

export default class Page {
    constructor(svg) {
        this.svg = svg;
        this.points = [];
        this.morphPoints = [];

        // TODO: figure out a better model for how to store different kinds of strokes
        // For now just keep them separate, until we have a better idea of what freehand strokes look like
        this.lineSegments = [];
        this.freehandStrokes = [];

        this.strokeGraph = new StrokeGraph();
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

    addMorphPoint(position) {
        const p = new MorphPoint(this.svg, position);
        this.morphPoints.push(p);
        return p;
    }

    addFreehandStroke(points) {
        const s = new FreehandStroke(this.svg, points);
        this.freehandStrokes.push(s)
        this.strokeGraph.addStroke(s);
        return s;
    }

    findPointNear(position, dist = 20) {
        let closestPoint = null;
        let closestDistance = dist;

        for (const point of this.points) {
            const d = Vec.dist(point.position, position);
            if (d < closestDistance) {
                closestDistance = d;
                closestPoint = point;
            }
        }
        
        return closestPoint;
    }

    findMorphPointNear(position, dist = 20) {
        let closestPoint = null;
        let closestDistance = dist;

        for (const point of this.morphPoints) {
            const d = Vec.dist(point.position, position);
            if (d < closestDistance) {
                closestDistance = d;
                closestPoint = point;
            }
        }
        
        return closestPoint;
    }

    findFreehandStrokeNear(position, dist = 20) {
        let closestStroke = null;
        let closestDistance = dist;
        for(const stroke of this.freehandStrokes) {
            for(const point of stroke.points) {
                const d = Vec.dist(point, position);
                if (d < closestDistance) {
                    closestDistance = d;
                    closestStroke = stroke;
                }
            }
        }

        return closestStroke
    }

    mergePoint(point) {
        const pointsToMerge =
            new Set(
                this.points.filter(
                    p => p !== point && Vec.dist(p.position, point.position) === 0
                )
            );

        if (pointsToMerge.size === 0) {
            return; // avoid iterating over lines
        }

        for (const ls of this.lineSegments) {
            if (pointsToMerge.has(ls.a)) {
                ls.a = point;
            }
            if (pointsToMerge.has(ls.b)) {
                ls.b = point;
            }
            if (pointsToMerge.has(ls.c)) {
                ls.c = point;
            }
        }

        for (const mergedPoint of pointsToMerge) {
            mergedPoint.remove();
        }
        this.points = this.points.filter(p => !pointsToMerge.has(p));
    }

    pointsReachableFrom(startPoints) {
        const reachablePoints = new Set(startPoints);
        while (true) {
            const oldSize = reachablePoints.size;
            for (const ls of this.lineSegments) {
                if (reachablePoints.has(ls.a)) {
                    reachablePoints.add(ls.b);
                }
                if (reachablePoints.has(ls.b)) {
                    reachablePoints.add(ls.a);
                }
            }
            if (reachablePoints.size === oldSize) {
                break;
            }
        }
        return reachablePoints;
    }

    updateMorphs(){
        //update rotations
        if(this.morphPoints.length < 2) return 
        for (let i = 0; i < this.morphPoints.length; i++) {
            const point = this.morphPoints[i];

            let delta = 0;
            let factor = 0;
            if(i < this.morphPoints.length-1) {
                let oldAngle = Vec.angle(Vec.sub(this.morphPoints[i+1].firstPosition, this.morphPoints[i].firstPosition))
                let newAngle = Vec.angle(Vec.sub(this.morphPoints[i+1].position, this.morphPoints[i].position))
                delta += newAngle - oldAngle;
                factor +=1;
            }

            if(i > 0) {
                let oldAngle = Vec.angle(Vec.sub(this.morphPoints[i-1].firstPosition, this.morphPoints[i].firstPosition))
                let newAngle = Vec.angle(Vec.sub(this.morphPoints[i-1].position, this.morphPoints[i].position))
                delta += newAngle - oldAngle
                factor +=1;
            }

            if(factor == 2) {
                delta = delta / 2
            }

            this.morphPoints[i].angle = delta
            this.morphPoints[i].dirty = true
        }

        this.freehandStrokes.forEach(stroke => stroke.applyMorphs(this.morphPoints));
    }

    render(svg) {
        const renderIt = it => it.render(svg);
        this.lineSegments.forEach(renderIt);
        this.freehandStrokes.forEach(renderIt);
        this.points.forEach(renderIt);
        this.morphPoints.forEach(renderIt);
        this.strokeGraph.render(svg);
    }
}