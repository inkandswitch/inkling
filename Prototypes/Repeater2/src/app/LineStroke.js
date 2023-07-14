// Monotonically incrementing id counter
let nextId = 0;

export default class LineStroke {
    constructor(a, b) {
        this.id = nextId++;
        this.a = a;
        this.b = b;
    }

    render(ctx, highlight) {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = highlight ? '#F81ED5' : '#000000';
        ctx.beginPath();
        ctx.moveTo(this.a.pos.x, this.a.pos.y);
        ctx.lineTo(this.b.pos.x, this.b.pos.y);
        ctx.stroke();
    }
}