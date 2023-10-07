// Work in progress
// TODO:
// [] Find shortest (Maximally turning) loops
// [] Find smooth continuation loops
// [] Find connectors between shapes
// [] Find blobbly clusters like text etc.

// [] Update graph when strokes are moved

import { Position, PositionWithPressure } from '../lib/types';
import Page from './Page';
import FreehandStroke from './strokes/FreehandStroke';
import Vec from '../lib/vec';
import Svg from './Svg';

// **
// StrokeGraph, Intermediate representation of the page. Useful for finding loops etc.
// TODO: Maybe move to a different file, just leave here for now
// **

// Node in the graph
class StrokeGraphNode {
  averagePosition: Position;
  positions: Array<Position>;

  constructor(position: Position) {
    this.averagePosition = position;
    this.positions = [position];
  }

  addPosition(position: Position) {
    this.positions.push(position);
    this.averagePosition = Vec.divS(
      this.positions.reduce((acc, v) => Vec.add(acc, v), Vec(0, 0)),
      this.positions.length
    );
  }
}

// A partial stroke is a reference to a slice of a FreehandStroke
// Equivalent to an actual edge in the graph
interface PartialStroke {
  stroke: FreehandStroke;
  pointIndexes: Array<number>;
  nodes: Array<StrokeGraphNode>;
  distance: number;
  id: string; //TODO: Maybe there's a better way of identifying uniqueness?
}

// Not quite the same as an edge in the graph, as it represents multiple edges along the length of a stroke
class StrokeGraphEdge {
  stroke: FreehandStroke;

  // A sorted array of nodes positioned along the length of the stroke
  nodesWithPointIndex: Array<{ node: StrokeGraphNode; pointIndex: number }> =
    [];

  constructor(stroke: FreehandStroke) {
    this.stroke = stroke;
  }

  addNode(node: StrokeGraphNode, pointIndex: number) {
    if (this.nodesWithPointIndex.find(n => n.node == node)) {
      return;
    }

    this.nodesWithPointIndex.push({ node, pointIndex });
    this.nodesWithPointIndex.sort((a, b) => {
      return a.pointIndex - b.pointIndex;
    });
  }

  // Find nodes that are directly reachable from this node along this edge
  getAdjacentNodes(node: StrokeGraphNode): Array<StrokeGraphNode> {
    let index = this.nodesWithPointIndex.findIndex(n => n.node === node);
    if (index == -1) return [];

    const adjacentNodes = [
      this.nodesWithPointIndex[index - 1],
      this.nodesWithPointIndex[index + 1],
    ]
      .filter(n => n)
      .map(n => n.node);

    return adjacentNodes;
  }

  getPartialStrokeBetween(
    nodeA: StrokeGraphNode,
    nodeB: StrokeGraphNode
  ): PartialStroke {
    const indexA = this.nodesWithPointIndex.find(n => n.node === nodeA)
      ?.pointIndex;
    const indexB = this.nodesWithPointIndex.find(n => n.node === nodeB)
      ?.pointIndex;
    if (indexA === undefined || indexB === undefined) {
      throw new Error('nodes not connected to this edge');
    }

    const pointIndexes = [indexA, indexB].sort((a, b) => a - b);
    const distance = this.stroke.distanceBetweenPoints(
      pointIndexes[0],
      pointIndexes[1]
    );

    return {
      stroke: this.stroke,
      pointIndexes,
      nodes: [nodeA, nodeB],
      distance,
      id: this.stroke.id + '_' + pointIndexes[0] + '_' + pointIndexes[1],
    };
  }

  getAdjacentPartialStrokes(node: StrokeGraphNode): Array<PartialStroke> {
    const adjacentNodes = this.getAdjacentNodes(node);
    return adjacentNodes.map(otherNode => {
      return this.getPartialStrokeBetween(node, otherNode);
    });
  }
}

class StrokeGraph {
  nodes: Array<StrokeGraphNode> = [];
  edges: Array<StrokeGraphEdge> = [];

  addNode(position: Position): StrokeGraphNode {
    // Find node that we can collapse into
    const found = this.nodes.find(node => {
      return node.positions.find(p => Vec.dist(position, p) < 10);
    });

    if (found) {
      found.addPosition(position);
      return found;
    }

    const newNode = new StrokeGraphNode(position);
    this.nodes.push(newNode);
    return newNode;
  }

