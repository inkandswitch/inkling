let ids = 0

const SIZE = 3

export default class Point {
    constructor(position){
        this.id = ids++
        this.position = position
        this.dirty = true
        this.selected = false
    }

    select() {
        this.dirty = true
        this.selected = true
    }

    render(svg) {
        if(this.dirty) {
            if(!this.element) {
                this.element = svg.addElement("circle", {
                    cx: this.position.x,
                    cy: this.position.y,
                    r: 3,
                    fill: this.selected ? "red" : "black"
                })
                this.dirty = false
            }

            svg.updateElement(this.element, {
                cx: this.position.x,
                cy: this.position.y,
            })
        }
        // ctx.fillStyle = '#000000';
        // ctx.beginPath();
        // ctx.ellipse(this.position.x, this.position.y, SIZE, SIZE, 0, 0, Math.PI * 2);
        // ctx.fill();
    }

    renderSelected(ctx) {
        // ctx.fillStyle = '#D2BBF9';
        // ctx.beginPath();
        // ctx.ellipse(this.position.x, this.position.y, SIZE+4, SIZE+4, 0, 0, Math.PI * 2);
        // ctx.fill();
    }
}