import Vec from "../lib/vec";


export default class Snaps {
    constructor(page){
        this.page = page
        this.activeSnaps = []

        // rendering
        this.snapSvgElements = new Map(); // "pointId.pointId -> snap"

        this.dirty = false;
    }

    computeSnapVectors(transformedPositions) {
        this.activeSnaps = [];
        let snapVectors = new Map();

        const snapPoints = this.page.points.filter(p => !transformedPositions.has(p));
        for (const [point, transformedPosition] of transformedPositions) {

            const snaps = [];

            // snap to point
            for (const snapPoint of snapPoints) {
                const v = Vec.sub(snapPoint.position, transformedPosition);
                if (Vec.len(v) < 10) {
                    snaps.push(v);
                    this.activeSnaps.push({type: "point", point, snapPoint })
                    break;
                }
            }

            if (snaps.length === 0) {
                // vertical alignment
                for (const snapPoint of snapPoints) {
                    const dx = snapPoint.position.x - transformedPosition.x;
                    if (Math.abs(dx) < 10) {
                        const v = Vec(dx, 0);
                        snaps.push(v);
                        this.activeSnaps.push({type: "align", point, snapPoint })
                        break;
                    }
                }

                // horizontal alignment
                for (const snapPoint of snapPoints) {
                    const dy = snapPoint.position.y - transformedPosition.y;
                    if (Math.abs(dy) < 10) {
                        const v = Vec(0, dy);
                        snaps.push(v);
                        this.activeSnaps.push({type: "align", point, snapPoint })
                        break;
                    }
                }
            }

            snapVectors.set(point, snaps);
        }

        this.dirty = true;
        return snapVectors
    }

    clear(){
        this.dirty = true;
        this.activeSnaps = [];
    }

    render(svg){
        if(!this.dirty) {
            return;
        }
        // Mark all as ready for deletion
        for(const [_, svgElem] of this.snapSvgElements) {
            console.log(svgElem);
            svgElem.delete = true
        }

        // Update state
        for(const snap of this.activeSnaps) {
            // generate id
            const id = snap.point.id+"."+snap.snapPoint.id+"."+snap.type
            
            let shape_type = "";
            let shape_data = {};
            if(snap.type == "point") {
                shape_type = "circle";
                shape_data = { cx: snap.point.position.x, cy: snap.point.position.y, r: 7 };
            } else if(snap.type == "align") {
                shape_type = "line";
                shape_data = {
                    x1: snap.point.position.x, y1: snap.point.position.y, 
                    x2: snap.snapPoint.position.x, y2: snap.snapPoint.position.y
                };
            }

            if(this.snapSvgElements.has(id)) {
                let svgElem = this.snapSvgElements.get(id)
                svgElem.delete = false
                svg.updateElement(svgElem.element, shape_data)
                
            } else {
                const element = svg.addElement(shape_type, { ...shape_data, fill: 'none', stroke: 'rgb(180, 134, 255)' 
                })
                this.snapSvgElements.set(id, {element, delete: false})
            }
        }

        // Delete all the elements that haven't been touched
        for(const [id, svgElem] of this.snapSvgElements) {
            if(svgElem.delete){
                svgElem.element.remove()
                this.snapSvgElements.delete(id)
            }
        }

        this.dirty = false;
    }
}