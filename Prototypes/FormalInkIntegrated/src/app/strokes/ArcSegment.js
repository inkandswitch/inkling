import generateId from "../generateId"
import Vec from "../../lib/vec"

export default class ArcSegment {
    constructor(svg, a, b, c){
        this.id = generateId()
        this.a = a
        this.b = b
        this.c = c
        this.dirty = true
        this.selected = false
        this.elements = {}

        this.radius = Vec.dist(this.a.position, this.c.position)
        this.is_large_arc = 0 // more than 180
        this.clockwise = 1 // clockwise or counterclockwise
        this.x_axis_rotation = 0
        
        //          M   start_x              start_y            A   radius_x         radius_y            x-axis-rotation,         more-than-180,       clockwise   end_x                end_y
        this.path = `M ${this.a.position.x} ${this.a.position.y} A ${this.radius}  ${this.radius} ${this.x_axis_rotation} ${this.is_large_arc} ${this.clockwise} ${this.b.position.x} ${this.b.position.y}`

        this.elements.normal = svg.addElement("path", { d:this.path, "stroke-width": 1, stroke: "black", fill: "none" })
        this.elements.selected = svg.addElement("path", { d:this.path, "stroke-width": 7, stroke: "none", fill: "none" })
    }

    move(position) {
        this.dirty = true
        this.position = position
    }

    select() {
        this.dirty = true
        this.selected = true
    }

    deselect() {
        this.dirty = true
        this.selected = false
    }

    render(svg) {
        if(this.a.dirty || this.b.dirty || this.c.dirty) {
            this.radius = Vec.dist(this.a.position, this.c.position)
            this.is_large_arc = 0 // more than 180
            this.clockwise = 1 // clockwise or counterclockwise
            this.x_axis_rotation = 0

            this.path = `M ${this.a.position.x} ${this.a.position.y} A ${this.radius}  ${this.radius} ${this.x_axis_rotation} ${this.is_large_arc} ${this.clockwise} ${this.b.position.x} ${this.b.position.y}`
            svg.updateElement(this.elements.normal, {d: this.path})

            svg.updateElement(this.elements.selected, { d: this.path, stroke: this.selected ? "rgba(180, 134, 255, 0.42)" : "none" })

            this.dirty = false
        }
    }
}