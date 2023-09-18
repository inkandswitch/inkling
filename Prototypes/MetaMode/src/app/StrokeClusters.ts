// Stroke Clusters are potential Groupings

import { SortedSet } from '../lib/helpers';
import FreehandStroke from './strokes/FreehandStroke';

type Cluster = Set<FreehandStroke>;

export default class StrokeClusters {
  private clustersByStroke = new Map<FreehandStroke, SortedSet<Cluster>>();

  addClusterForStroke(stroke: FreehandStroke, cluster: Cluster) {
    let clusters = this.getClustersForStroke(stroke);
    if (!clusters) {
      clusters = new SortedSet();
      this.clustersByStroke.set(stroke, clusters);
    }

    clusters.add(cluster);
  }

  getClustersForStroke(stroke: FreehandStroke) {
    return this.clustersByStroke.get(stroke);
  }
}