  addEdge(stroke: FreehandStroke, node: StrokeGraphNode, index: number) {
    // Find an edge that we can collapse into
    let edge = this.edges.find(edge => {
      return edge.stroke == stroke;
    });

    if (!edge) {
      edge = new StrokeGraphEdge(stroke);
      this.edges.push(edge);
    }

    edge.addNode(node, index);
  }

  getAdjacentNodes(node: StrokeGraphNode): Set<StrokeGraphNode> {
    let neighbours: Set<StrokeGraphNode> = new Set();
    for (const edge of this.edges) {
      let edgeNeighbours = edge.getAdjacentNodes(node);
      for (const n of edgeNeighbours) {
        neighbours.add(n);
      }
    }

    return neighbours;
  }

  getAdjacentPartialStrokes(node: StrokeGraphNode): Array<PartialStroke> {
    return this.edges.flatMap(edge => edge.getAdjacentPartialStrokes(node));
  }

  // Find the shortest cycle for this node
  findShortestCycle(startNode: StrokeGraphNode, visited: Set<string>) {
    let partialStrokes = this.getAdjacentPartialStrokes(startNode);
    console.log('partialStrokes', partialStrokes);
    partialStrokes.sort((a, b) => a.distance - b.distance);

    // If there are multiple partial strokes that means we can possibly find a loop
    if (partialStrokes.length > 1) {
      const startStroke = partialStrokes.pop();
      const targetNodes = partialStrokes.map(ps => ps.nodes[1]);

      for (const targetNode of targetNodes) {
      }
    }
  }

  // TODO: Improve search heuristic here
  shortestFirstSearch(
    startNode: StrokeGraphNode,
    targetNode: StrokeGraphNode,
    visitedEdges: Set<string> = new Set(),
    path: Array<PartialStroke> = [],
    paths: Array<Array<PartialStroke>> = []
  ) {
    console.log('sfs', startNode, targetNode, visitedEdges, path, paths);

    if (path.length > 0 && startNode === targetNode) {
      paths.push([...path]);
    }

    let partialStrokes = this.getAdjacentPartialStrokes(startNode)
      .filter(ps => !visitedEdges.has(ps.id)) // Only edges that we haven't visited yet
      .sort((a, b) => a.distance - b.distance); // Do shortest edge first

    console.log('partialStrokes', partialStrokes);

    for (const ps of partialStrokes) {
      let nextNode = ps.nodes[1];
      visitedEdges.add(ps.id);
      path.push(ps);
      this.shortestFirstSearch(nextNode, targetNode, visitedEdges, path, paths);
    }

    return paths;
  }

  // // Dijkstras shortest path between nodes
  // findShortestPathBetween(startNode: StrokeGraphNode, endNode: StrokeGraphNode) {

  // }

  render() {
    this.nodes.forEach(node => {
      Svg.now('circle', {
        cx: node.averagePosition.x,
        cy: node.averagePosition.y,
        r: '5',
        fill: 'pink',
      });
    });
  }
}

// **
// Stroke Analyzer: Responsible for running different analysis algorithms
// **

export default class StrokeAnalyzer {
  page: Page;
  graph = new StrokeGraph();

  loops = new Array<any>();
  //partialStrokes:
  //loops: Loop[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  addStroke(stroke: FreehandStroke) {
    console.log(stroke);

    this.generateConnectionsForStroke(stroke);
    this.generateLoopsForStroke(stroke);
  }

  generateConnectionsForStroke(stroke: FreehandStroke) {
    // Generate connections for this stroke

    for (const otherStroke of this.page.freehandStrokes) {
      if (stroke === otherStroke) {
        continue;
      }

      const connectionZonesForStroke = findConnectionZonesBetweenStrokes(
        stroke.points,
        otherStroke.points
      );

      for (const connectionZone of connectionZonesForStroke) {
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
        let shortestLoop = this.graph.shortestFirstSearch(node, node);
        this.loops.push(...shortestLoop);
      }

      console.log(this.graph);
    }

    // TODO: Find self intersections & closings
  }

  generateLoopsForStroke(targetStroke: FreehandStroke) {
    // Do a breadth first search for loops
  }

  generateArrowLikes() {}

  render() {
    this.graph.render();

    this.loops.forEach(loop => {
      loop.forEach((ps: any) => {
        let points = Svg.points(
          ps.stroke.points.slice(ps.pointIndexes[0], ps.pointIndexes[1])
        );
        Svg.now('polyline', {
          points,
          stroke: 'rgba(255,0,0,0.1)',
          fill: 'none',
          'stroke-width': '5',
        });
      });
    });
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
