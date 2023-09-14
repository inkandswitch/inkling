import Vec from "../lib/vec.js";
import SVG from "./Svg.js";
export default class StrokeGraph {
  constructor() {
    this.strokes = [];
    this.connections = [];
    this.elements = [];
    this.clustersForStroke = new Map();
    this.needsRerender = false;
  }
  addStroke(stroke) {
    this.addConnectionsForStroke(stroke);
    this.strokes.push(stroke);
    this.needsRerender = true;
    const clusters = new Set();
    this.clustersForStroke.set(stroke, clusters);
  }
  addClusterForStroke(stroke, cluster) {
    const clusters = this.clustersForStroke.get(stroke);
    clusters?.add(cluster);
  }
  getClustersForStroke(stroke) {
    return Array.from(this.clustersForStroke.get(stroke));
  }
  addConnectionsForStroke(stroke) {
    for (const otherStroke of this.strokes) {
      const connections = findConnectionsBetweenStrokes(stroke.points, otherStroke.points);
      for (const connection of connections) {
        this.connections.push({
          strokes: [stroke, otherStroke],
          indexes: connection.mid,
          position: Vec.mulS(Vec.add(stroke.points[connection.mid[0]], otherStroke.points[connection.mid[1]]), 0.5)
        });
      }
    }
  }
  computeLoopsForStroke(targetStroke) {
    const loops = [];
    const stack = [{stroke: targetStroke, connection: null}];
    const trace = [];
    const tracedConnections = new Set();
    while (stack.length > 0) {
      console.log("stack", stack.map((s2) => s2.stroke.id));
      const s = stack.pop();
      trace.push(s);
      const currentStroke = s.stroke;
      if (s.connection) {
        tracedConnections.add(s.connection);
      }
      const connections = this.connections.filter((connection) => {
        return !tracedConnections.has(connection) && connection.strokes.includes(currentStroke);
      });
      if (connections.length === 0) {
        trace.pop();
      }
      for (const connection of connections) {
        const other = connection.strokes.find((s2) => s2 !== currentStroke);
        stack.push({stroke: other, connection});
        if (stack.length > 0 && other === targetStroke) {
          loops.push([...trace]);
          trace.pop();
        }
      }
    }
    console.log(loops);
    return loops;
  }
  findClusterForStroke(stroke) {
    const results = new Set();
    results.add(stroke);
    const stack = [stroke];
    while (stack.length > 0) {
      const currentStroke = stack.pop();
      const connectedStrokes = this.connections.filter((connection) => connection.strokes.find((s) => s === currentStroke)).map((connection) => connection.strokes.find((s) => s !== currentStroke));
      for (const s of connectedStrokes) {
        if (!results.has(s)) {
          results.add(s);
          stack.push(s);
        }
      }
    }
    return Array.from(results);
  }
  findStrokeConnections(stroke) {
    return this.connections.filter((connection) => connection.strokes.find((s) => s === stroke));
  }
  findConnectedStrokes(stroke) {
    return this.connections.filter((connection) => connection.strokes.find((s) => s === stroke)).map((connection) => connection.strokes.find((s) => s !== stroke));
  }
  render() {
    if (!this.needsRerender) {
      return;
    }
    for (const elem of this.elements) {
      elem.remove();
    }
    this.elements = this.connections.map((c) => {
      return SVG.add("circle", {
        cx: c.position.x,
        cy: c.position.y,
        r: 3,
        fill: "pink"
      });
    });
    this.needsRerender = false;
  }
}
function findConnectionsBetweenStrokes(strokeA, strokeB) {
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
