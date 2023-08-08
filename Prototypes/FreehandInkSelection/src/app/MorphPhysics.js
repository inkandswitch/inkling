import Vec from '../lib/vec'

export default class MorphPhysics {
    constructor(svg){
        this.points = [
            Vec(100,400),
            Vec(200,300),
            Vec(300,400),
            Vec(400,400),
            Vec(500,400),
        ];

        let idealAngles = [
            0, 0, 0, 0, 0
        ]

        this.elements = this.points.map(pt=>{
            return svg.addElement('circle', { cx: pt.x, cy: pt.y, r: 3, fill: 'black' });
        });
    }

    update(events) {
        let fingerMove = events.did('finger', 'moved');
        if(fingerMove) {
            this.points[4] = fingerMove.position;
        }

        for (let i = 1; i < this.points.length; i++) {
            let a = this.points[i]
            let b = this.points[i-1]
            let refAngle = 0
            if(i > 1) {
                let c = this.points[i-2]
                refAngle = Vec.angle(Vec.sub(b, c))
            }

            let currentAngleA = Vec.angle(Vec.sub(a, b))
            
            let delta = (refAngle - currentAngleA)*0.1
            this.points[i] = Vec.rotateAround(a, b, delta);
        }


    }

    render(svg){
        this.elements.forEach((elem, i)=>{
            let pt = this.points[i];
            svg.updateElement(elem, { cx: pt.x, cy: pt.y});
        });
    }
}