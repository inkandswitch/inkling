import Vec from "../lib/vec";
import config from "../config";

// Monotonically incrementing id counter
let nextId = 0;
let size = config.filming_mode ? 4: 3

export default class Point {
    constructor(pos) {
        this.id = nextId++;
        this.pos = pos || Vec();
    }

    render(ctx, color = '#000000') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y, size, size, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}