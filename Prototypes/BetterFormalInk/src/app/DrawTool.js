import Line from "../lib/line";
import Vec from "../lib/vec";

export default class DrawTool {
    constructor(page){
        this.page = page
        this.a = null;
        this.b = null;
    }

    pen_down(pos){
        this.a = pos
        this.b = Vec.clone(pos)
    }

    pen_move(pos) {
        this.b = pos
    }

    pen_up(pos) {
        let line = Line(this.a, this.b)

        this.page.add_line(line)

        this.a = null
        this.b = null
    }

    render(ctx){
        if(!this.a) return

        ctx.lineWidth = 1.0;
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(this.a.x, this.a.y);
        ctx.lineTo(this.b.x, this.b.y);
        ctx.stroke();
    }
}