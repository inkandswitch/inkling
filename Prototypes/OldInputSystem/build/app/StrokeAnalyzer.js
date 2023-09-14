import Vec from "../lib/vec.js";
import Svg from "./Svg.js";
class StrokeGraphNode {
  constructor(position) {
    this.averagePosition = position;
    this.positions = [position];
  }
  addPosition(position) {
    this.positions.push(position);
    this.averagePosition = Vec.divS(this.positions.reduce((acc, v) => Vec.add(acc, v), Vec(0, 0)), this.positions.length);
  }
}
class StrokeGraphEdge {
  constructor(stroke) {
    this.nodesWithPointIndex = [];
    this.stroke = stroke;
  }
  addNode(node, pointIndex) {
    if (this.nodesWithPointIndex.find((n) => n.node == node)) {
      return;
    }
    this.nodesWithPointIndex.push({node, pointIndex});
    this.nodesWithPointIndex.sort((a, b) => {
      return a.pointIndex - b.pointIndex;
    });
  }
  getAdjacentNodes(node) {
    let index = this.nodesWithPointIndex.findIndex((n) => n.node === node);
    if (index == -1)
      return [];
    const adjacentNodes = [
      this.nodesWithPointIndex[index - 1],
      this.nodesWithPointIndex[index + 1]
    ].filter((n) => n).map((n) => n.node);
    return adjacentNodes;
  }
  getPartialStrokeBetween(nodeA, nodeB) {
    const indexA = this.nodesWithPointIndex.find((n) => n.node === nodeA)?.pointIndex;
    const indexB = this.nodesWithPointIndex.find((n) => n.node === nodeB)?.pointIndex;
    if (indexA === void 0 || indexB === void 0) {
      throw new Error("nodes not connected to this edge");
    }
    ;
    const pointIndexes = [indexA, indexB].sort((a, b) => a - b);
    const distance = this.stroke.distanceBetweenPoints(pointIndexes[0], pointIndexes[1]);
    return {
      stroke: this.stroke,
      pointIndexes,
      nodes: [nodeA, nodeB],
      distance,
      id: this.stroke.id + "_" + pointIndexes[0] + "_" + pointIndexes[1]
    };
  }
  getAdjacentPartialStrokes(node) {
    const adjacentNodes = this.getAdjacentNodes(node);
    return adjacentNodes.map((otherNode) => {
      return this.getPartialStrokeBetween(node, otherNode);
    });
  }
}
class StrokeGraph {
  constructor() {
    this.nodes = [];
    this.edges = [];
  }
  addNode(position) {
    const found = this.nodes.find((node) => {
      return node.positions.find((p) => Vec.dist(position, p) < 10);
    });
    if (found) {
      found.addPosition(position);
      return found;
    }
    const newNode = new StrokeGraphNode(position);
    this.nodes.push(newNode);
    return newNode;
  }
  addEdge(stroke, node, index) {
    let edge = this.edges.find((edge2) => {
      return edge2.stroke == stroke;
    });
    if (!edge) {
      edge = new StrokeGraphEdge(stroke);
      this.edges.push(edge);
    }
    edge.addNode(node, index);
  }
  getAdjacentNodes(node) {
    let neighbours = new Set();
    for (const edge of this.edges) {
      let edgeNeighbours = edge.getAdjacentNodes(node);
      for (const n of edgeNeighbours) {
        neighbours.add(n);
      }
    }
    return neighbours;
  }
  getAdjacentPartialStrokes(node) {
    return this.edges.flatMap((edge) => edge.getAdjacentPartialStrokes(node));
  }
  findShortestCycle(startNode, visited) {
    let partialStrokes = this.getAdjacentPartialStrokes(startNode);
    console.log("partialStrokes", partialStrokes);
    partialStrokes.sort((a, b) => a.distance - b.distance);
    if (partialStrokes.length > 1) {
      const startStroke = partialStrokes.pop();
      const targetNodes = partialStrokes.map((ps) => ps.nodes[1]);
      for (const targetNode of targetNodes) {
      }
    }
  }
  shortestFirstSearch(startNode, targetNode, visitedEdges = new Set(), path = [], paths = []) {
    console.log("sfs", startNode, targetNode, visitedEdges, path, paths);
    if (path.length > 0 && startNode === targetNode) {
      paths.push([...path]);
    }
    let partialStrokes = this.getAdjacentPartialStrokes(startNode).filter((ps) => !visitedEdges.has(ps.id)).sort((a, b) => a.distance - b.distance);
    console.log("partialStrokes", partialStrokes);
    for (const ps of partialStrokes) {
      let nextNode = ps.nodes[1];
      visitedEdges.add(ps.id);
      path.push(ps);
      this.shortestFirstSearch(nextNode, targetNode, visitedEdges, path, paths);
    }
    return paths;
  }
  render() {
    this.nodes.forEach((node) => {
      Svg.now("circle", {
        cx: node.averagePosition.x,
        cy: node.averagePosition.y,
        r: "5",
        fill: "pink"
      });
    });
  }
}
export default class StrokeAnalyzer {
  constructor(page) {
    this.graph = new StrokeGraph();
    this.loops = new Array();
    this.page = page;
  }
  addStroke(stroke) {
    console.log(stroke);
    this.generateConnectionsForStroke(stroke);
    this.generateLoopsForStroke(stroke);
  }
  generateConnectionsForStroke(stroke) {
    for (const otherStroke of this.page.freehandStrokes) {
      if (stroke === otherStroke) {
        continue;
      }
      const connectionZonesForStroke = findConnectionZonesBetweenStrokes(stroke.points, otherStroke.points);
      for (const connectionZone of connectionZonesForStroke) {
        const position = Vec.mulS(Vec.add(stroke.points[connectionZone.mid[0]], otherStroke.points[connectionZone.mid[1]]), 0.5);
        let node = this.graph.addNode(position);
        this.graph.addEdge(stroke, node, connectionZone.mid[0]);
        this.graph.addEdge(otherStroke, node, connectionZone.mid[1]);
        let shortestLoop = this.graph.shortestFirstSearch(node, node);
        this.loops.push(...shortestLoop);
      }
      console.log(this.graph);
    }
  }
  generateLoopsForStroke(targetStroke) {
  }
  generateArrowLikes() {
  }
  render() {
    this.graph.render();
    this.loops.forEach((loop) => {
      loop.forEach((ps) => {
        let points = Svg.points(ps.stroke.points.slice(ps.pointIndexes[0], ps.pointIndexes[1]));
        Svg.now("polyline", {
          points,
          stroke: "rgba(255,0,0,0.1)",
          fill: "none",
          "stroke-width": "5"
        });
      });
    });
  }
}
function findConnectionZonesBetweenStrokes(strokeA, strokeB) {
  const connections = [];
  let currentConnection = null;
  for (let i = 0; i < strokeA.length; i++) {
    const closest = findClosestPointOnStroke(strokeB, strokeA[i]);
    if (closest.dist < 20) {
      if (!currentConnection) {
        currentConnection = {
          start: [i, closest.index],
          end: [i, closest.index],
          mid: [i, closest.index],
          dist: closest.dist
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
function findClosestPointOnStroke(stroke, point) {
  let minDist = Vec.dist(stroke[0], point);
  let index = 0;
  for (let i = 0; i < stroke.length; i++) {
    const dist = Vec.dist(stroke[i], point);
    if (dist < minDist) {
      minDist = dist;
      index = i;
    }
  }
  return {dist: minDist, index};
}
