import Vec from "../lib/vec"

export default class Repeater {
    constructor(strokes){
        // normalize strokes
        this.root = strokes[0].a.pos
        this.default_translate = strokes[strokes.length-1].b.pos
        this.pattern = strokes.map(stroke=>{
            return {
                a: Vec.sub(stroke.a.pos, this.root),
                b: Vec.sub(stroke.b.pos, this.root)
            }
        })

        this.first = strokes
        this.mid = this.pattern.map(line=>{
            return {
                a: Vec.add(line.a, this.default_translate),
                b: Vec.add(line.b, this.default_translate)
            }
        })

        console.log(this.mid);
    }

    render(ctx) {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = '#AAAAAA';

        this.mid.forEach(line=>{
            ctx.beginPath();
            ctx.moveTo(line.a.x, line.a.y);
            ctx.lineTo(line.b.x, line.b.y);
            ctx.stroke();
        })
        
    }
}