import Vec from "../lib/vec";

// Monotonically incrementing id counter
let nextId = 0;

export default class ArcStroke {
    constructor(a, b, c) {
        this.id = nextId++;
        this.a = a
        this.b = b
        this.c = c
    }

    render(ctx) {
        ctx.lineWidth = 1
        ctx.strokeStyle = "#000000"

        let startAngle = Vec.angle(Vec.sub(this.a.pos, this.c.pos))
        let endAngle = Vec.angle(Vec.sub(this.b.pos, this.c.pos))
        let radius = Vec.dist(this.a.pos, this.c.pos)
        
        ctx.beginPath();
        ctx.ellipse(this.c.pos.x, this.c.pos.y, radius, radius, 0, startAngle, endAngle);
        ctx.stroke();
    }
}