import Vec from "../../lib/vec";
import FreehandStrokeMorph from "./FreehandStrokeMorph";


export default class MorphGroup {
    constructor(){
        this.strokes = []
        this.connectivity = [];
        this.elements = [];
        this.dirty = false;
    }

    addStroke(stroke){
        this.strokes.push(stroke);
        this.computeConnectivityGraph();
        this.dirty = true;
    }

    computeConnectivityGraph(){
        // Iterate over each pair of strokes and get connectivity
        this.connectivity = []
        for (let i = 0; i < this.strokes.length; i++) {
            const a = this.strokes[i];
            for (let j = i+1; j < this.strokes.length; j++) {
                const b = this.strokes[j];
                let pairs = findClosestPairOfPoints(a.points, b.points)
                if(pairs.dist < 20) {
                    this.connectivity.push({
                        a: i, b: j, indexA: pairs.a, indexB: pairs.b
                    })
                }
            }
        }
    }

    render(svg){
        if(!this.dirty) {
            return
        }

        // Clear elements
        this.elements.forEach(elem=>elem.remove());

        this.elements = this.connectivity.map(c=>{
            let start = this.strokes[c.a].points[c.indexA]
            let end = this.strokes[c.b].points[c.indexB]
            return svg.addElement("line", {x1: start.x, y1: start.y, x2: end.x, y2: end.y, stroke:'pink', 'stroke-width': '4'})
        })

        this.dirty = false;
    }
}


function findClosestPairOfPoints(strokeA, strokeB) {
    let minDist = Vec.dist(strokeA[0], strokeB[0]);
    let indexA = 0;
    let indexB = 0;

    for (let i = 0; i < strokeA.length; i++) {
        const a = strokeA[i];
        for (let j = 0; j < strokeB.length; j++) {
            const b = strokeB[j];
            let dist = Vec.dist(a, b);
            if(dist < minDist) {
                minDist = dist;
                indexA = i;
                indexB = j;
            }
        }
    }

    return {a: indexA, b: indexB, dist: minDist}
}