// Stroke Clusters are potential Groupings

import FreehandStroke from './strokes/FreehandStroke';

type Cluster = Set<FreehandStroke>;

export default class StrokeGraph {
  clustersByStroke: Map<FreehandStroke, SortedSet<Cluster>> = new Map();

  addClusterForStroke(stroke: FreehandStroke, cluster: Cluster){
    let clusters = this.clustersByStroke.get(stroke);
    if(!clusters) {
      clusters = new SortedSet()
      this.clustersByStroke.set(stroke, clusters);
    }

    clusters.add(cluster);
  }

  getClustersForStroke(stroke: FreehandStroke) {
    return this.clustersByStroke.get(stroke);
  }
}

// Sorted Set
// Guarantees unique items, and allows resorting of items when iterating
export class SortedSet<T> {
  items: Array<T> = [];

  static fromSet<T>(set: Set<T>){
    let ss = new SortedSet<T>();
    ss.items = Array.from(set);
    return ss
  }
  
  add(item: T){
    for(const o of this.items) {
      if(o === item) return
    }

    this.items.push(item);
  }

  moveItemToFront(item: T) {
    // find old position
    let oldIndex = this.items.findIndex(i=>i===item);
    if(oldIndex === -1) return;

    // Remove item from old position
    let oldItem = this.items.splice(oldIndex, 1)[0];

    // Add it back to front
    this.items.unshift(oldItem);
  }

  get(index: number) {
    return this.items[index]
  }

  size(){
    return this.items.length
  }

  [Symbol.iterator]() {
    var index = -1;
    var data  = this.items;

    return {
      next: () => ({ value: data[++index], done: !(index in data) })
    };
  };
}