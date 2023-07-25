import Vec from "../lib/vec"

import Point from "./Point"

export default class Page {
    constructor(){
        this.points = []
    }

    addPoint(position){
        this.points.push(new Point(position))
    }

    findPointNear(position, dist = 20) {
        return this.points.find(point => Vec.dist(point.position, position) < dist);
    }

    render(svg) {
        this.points.forEach(point=>{
            point.render(svg)
        })
    }
}