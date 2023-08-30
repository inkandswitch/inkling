import Page from "./Page"
import FreehandStroke from "./strokes/FreehandStroke"
import StrokeGroup from "./strokes/StrokeGroup"

export default class FreehandSelection {
    page: Page
    selectedStrokes: (StrokeGroup | null) = null;

    selections = [];
    selectionsByStroke = new Map<FreehandStroke, StrokeGroup>();

    constructor(page) {
        this.page = page
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');

        if (fingerDown) {
            let found = this.page.findFreehandStrokeNear(fingerDown.position)
            if(found) {
                this.fingerDownOnStroke(found)
            } else {
                this.fingerDownOnEmptySpace()
            }
        }
    }

    fingerDownOnStroke(stroke){
      this.select(stroke);
        
        // Find Existing Selections
        //console.log(this.selectedStrokes.size);
                        
        // if(this.selectedStrokes === null) {
        //     let foundSelection = this.selectionsByStroke.get(stroke);
            
        //     if(foundSelection) {
        //         for(const s of foundSelection) {
        //             this.select(s);
        //         }
        //     } else {
        //         this.select(stroke);
        //     }
        // } else {
        //     this.select(stroke);
        // }
    }

    fingerDownOnEmptySpace(){
        this.clearSelection();
    }

    render(svg){
      if(this.selectedStrokes) {
        this.selectedStrokes.render(svg)
      }
    }

    select(stroke){
        stroke.select();
        if(this.selectedStrokes === null) {
            this.selectedStrokes = new StrokeGroup();
        } 

        this.selectedStrokes.addStroke(stroke);

        this.page.addMesh(this.selectedStrokes);
    }

    clearSelection(){
      if(this.selectedStrokes === null) {
        return;
      }
      for(const stroke of this.selectedStrokes.strokes) {
        stroke.deselect();
      }

      this.selectedStrokes.remove();
      this.selectedStrokes = null;
    }
}