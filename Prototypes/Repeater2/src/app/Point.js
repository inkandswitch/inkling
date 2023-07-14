import Vec from "../lib/vec";

// Monotonically incrementing id counter
let nextId = 0;

export default class Point {
    constructor(pos) {
        this.id = nextId++;
        this.pos = pos || Vec();
    }

    render(ctx, highlight) {
        ctx.fillStyle = highlight ? '#F81ED5' : '#000000';
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}