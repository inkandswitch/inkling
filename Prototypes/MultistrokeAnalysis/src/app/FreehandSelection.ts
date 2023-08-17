import Page from "./Page"
import FreehandStroke from "./strokes/FreehandStroke"

export default class FreehandSelection {
    page: Page
    selectedStrokes = new Set<FreehandStroke>()

    selections = [];
    selectionsByStroke = new Map<FreehandStroke, Set<FreehandStroke>>();

    constructor(page) {
        this.page = page
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');

        if (fingerDown) {
            
            

            let found = this.page.findFreehandStrokeNear(fingerDown.position)
            if(found) {
                // Find Existing Selections
                console.log(this.selectedStrokes.size);
                
                if(this.selectedStrokes.size == 0) {
                    let foundSelection = this.selectionsByStroke.get(found);
                    console.log("found", foundSelection);
                    
                    if(foundSelection) {
                        for(const s of foundSelection) {
                            this.select(s);
                        }
                    } else {
                        this.select(found);
                    }
                } else {
                    this.select(found);
                }
            } else {
                this.clearSelection();
            }
        }
    }

    select(stroke){
        this.selectedStrokes.add(stroke);
        this.selectionsByStroke.set(stroke, this.selectedStrokes);
        stroke.select();
        //this.downPositions.set(stroke, stroke.points.map(p=>({...p})));
    }

    clearSelection(){
        for(const stroke of this.selectedStrokes) {
            stroke.deselect();
        }

        this.selectedStrokes = new Set();
        //this.downPositions = new Map();
    }
}