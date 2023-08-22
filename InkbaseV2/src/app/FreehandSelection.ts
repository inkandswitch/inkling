// NOTE THIS IS VERY WORK IN PROGRESS
// DON'T WASTE YOUR TIME "FIXING" THIS

import Events from "./NativeEvents";
import Page from "./Page"
import { SortedSet } from "./StrokeClusters";
import FreehandStroke from "./strokes/FreehandStroke"
import StrokeGroup from "./strokes/StrokeGroup"

export default class FreehandSelection {
    page: Page
    selectedStrokes = new Set<FreehandStroke>();
    clusterSelectionIndex = 0;

    constructor(page: Page) {
        this.page = page
    }

    update(events: Events) {
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

    fingerDownOnStroke(stroke: FreehandStroke){
      if(this.selectedStrokes.has(stroke)) {
        let clusters = this.page.clusters.getClustersForStroke(stroke);
        
        if(clusters== undefined) return        

        this.clusterSelectionIndex++;
        let cluster = clusters.get(this.clusterSelectionIndex % (clusters.size()))


        this.clearSelection()
        for(const stroke of cluster) {
          this.select(stroke);
        }
      } else {
        this.select(stroke);
        if(this.selectedStrokes.size > 1) {
          for(const stroke of this.selectedStrokes) {
            this.page.clusters.addClusterForStroke(stroke, this.selectedStrokes);
          }
        }

        this.clusterSelectionIndex = 0;
      }
    }

    fingerDownOnEmptySpace(){
        this.clearSelection();
    }

    render(){
      // if(this.selectedStrokes) {
      //   this.selectedStrokes.render(svg)
      // }
    }

    select(stroke: FreehandStroke){
        stroke.select();
        this.selectedStrokes.add(stroke);
    }

    clearSelection(){
      if(this.selectedStrokes === null) {
        return;
      }
      
      for(const stroke of this.selectedStrokes) {
        stroke.deselect();
      }

      this.selectedStrokes = new Set();
    }
}