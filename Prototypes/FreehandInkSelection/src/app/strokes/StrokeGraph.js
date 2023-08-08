import Vec from "../../lib/vec";
import { generatePathFromPoints } from "../Svg";

export default class StrokeGraph {
    constructor (){
        this.strokes = [];
        this.connections = [];
        this.loops = [];
        this.elements = [];
        this.loop_elements = [];
    }

    addStroke(stroke){
        let endPoints = [stroke.getFirstPoint(), stroke.getLastPoint()];

        // Find connections with other strokes
        for(const otherStroke of this.strokes) {
            for(const pt of endPoints) {
                const closestPoint = findClosestPointTo(pt, otherStroke.points);
                if(closestPoint.dist < 20) {
                    this.connections.push({type: "point", position: pt, a: stroke, b: otherStroke, ...closestPoint});
                }
            }

            // Inverse
            let otherEndPoints = [otherStroke.getFirstPoint(), otherStroke.getLastPoint()];
            for(const pt of otherEndPoints) {
                const closestPoint = findClosestPointTo(pt, stroke.points);
                if(closestPoint.dist < 20) {
                    this.connections.push({type: "point", position: pt, a: otherStroke, b: stroke, ...closestPoint});
                }
            }
        }



        // Do a breadth first search to find loops

        console.log("-- search");
        const queue = [stroke];

        const visited = new Set();
        visited.add(stroke);

        const backtrack = new Map();

        let found = null
        let otherDirection = null;

        outerloop: while(queue.length > 0) {
            let currentStroke = queue.shift();

            // Find connected strokes
            let connectedStrokes = this.connections.filter(c=>{
                return c.a === currentStroke && backtrack.get(currentStroke) !== c.b;
            }).map(c=>c.b);
    
            for(const otherStroke of connectedStrokes) {
                if(visited.has(otherStroke)) {
                    console.log("found loop by meeting in the middle");
                    found = otherStroke;
                    otherDirection = currentStroke;
                    break outerloop;
                }
                visited.add(otherStroke);
                backtrack.set(otherStroke, currentStroke);
                queue.push(otherStroke);
            }
        }
        
        if(found !== null) {
            let currentStroke = found
            let trace = [found]
            while(currentStroke != stroke) {
                currentStroke = backtrack.get(currentStroke)
                trace.push(currentStroke)
            }

            currentStroke = otherDirection
            trace.unshift(otherDirection)
            while(currentStroke != stroke) {
                currentStroke = backtrack.get(currentStroke)
                trace.unshift(currentStroke)
            }

            //trace.pop();

            let loop = [];
            for (let i = 0; i < trace.length-1; i++) {
                const a = trace[i];
                const b = trace[i+1];
                const connection = this.connections.find(c=>c.a == a && c.b == b);
                loop.push(connection.position);
            }

            this.loops.push({
                strokes: trace,
                points: loop
            });
        }



        this.strokes.push(stroke);
        this.dirty = true;
    }

    render(svg) {
        if(!this.dirty) {
            return
        }

        // this.elements.forEach(elem=>elem.remove());

        // this.elements = this.connections.map(c=>{
        //     // let start = this.strokes[c.a].points[c.indexA]
        //     // let end = this.strokes[c.b].points[c.indexB]
        //     return svg.addElement('circle', { cx: c.position.x, cy: c.position.y, r: 3, fill: 'pink' })
        // })

        // this.loop_elements.forEach(elem=>elem.remove());
        // this.loop_elements = this.loops.map(loop=>{
        //     return svg.addElement('path', {d: generatePathFromPoints(loop), fill: 'rgba(255, 0, 0, 0.1)'})
        // })
        

        this.dirty = false;
    }

}

function findClosestPointTo(point, stroke) {
    let minDist = Vec.dist(point, stroke[0]);
    let index = 0;

    for (let i = 0; i < stroke.length; i++) {
        let dist = Vec.dist(point, stroke[i]);
        if(dist < minDist) {
            minDist = dist;
            index = i;
        }
    }

    return {dist: minDist, index}
}