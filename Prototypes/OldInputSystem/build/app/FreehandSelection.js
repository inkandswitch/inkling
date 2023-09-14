import Vec from "../lib/vec.js";
export default class FreehandSelection {
  constructor(page) {
    this.page = page;
    this.selectedStrokes = new Set();
    this.clusterSelectionIndex = 0;
    this.fingerDown = null;
    this.fingerMoved = null;
  }
  update(events) {
    const fingerDown = events.find("finger", "began");
    if (fingerDown) {
      this.fingerDown = fingerDown;
      const foundStroke = this.page.findFreehandStrokeNear(fingerDown.position);
      const foundHandle = this.page.findHandleNear(fingerDown.position);
      window.setTimeout(() => {
        if (this.fingerDown && (!this.fingerMoved || Vec.dist(this.fingerDown.position, this.fingerMoved.position) < 10)) {
          this.createGroupFromSelection();
        }
      }, 750);
      if (foundStroke && !foundHandle) {
        this.fingerDownOnStroke(foundStroke);
      } else {
        this.fingerDownOnEmptySpace();
      }
    }
    if (this.fingerDown) {
      const fingerMoved = events.find("finger", "moved", this.fingerDown.id);
      if (fingerMoved) {
        this.fingerMoved = fingerMoved;
      }
      const fingerEnded = events.find("finger", "ended", this.fingerDown.id);
      if (fingerEnded) {
        this.fingerDown = null;
        this.fingerMoved = null;
      }
    }
  }
  createGroupFromSelection() {
    const ungroupedStrokes = new Set(Array.from(this.selectedStrokes).filter((s) => !s.group));
    if (ungroupedStrokes.size > 0) {
      this.page.addStrokeGroup(ungroupedStrokes);
      for (const stroke of ungroupedStrokes) {
        stroke.deselect();
      }
    }
  }
  fingerDownOnStroke(stroke) {
    if (this.selectedStrokes.has(stroke)) {
      const clusters = this.page.clusters.getClustersForStroke(stroke);
      console.log(clusters);
      if (!clusters) {
        return;
      }
      this.clusterSelectionIndex++;
      const cluster = clusters.get(this.clusterSelectionIndex % clusters.size());
      this.clearSelection();
      for (const stroke2 of cluster) {
        this.select(stroke2);
      }
    } else {
      this.select(stroke);
      if (this.selectedStrokes.size > 1) {
        for (const stroke2 of this.selectedStrokes) {
          this.page.clusters.addClusterForStroke(stroke2, this.selectedStrokes);
        }
      }
      this.clusterSelectionIndex = 0;
    }
  }
  fingerDownOnEmptySpace() {
    this.clearSelection();
  }
  render() {
  }
  select(stroke) {
    stroke.select();
    this.selectedStrokes.add(stroke);
  }
  clearSelection() {
    for (const stroke of this.selectedStrokes) {
      stroke.deselect();
    }
    this.selectedStrokes.clear();
  }
}
