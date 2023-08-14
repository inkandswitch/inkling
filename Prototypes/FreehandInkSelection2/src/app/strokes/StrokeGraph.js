import Vec from "../../lib/vec";
import { generatePathFromPoints } from "../Svg";

export default class StrokeGraph {
    constructor (){
        this.strokes = [];
        this.connections = [];
        this.elements = [];

        this.clusters = [];

        this.loops = [];
        this.loop_elements = [];
    }

    generateClusters(){
        // Do a depth first search to generate all connected clusters
        // TODO: Make this less terrible
        let clusters = [];
        let visitList = this.strokes.map(s=>s);

        while(visitList.length > 0) {
            let currentStroke = visitList.pop();
            let cluster = [currentStroke];
            let queue = [currentStroke];

            while(queue.length > 0) {
                let nextInQueue = queue.pop();
                // find connected elements
                let connected = this.connections
                    .filter(c=>c.strokes.indexOf(nextInQueue) > - 1)
                    .map(c=>c.strokes.filter(s=>s!=nextInQueue)[0])

                for(const c of connected) {
                    if(!cluster.find(s=>s==c)) {
                        cluster.push(c);
                        visitList = visitList.filter(s=>s!=c);
                        queue.push(c);
                    }
                }
            }

            clusters.push(cluster);
            
        }
        this.clusters = clusters;

    }

    getStrokeCluster(stroke) {
        return this.clusters.find(cluster=>{
            return cluster.find(s=>s==stroke)
        })
    }

    addStroke(stroke){
        // Match closest strokes
        for(const otherStroke of this.strokes) {
            const closestPoint = closestPointsBetweenStrokes(stroke.points, otherStroke.points);
            console.log(closestPoint);
            if(closestPoint.dist < 20) {
                const midPoint = Vec.mulS(Vec.add(stroke.points[closestPoint.indexA], otherStroke.points[closestPoint.indexB]), 0.5);
                // Categorize node
                let dirA = getDirectionAtStrokePoint(stroke.points, closestPoint.indexA);
                let dirB = getDirectionAtStrokePoint(otherStroke.points, closestPoint.indexB);
                // similarity between strokes as determined by cross product;
                let aligned = Math.abs(Vec.cross(dirA, dirB)) < 0.3;
                //console.log("similarity", similarity);

                this.connections.push({position: midPoint, strokes: [stroke, otherStroke], indexes: [closestPoint.indexA, closestPoint.indexB], aligned});
            }
        }

        console.log(this.connections);

        // EndPoint Matches
        // let endPoints = [stroke.getFirstPoint(), stroke.getLastPoint()];

        // // Find connections with other strokes
        // for(const otherStroke of this.strokes) {
        //     for(const pt of endPoints) {
        //         const closestPoint = findClosestPointTo(pt, otherStroke.points);
        //         if(closestPoint.dist < 20) {
        //             this.connections.push({type: "point", position: pt, a: stroke, b: otherStroke, ...closestPoint});
        //         }
        //     }

        //     // Inverse
        //     let otherEndPoints = [otherStroke.getFirstPoint(), otherStroke.getLastPoint()];
        //     for(const pt of otherEndPoints) {
        //         const closestPoint = findClosestPointTo(pt, stroke.points);
        //         if(closestPoint.dist < 20) {
        //             this.connections.push({type: "point", position: pt, a: otherStroke, b: stroke, ...closestPoint});
        //         }
        //     }
        // }


        // FIND LOOPS (BREADTH FIRST)
        // TODO: Do search based on perceptual continuation properties
        // console.log("-- search");
        // const queue = [stroke];

        // const visited = new Set();
        // visited.add(stroke);

        // const backtrack = new Map();

        // let found = null
        // let otherDirection = null;

        // outerloop: while(queue.length > 0) {
        //     let currentStroke = queue.shift();

        //     // Find connected strokes
        //     let connectedStrokes = this.connections.filter(c=>{
        //         return c.a === currentStroke && backtrack.get(currentStroke) !== c.b;
        //     }).map(c=>c.b);
    
        //     for(const otherStroke of connectedStrokes) {
        //         if(visited.has(otherStroke)) {
        //             console.log("found loop by meeting in the middle");
        //             found = otherStroke;
        //             otherDirection = currentStroke;
        //             break outerloop;
        //         }
        //         visited.add(otherStroke);
        //         backtrack.set(otherStroke, currentStroke);
        //         queue.push(otherStroke);
        //     }
        // }
        
        // if(found !== null) {
        //     let currentStroke = found
        //     let trace = [found]
        //     while(currentStroke != stroke) {
        //         currentStroke = backtrack.get(currentStroke)
        //         trace.push(currentStroke)
        //     }

        //     currentStroke = otherDirection
        //     trace.unshift(otherDirection)
        //     while(currentStroke != stroke) {
        //         currentStroke = backtrack.get(currentStroke)
        //         trace.unshift(currentStroke)
        //     }

        //     //trace.pop();

        //     let loop = [];
        //     for (let i = 0; i < trace.length-1; i++) {
        //         const a = trace[i];
        //         const b = trace[i+1];
        //         const connection = this.connections.find(c=>c.a == a && c.b == b);
        //         loop.push(connection.position);
        //     }

        //     this.loops.push({
        //         strokes: trace,
        //         points: loop
        //     });
        // }



        this.strokes.push(stroke);
        this.dirty = true;

        this.generateClusters();
    }

    render(svg) {
        if(!this.dirty) {
            return
        }

        // this.elements.forEach(elem=>elem.remove());

        // this.elements = this.connections.map(c=>{
        //     return svg.addElement('circle', { cx: c.position.x, cy: c.position.y, r: 3, fill: c.aligned ? 'pink': 'green' })
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

function closestPointsBetweenStrokes(strokeA, strokeB) {
    let minDist = Vec.dist(strokeA[0], strokeB[0]);
    let indexA = 0;
    let indexB = 0;

    for (let i = 0; i < strokeA.length; i++) {
        for (let j = 0; j < strokeB.length; j++) {
            const dist = Vec.dist(strokeA[i], strokeB[j]);
            if(dist < minDist) {
                minDist = dist;
                indexA = i;
                indexB = j;
            }
        }
    }

    return {dist: minDist, indexA, indexB}
}

function getDirectionAtStrokePoint(stroke, index){
    console.log(stroke, index);
    let backwardIndex = index - 10;
    if(backwardIndex < 0) {
        backwardIndex = 0;
    }

    let forwardIndex = index + 10;
    if(forwardIndex > stroke.length-1) {
        forwardIndex = stroke.length-1;
    }

    return Vec.normalize(Vec.sub(stroke[backwardIndex], stroke[forwardIndex]));
}