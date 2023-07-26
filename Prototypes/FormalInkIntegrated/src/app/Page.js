import Vec from "../lib/vec"
import LineSegment from "./LineSegment"

import Point from "./Point"

export default class Page {
    constructor(svg){
        this.svg = svg
        this.points = []
        this.linesegments = []
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

    findPointNear(position, dist = 20) {
        return this.points.find(point => Vec.dist(point.position, position) < dist);
    }

    render(svg) {
        this.linesegments.forEach(line=>{
            line.render(svg)
        })
        this.points.forEach(point=>{
            point.render(svg)
        })
    }
}