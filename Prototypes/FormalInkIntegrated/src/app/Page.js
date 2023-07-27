import Vec from "../lib/vec"
import ArcSegment from "./strokes/ArcSegment"
import LineSegment from "./strokes/LineSegment"
import FreehandStroke from "./strokes/FreehandStroke"

import Point from "./strokes/Point"

export default class Page {
    constructor(svg){
        this.svg = svg
        this.points = []

        // TODO figure out a better model for how to store different kinds of strokes
        // For now just keep them separate, until we have a better idea of what freehand strokes look like
        this.linesegments = []
        this.freehandstrokes = []
    }

    addPoint(position){
        let p = new Point(this.svg, position)
        this.points.push(p)
        return p
    }

    addLineSegment(a, b){
        let l = new LineSegment(this.svg, a, b)
        this.linesegments.push(l)
        return l
    }

    addArcSegment(a, b, c) {
        let l = new ArcSegment(this.svg, a, b, c)
        this.linesegments.push(l)
        return l
    }

    addFreehandStroke(points) {
        let l = new FreehandStroke(this.svg, points)
        this.freehandstrokes.push(l)
        return l
    }

    findPointNear(position, dist = 20) {
        return this.points.find(point => Vec.dist(point.position, position) < dist);
    }

    render(svg) {
        this.linesegments.forEach(line=>{
            line.render(svg)
        })

        this.freehandstrokes.forEach(stroke=>{
            stroke.render(svg)
        })
        this.points.forEach(point=>{
            point.render(svg)
        })
    }
}