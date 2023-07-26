let ids = 0

const SIZE = 3

export default class Point {
    constructor(svg, position){
        this.id = ids++
        this.position = position
        this.dirty = true
        this.selected = false
        this.elements = {}


        this.elements.normal = svg.addElement("circle", { cx: 0, cy: 0, r: 3, fill: "black" })
        this.elements.selected = svg.addElement("circle", { cx: 0, cy: 0, r: 7, fill: "none" })

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
        if(this.dirty) {
            svg.updateElement(this.elements.normal, {
                transform: `translate(${this.position.x} ${this.position.y})`,
            })

            svg.updateElement(this.elements.selected, {
                transform: `translate(${this.position.x} ${this.position.y})`,
                fill: this.selected ? "rgba(180, 134, 255, 0.42)" : "none"
            })

            this.dirty = false
        }
    }

    renderSelected(ctx) {
        // ctx.fillStyle = '#D2BBF9';
        // ctx.beginPath();
        // ctx.ellipse(this.position.x, this.position.y, SIZE+4, SIZE+4, 0, 0, Math.PI * 2);
        // ctx.fill();
    }
}