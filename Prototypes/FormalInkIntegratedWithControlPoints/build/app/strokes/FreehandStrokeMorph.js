import Vec from "../../lib/vec.js";
import { generatePathFromPoints } from "../Svg.js";
import generateId from "../generateId.js";

export default class FreehandStrokeMorph {
    constructor(svg, points) {
        this.id = generateId();
        this.points = points;
        this.pointsMorphed = points;
        this.dirty = true;
        this.selected = false;

        const path = generatePathFromPoints(this.pointsMorphed);
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
            //             stroke: 'none',
            //         }
            //     ),
        };
    }

    applyMorphs(morphPoints) {
        this.pointsMorphed = this.points.map(pt => {
            
            // INTERPOLATION MORPHING 1
            // let dists = morphPoints.map(morph => {
            //     const d = Vec.dist(morph.firstPosition, pt);
            //     if (d < 30) {
            //         return 0;
            //     }
            //     return d - 30;
            // })

            // const totalDist = dists.reduce((acc, d) => acc + d, 0);
            // dists = dists.map(d => d / totalDist);

            // const vecs = morphPoints.map((morph, i) => {
            //     const multiplier = 1 - dists[i];
            //     return Vec.mulS(morph.morphVector, multiplier);
            // });
            
            // INTERPOLATION MORPHING 2
            let dists = morphPoints.map(morph => {
                const d = Vec.dist(morph.firstPosition, pt);
                return 1 / Math.pow(d, 2);
            });

            const totalDist = dists.reduce((acc, d) => acc + d, 0);
            dists = dists.map(d => d / totalDist);

            const vecs = morphPoints.map((morph, i) => {
                const multiplyer = dists[i];
                const translation = Vec.mulS(morph.morphVector, multiplyer);

                const rotated = Vec.rotateAround(pt, morph.firstPosition, morph.angle*multiplyer*multiplyer);
                const rotationDelta = Vec.sub(rotated, pt);


                return Vec.add(translation, rotationDelta);
            })

            // FALLOFF MORPHING
            // const vecs = morphPoints.map((morph, i) => {
            //     const dist = Vec.dist(morph.firstPosition, pt);

            //     let multiplier = 1;
            //     if (dist > 30) {
            //        multiplier = 0;
            //        const offset = dist - 30;
            //        // multiplier = 1 - offset * 0.01; // Linear falloff
            //        // multiplier = 1 / Math.pow((1 + 0.01 * offset), 2); // Non-linear falloff
            //         multiplier = 1 / (1 + Math.exp(0.1 * (offset - 50.0))); // Sigmoid falloff
            //         if (multiplier < 0) {
            //           multiplier = 0;
            //         }
            //     }
    
            //     return Vec.mulS(morph.morphVector, multiplier);
            // })


            const totalVec = vecs.reduce((acc, v) => Vec.add(acc, v), Vec(0, 0));
            return Vec.add(pt, totalVec);
        })
        this.dirty = true;
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
        if (!this.dirty) {
            return;
        }

        const path = generatePathFromPoints(this.pointsMorphed);
        svg.updateElement(this.elements.normal, { d: path });
        this.dirty = false;
    }
}