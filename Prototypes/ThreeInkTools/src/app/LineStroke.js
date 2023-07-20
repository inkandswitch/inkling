import config from "../config";
let size = config.filming_mode ? 3: 1

// Monotonically incrementing id counter
let nextId = 0;


export default class LineStroke {
    constructor(a, b) {
        this.id = nextId++;
        this.a = a;
        this.b = b;
    }

    render(ctx, color = '#000000') {
        ctx.lineWidth = size;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(this.a.pos.x, this.a.pos.y);
        ctx.lineTo(this.b.pos.x, this.b.pos.y);
        ctx.stroke();
    }
}