import Vec from "../../lib/vec";
import { generatePathFromPoints } from "../Svg";
import generateId from "../generateId";

export default class FreehandStrokeMorph {
    constructor(svg, points) {
        this.id = generateId();
        this.points = points;
        this.points_morphed = points;
        this.dirty = true;
        this.selected = false;

        const path = generatePathFromPoints(this.points_morphed);
        this.elements = {
            normal:
                svg.addElement(
                    'path',
                    {
                        d: path,
                        stroke: 'darkgrey',
                        'stroke-width': 2,
                        fill: 'none',
                    }
                ),
            // selected:
            //     svg.addElement(
            //         'line',
            //         {
            //             x1: this.a.position.x,
            //             y1: this.a.position.y,
            //             x2: this.b.position.x,
            //             y2: this.b.position.y,
            //             'stroke-width': 7,
            //             stroke: 'none'
            //         }
            //     )
        };
    }

    applyMorphs(morphPoints) {
        this.points_morphed = this.points.map(pt=>{
            
            // INTERPOLATION MORPHING 1
            // let dists = morphPoints.map(morph=>{
            //     let d = Vec.dist(morph.firstPosition, pt);
            //     if(d < 30) {
            //         return 0
            //     }
            //     return d - 30
            // })

            // let total_dist = dists.reduce((acc, d)=>acc+d, 0)
            // dists = dists.map(d=>d/total_dist)

            // let vecs = morphPoints.map((morph, i)=>{
            //     let multiplyer = 1 - dists[i]
            //     return Vec.mulS(morph.morphVector, multiplyer);
            // })
            
            // INTERPOLATION MORPHING 2
            let dists = morphPoints.map(morph=>{
                let d = Vec.dist(morph.firstPosition, pt);
                return 1/Math.pow(d, 2)
            })

            let total_dist = dists.reduce((acc, d)=>acc+d, 0)
            dists = dists.map(d=>d/total_dist)

            let vecs = morphPoints.map((morph, i)=>{
                let multiplyer = dists[i]
                let translation = Vec.mulS(morph.morphVector, multiplyer);

                let rotated = Vec.rotateAround(pt, morph.firstPosition, morph.angle*multiplyer*multiplyer);
                let rotationDelta = Vec.sub(rotated, pt)


                return Vec.add(translation, rotationDelta)
            })

            // FALLOFF MORPHING
            // let vecs = morphPoints.map((morph, i)=>{
            //     let dist = Vec.dist(morph.firstPosition, pt);

            //     let multiplyer = 1;
            //     if(dist > 30) {
            //         multiplyer = 0
            //        let offset = (dist-30);
            //     //    multiplyer = 1 - offset*0.01 // Linear falloff
            //       //  multiplyer = 1 / Math.pow((1 + 0.01*offset), 2) // Non-linear falloff
            //         multiplyer = 1 / (1 + Math.exp(0.1 * (offset - 50.0))); // Sigmoid falloff
            //         if(multiplyer < 0) multiplyer = 0
            //     }
    
            //     return Vec.mulS(morph.morphVector, multiplyer);
            // })


            let totalVec = vecs.reduce((acc, v)=>Vec.add(acc, v), Vec(0,0));
            return Vec.add(pt, totalVec);
        })
        this.dirty = true
    }

    move(position) {
        this.dirty = true;
        this.position = position;
    }

    select() {
        this.dirty = true;
        this.selected = true;
    }

    deselect() {
        this.dirty = true;
        this.selected = false;
    }

    render(svg) {
        if (this.dirty) {
            const path = generatePathFromPoints(this.points_morphed);
            svg.updateElement( this.elements.normal, {d: path} );
            this.dirty = false;
        }
    }
}