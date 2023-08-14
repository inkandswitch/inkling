import Polygon from "../lib/polygon"
import Vec from "../lib/vec"
import { generatePathFromPoints } from "./Svg"
import StrokeMorphing from "./strokes/StrokeMorphing"

export default class FreehandSelection {
    constructor(page) {
        this.page = page
        this.strokes = new Set()

        this.finger = null
        this.fingerMoved = null
        this.holding = null

        this.lastFingerDown = 0

        this.downPositions = new Map()

        this.selectPolygon = null;
        this.dirty = false;
        this.polygon = null;

        this.morphing = new StrokeMorphing();
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');
        if (fingerDown) {
            setTimeout(_=>{
                // If longpress
                if(this.finger && (!this.fingerMoved || Vec.dist(this.finger.position, this.fingerMoved.position) < 20)) {
                    console.log("longpress");

                    if(!this.holding) {
                        console.log("poly select");
                        this.selectPolygon = [this.finger.position];
                        this.dirty = true;
                    } else {
                        let group = this.morphing.addGroup(Array.from(this.strokes))
                        group.controlPoints.push(this.holding.getPointNear(this.finger.position));
                        console.log(group);
                        this.dirty = true;
                    }
                }
            }, 750)

            this.lastFingerDown = fingerDown.timestamp;
            this.finger = fingerDown
            let found = this.page.findFreehandStrokeNear(fingerDown.position)
            if(found) {
                // If we've already selected this stroke
                if(found == this.holding) {
                    let cluster = this.page.strokeGraph.getStrokeCluster(found);
                    cluster.forEach(l=>this.select(l));
                } else {
                    this.holding = found;
                    this.select(found);
                }
            } else {
                this.holding = null
                // Check if tapped inside enclosed region
                let loop = this.page.strokeGraph.loops.find(loop=>{
                    return Polygon.isPointInside(loop.points, fingerDown.position)
                })
                if(loop) {
                    loop.strokes.forEach(l=>this.select(l))
                    this.holding = loop.strokes[0]

                    // Find strokes inside polygon
                    for(const stroke of this.page.freehandStrokes) {
                        for(const point of stroke.points) {
                            if(Polygon.isPointInside(loop.points, point)) {
                                this.select(stroke);
                                continue;
                            }
                        }
                    }    
                }
            }
        }

        if(this.finger) {
            const fingerMove = events.did('finger', 'moved', this.finger.id)
            if(fingerMove) {
                this.fingerMoved = fingerMove

                if(this.selectPolygon) {
                    let lastPoint = this.selectPolygon[this.selectPolygon.length-1];
                    if(Vec.dist(lastPoint, fingerMove.position) > 5) {
                        this.selectPolygon.push(fingerMove.position);
                        this.dirty = true;

                        // update selection
                        this.clearSelection();
                        // Find strokes inside polygon
                        for(const stroke of this.page.freehandStrokes) {
                            for(const point of stroke.points) {
                                if(Polygon.isPointInside(this.selectPolygon, point)) {
                                    this.select(stroke);
                                    this.holding = stroke;
                                    continue;
                                }
                            }
                        }

                    }
                } else {
                    let delta = Vec.sub(fingerMove.position, this.finger.position)
                    for(const stroke of this.strokes) {
                        const downPositions = this.downPositions.get(stroke)
                        for (let i = 0; i < stroke.points.length; i++) {
                            stroke.points[i] = Vec.add(downPositions[i], delta);
                            stroke.dirty = true;
                        }
                    }
                }
            }

            const fingerUp = events.did('finger', 'ended', this.finger.id)
            if(fingerUp && !this.holding) {
                if(!this.fingerMoved) {
                    this.clearSelection();
                }

                this.dirty = true
            }

            if(fingerUp) {
                this.fingerMoved = null
                this.finger = null
                this.selectPolygon = null
                this.dirty = true
            }
        }
    }

    select(stroke){
        this.strokes.add(stroke);
        stroke.select();
        this.downPositions.set(stroke, stroke.points.map(p=>({...p})));
    }

    clearSelection(){
        for(const stroke of this.strokes) {
            stroke.deselect();
        }

        this.strokes = new Set();
        this.downPositions = new Map();
    }

    render(svg) {
        if(!this.dirty) {
            return;
        }

        if(!this.selectPolygon && this.polygon) {
            this.polygon.remove();
            this.polygon = null;
        } 
        
        if(this.selectPolygon){
            let path = generatePathFromPoints(this.selectPolygon);
            if(!this.polygon) {
                this.polygon = svg.addElement(
                    'path',
                    {
                        d: path,
                        stroke: 'pink',
                        'stroke-width': 2,
                        fill: 'rgba(255, 0, 0, 0.05)',
                    }
                )
            } else {
                svg.updateElement(
                    this.polygon, {d: path}
                )
            }
        }

        this.morphing.render(svg);

        

        this.dirty = false;
    }

}