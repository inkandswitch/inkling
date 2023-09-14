import {SortedSet} from "../lib/helpers.js";
export default class StrokeClusters {
  constructor() {
    this.clustersByStroke = new Map();
  }
  addClusterForStroke(stroke, cluster) {
    let clusters = this.getClustersForStroke(stroke);
    if (!clusters) {
      clusters = new SortedSet();
      this.clustersByStroke.set(stroke, clusters);
    }
    clusters.add(cluster);
  }
  getClustersForStroke(stroke) {
    return this.clustersByStroke.get(stroke);
  }
}
