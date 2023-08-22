import { Position, PositionWithPressure } from '../../lib/types';
import Vec from '../../lib/vec';
import SVG from '../Svg';
import FreehandStroke from './FreehandStroke';

// A connection between two strokes
interface Connection {
  strokes: FreehandStroke[];
  indexes: number[];
  position: Position;
}

type Cluster = Set<FreehandStroke>;

// Stroke Graph is the datastructure responsible for holding information about groupings of strokes
export default class StrokeGraph {
  strokes: FreehandStroke[] = [];
  connections: Connection[] = [];
  elements: SVGElement[] = [];

  clustersForStroke: Map<FreehandStroke, Set<Cluster>> = new Map();

  private needsRerender = false;

  addStroke(stroke: FreehandStroke) {
    this.addConnectionsForStroke(stroke);
    this.strokes.push(stroke);
    this.needsRerender = true;

    const clusters: Set<Cluster> = new Set();
    this.clustersForStroke.set(stroke, clusters);
  }

  addClusterForStroke(stroke: FreehandStroke, cluster: Cluster) {
    const clusters = this.clustersForStroke.get(stroke);
    clusters?.add(cluster);
  }

  getClustersForStroke(stroke: FreehandStroke) {
    return Array.from(this.clustersForStroke.get(stroke)!);
  }

  // Automatic clustering detection
  addConnectionsForStroke(stroke: FreehandStroke) {
    // Generate connections for this stroke
    for (const otherStroke of this.strokes) {
      const connections = findConnectionsBetweenStrokes(
        stroke.points,
        otherStroke.points
      );

      for (const connection of connections) {
        this.connections.push({
          strokes: [stroke, otherStroke],
          indexes: connection.mid,
          position: Vec.mulS(
            Vec.add(
              stroke.points[connection.mid[0]],
              otherStroke.points[connection.mid[1]]
            ),
            0.5
          ),
        });
      }
    }

    // Merge Close Connections

    // // Compute loops for stroke
    // let loops = this.computeLoopsForStroke(stroke);
    // loops = loops.map(l=>new Set(l));
    // this.clustersForStroke.get()
  }
  // Automatic
  // TODO: Filter out small loops
  computeLoopsForStroke(targetStroke: FreehandStroke) {
    type StackEntry = { stroke: FreehandStroke; connection: Connection | null };
    type Stack = StackEntry[];

    const loops: Stack[] = [];

    // Do a DFS for loops in the connections
    const stack: Stack = [{ stroke: targetStroke, connection: null }];
    const trace: Stack = [];

    // Make sure we backgrack connections multiple times
    const tracedConnections = new Set();

    while (stack.length > 0) {
      console.log(
        'stack',
        stack.map(s => s.stroke.id)
      );

      const s = stack.pop()!;
      trace.push(s);

      const currentStroke = s.stroke;
      tracedConnections.add(s.connection);

      const connections = this.connections.filter(connection => {
        return (
          !tracedConnections.has(connection) &&
          connection.strokes.includes(currentStroke)
        );
      });

      if (connections.length === 0) {
        trace.pop();
      }

      for (const connection of connections) {
        const other = connection.strokes.find(s => s !== currentStroke)!;
        stack.push({ stroke: other, connection });

        // reached goal
        if (stack.length > 0 && other === targetStroke) {
          loops.push([...trace]);
          trace.pop();
        }
      }
    }

    console.log(loops);
    return loops;
  }

  findClusterForStroke(stroke: FreehandStroke) {
    const results = new Set();
    results.add(stroke);

    const stack = [stroke];

    while (stack.length > 0) {
      const currentStroke = stack.pop()!;

      const connectedStrokes = this.connections
        .filter(connection => connection.strokes.find(s => s === currentStroke))
        .map(connection => connection.strokes.find(s => s !== currentStroke)!);

      for (const s of connectedStrokes) {
        if (!results.has(s)) {
          results.add(s);
          stack.push(s);
        }
      }
    }

    return Array.from(results);
  }

  findStrokeConnections(stroke: FreehandStroke) {
    return this.connections.filter(connection =>
      connection.strokes.find(s => s === stroke)
    );
  }

  findConnectedStrokes(stroke: FreehandStroke) {
    return this.connections
      .filter(connection => connection.strokes.find(s => s === stroke))
      .map(connection => connection.strokes.find(s => s !== stroke));
  }

  render(svg: SVG) {
    if (!this.needsRerender) {
      return;
    }

    for (const elem of this.elements) {
      elem.remove();
    }

    this.elements = this.connections.map(c => {
      return svg.addElement('circle', {
        cx: c.position.x,
        cy: c.position.y,
        r: 3,
        fill: 'pink', //c.aligned ? 'pink' : 'green',
      });
    });

    this.needsRerender = false;
  }
}

// TODO(marcel): come up with a better name for this.
interface Connection2 {
  start: [number, number];
  mid: [number, number];
  end: [number, number];
  dist: number;
}

function findConnectionsBetweenStrokes(
  strokeA: PositionWithPressure[],
  strokeB: PositionWithPressure[]
): Connection2[] {
  const connections: Connection2[] = [];

  let currentConnection: Connection2 | null = null;
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
    //   const dist = Vec.dist(strokeA[i], strokeB[j]);
    //   if (dist < minDist) {
    //     minDist = dist;
    //     indexA = i;
    //     indexB = j;
    //   }
    // }
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

// --- Alex commented out these functions b/c they weren't used ---

// function closestPointsBetweenStrokes(
//   strokeA: PositionWithPressure[],
//   strokeB: PositionWithPressure[]
// ) {
//   let minDist = Vec.dist(strokeA[0], strokeB[0]);
//   let indexA = 0;
//   let indexB = 0;

//   for (let i = 0; i < strokeA.length; i++) {
//     for (let j = 0; j < strokeB.length; j++) {
//       const pa = strokeA[i];
//       const pb = strokeB[j];
//       const dist = Vec.dist(pa, pb);
//       if (dist < minDist) {
//         minDist = dist;
//         indexA = i;
//         indexB = j;
//       }
//     }
//   }

//   return { dist: minDist, indexA, indexB };
// }

// function getDirectionAtStrokePoint(
//   stroke: PositionWithPressure[],
//   index: number
// ) {
//   const backwardIndex = Math.max(index - 10, 0);
//   const forwardIndex = Math.min(index + 10, stroke.length - 1);
//   return Vec.normalize(Vec.sub(stroke[backwardIndex]!, stroke[forwardIndex]!));
// }
