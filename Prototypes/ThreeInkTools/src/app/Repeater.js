import Vec from "../lib/vec"
import LineStroke from "./LineStroke"
import Point from "./Point"

export default class Repeater {
    constructor(strokes){
        // normalize strokes
        this.root = strokes[0].a.pos
        this.default_translate = Vec.sub(strokes[strokes.length-1].b.pos, this.root)
        this.translate = this.default_translate
        this.rotate = 0

        this.baked_translate = Vec(0,0)
        this.baked_rotate = 0

        this.pattern = strokes.map(stroke=>{
            return {
                a: stroke.a.pos,
                b: stroke.b.pos
            }
        })

        this.first = strokes
        this.repetitions = 1
        this.repetiton_rotation = 1
        this.repetiton_rotation_acc = 0

        this.transform(Vec(0,0), 0)
 
    }

    transform(translate, rotate) {
        this.translate = Vec.add(this.baked_translate, Vec.add(this.default_translate, translate))
        this.rotate = this.baked_rotate + rotate
        this.update()
    }

    update(){
        this.copies = []
        this.repetitions = Math.round(this.repetiton_rotation)
        let offset_translate = this.translate
        let offset_rotate = this.rotate

        for (let i = 0; i < this.repetitions; i++) {
            let copy = {points: [], strokes: []}
            this.pattern.forEach(line=>{
                let a = new Point(Vec.add(line.a, offset_translate))
                copy.points.push(a)
                let b = new Point(Vec.add(line.b, offset_translate))
                copy.points.push(b)
                let stroke = new LineStroke(a, b)
                copy.strokes.push(stroke)
            })

            // Compute centroid
            let center = copy.strokes[0].a.pos
            // let center = Vec(0,0)
            // copy.points.forEach(pt=>{
            //     center = Vec.add(center, pt.pos)
            // })
            // center = Vec.divS(center, copy.points.length)

            //console.log("center", center);
            // Rotate point around center
            copy.points.forEach(pt=>{
                Vec.update(pt.pos, Vec.rotateAround(pt.pos, center, offset_rotate))
            })

            let old_offset = offset_translate
            
            offset_translate = Vec.add(offset_translate, this.translate)//Vec.sub(copy.strokes[copy.strokes.length-1].b.pos, this.root)
            offset_translate = Vec.rotateAround(offset_translate, old_offset, offset_rotate)
            
            offset_rotate += this.rotate
            this.copies.push(copy)
        }
    }

    bake(){
        this.baked_translate = this.translate
        this.baked_rotate = this.rotate
    }

    update_repetitions(delta){
        this.repetiton_rotation_acc = delta * 0.05
    }


    render(ctx) {
        // animate
        this.repetiton_rotation += this.repetiton_rotation_acc
        this.repetiton_rotation_acc *= 0.9
        if(this.repetitions  != Math.round(this.repetiton_rotation)) {
            this.update()
        }


        ctx.lineWidth = 1.0;

        this.copies.forEach((copy, i)=>{
            copy.strokes.forEach(stroke=>{
                stroke.render(ctx, i==0?'#F81ED5':"#000000")
            })
    
            copy.points.forEach(point=>{
                point.render(ctx, i==0?'#F81ED5':"#000000")
            })
        })

        //ctx.set
        ctx.fillStyle = "#00000044";
        ctx.save()
        
        ctx.translate(40, 40);
        ctx.rotate(this.repetiton_rotation)
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        let seg = (Math.PI*2) / 16
        for (let i = 0; i < 16; i++) {
            ctx.beginPath();
            ctx.ellipse(Math.sin(seg*i)*70, Math.cos(seg*i)*70, 5, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
        }
        
        ctx.restore()

        ctx.fillStyle = "#000000";
        ctx.font = "30px Arial";
        ctx.fillText(this.repetitions+1, 40, 60)
    }
}