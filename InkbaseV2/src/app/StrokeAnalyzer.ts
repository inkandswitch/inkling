// Work in progress

import { Position, PositionWithPressure } from '../lib/types';
import Page from './Page';
import FreehandStroke from './strokes/FreehandStroke';
import Vec from '../lib/vec';

class StrokeGraphNode {
  // partialStrokes: PartialStroke[];
  averagePosition: Position;
  positions: Array<Position>;

  constructor(position: Position) {
    this.averagePosition = position;
    this.positions = [position];
  }

  addPosition(position: Position){
    this.positions.push(position);
    this.averagePosition = Vec.divS(
      this.positions.reduce((acc, v)=> Vec.add(acc, v), Vec(0,0)), 
      this.positions.length
    )
  }
}

// Not quite the same as an edge, as it represents multiple edges along the length of a stroke
class StrokeGraphEdge {
  stroke: FreehandStroke;

  // A sorted array of nodes positioned along the length of the stroke
  nodes: Array<{node: StrokeGraphNode, index: number}> = [];
  
  constructor(stroke: FreehandStroke){
    this.stroke = stroke;
  }

  addNode(node: StrokeGraphNode, index: number) {
    if(this.nodes.find(n=>n.node == node)) {
      return;
    }

    this.nodes.push({node, index});
    this.nodes.sort((a, b)=>{
      return a.index - b.index;
    })
  }

  // Find nodes that are directly reachable from this node along this edge
  getAdjacentNodes(node: StrokeGraphNode): Array<StrokeGraphNode>{
    let index = this.nodes.findIndex(n=>n.node===node);
    if(index == -1) return [];

    const adjacentNodes = [
      this.nodes[index-1],
      this.nodes[index+1]
    ].filter(n=>n).map(n=>n.node);

    return adjacentNodes;
  }
}

class StrokeGraph {
  nodes: Array<StrokeGraphNode> = [];
  edges: Array<StrokeGraphEdge> = [];

  addNode(position: Position): StrokeGraphNode {
    // Find node that we can collapse into
    const found = this.nodes.find(node=>{
      return node.positions.find(p=>Vec.dist(position, p) < 10)
    })

    if(found) {
      found.addPosition(position);
      return found
    }

    const newNode = new StrokeGraphNode(position);
    this.nodes.push(newNode);
    return newNode;
  }

  addEdge(stroke: FreehandStroke, node: StrokeGraphNode, index: number){
    // Find an edge that we can collapse into
    let edge = this.edges.find(edge=>{
      return edge.stroke == stroke
    })

    if(!edge) {
      edge = new StrokeGraphEdge(stroke);
      this.edges.push(edge);
    }

    edge.addNode(node, index);
  }
}

export default class StrokeAnalyzer {
  page: Page;
  graph = new StrokeGraph();
  //partialStrokes: 
  //loops: Loop[] = [];

  constructor(page: Page){
    this.page = page
  }

  addStroke(stroke: FreehandStroke) {
    this.generateConnectionsForStroke(stroke);
    this.generateLoopsForStroke(stroke);
  }

  generateConnectionsForStroke(stroke: FreehandStroke) {
    // Generate connections for this stroke
    for (const otherStroke of this.page.freehandStrokes) {
      if(stroke === otherStroke) {
        continue;
      }
      const connectionZonesForStroke = findConnectionZonesBetweenStrokes(stroke.points, otherStroke.points);
      
      for(const connectionZone of connectionZonesForStroke) {
        // Compute position of connection zone
        const position = Vec.mulS(
          Vec.add(
            stroke.points[connectionZone.mid[0]],
            otherStroke.points[connectionZone.mid[1]]
          ),
          0.5
        );

        let node = this.graph.addNode(position);
        this.graph.addEdge(stroke, node, connectionZone.mid[0]);
        this.graph.addEdge(otherStroke, node, connectionZone.mid[1]);
      }

      console.log(this.graph);
    }
  }

  generateLoopsForStroke(targetStroke: FreehandStroke){
    // Do a breadth first search for loops

  }

  generateArrowLikes(){

  }
}

interface ConnectionZone {
  start: [number, number];
  mid: [number, number];
  end: [number, number];
  dist: number;
}

function findConnectionZonesBetweenStrokes(
  strokeA: PositionWithPressure[],
  strokeB: PositionWithPressure[]
): ConnectionZone[] {
  const connections: ConnectionZone[] = [];

  let currentConnection: ConnectionZone | null = null;
  for (let i = 0; i < strokeA.length; i++) {
    const closest = findClosestPointOnStroke(strokeB, strokeA[i]);

    if (closest.dist < 20) {
      if (!currentConnection) {
        currentConnection = {
          start: [i, closest.index],
          end: [i, closest.index],
          mid: [i, closest.index],
          dist: closest.dist,
        };
      } else {
        currentConnection.end = [i, closest.index];
        if (closest.dist < currentConnection.dist) {
          currentConnection.mid = [i, closest.index];
          currentConnection.dist = closest.dist;
        }
      }
    } else {
      if (currentConnection) {
        connections.push(currentConnection);
        currentConnection = null;
      }
    }
  }

  if (currentConnection) {
    connections.push(currentConnection);
  }

  return connections;
}

// TODO: we can speed this up significantly if it becomes a bottleneck.
function findClosestPointOnStroke(
  stroke: PositionWithPressure[],
  point: PositionWithPressure
) {
  let minDist = Vec.dist(stroke[0], point);
  let index = 0;

  for (let i = 0; i < stroke.length; i++) {
    const dist = Vec.dist(stroke[i], point);
    if (dist < minDist) {
      minDist = dist;
      index = i;
    }
  }

  return { dist: minDist, index };
}