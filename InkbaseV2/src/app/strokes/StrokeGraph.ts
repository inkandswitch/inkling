// NOTE: THIS IS VERY WIP
// PLEASE DON'T WASTE YOUR TIME "FIXING" THIS

import { Position, PositionWithPressure } from '../../lib/types';
import Vec from '../../lib/vec';
import SVG from '../Svg';
import FreehandStroke from './FreehandStroke';

// A connection between two strokes
interface Connection {
  //id: number;
  position: Position;
  strokes: FreehandStroke[];
  indexes: number[];
}

// Stroke Graph is the datastructure responsible for holding information about groupings of strokes
export default class StrokeGraph {
  strokes: FreehandStroke[] = [];
  connections: Connection[] = [];
  //connectionIds = 0;

  // nodes: GraphNode[] = [];
  // edges: GraphEdge[] = [];
  //connectionsByStroke: Map<FreehandStroke, Set<Connection>> = 

  elements: SVGElement[] = [];

  private needsRerender = false;


  addStroke(stroke: FreehandStroke) {
    this.addConnectionsForStroke(stroke);
    this.strokes.push(stroke);
    this.needsRerender = true;
  }

  addConnectionsForStroke(stroke){
    // Generate connections for this stroke
    for (const otherStroke of this.strokes) {
      const connections = findConnectionsBetweenStrokes(stroke.points, otherStroke.points);
      
      for(const connection of connections) {
        this.connections.push({
          strokes: [stroke, otherStroke],
          indexes: connection.mid,
          position: Vec.mulS(Vec.add(stroke.points[connection.mid[0]], otherStroke.points[connection.mid[1]]), 0.5),
          //id: this.connectionIds++
        })
      }
    }
  }

  computeLoopsForStroke(targetStroke){
    const loops = [];

    // Do a DFS for loops in the connections
    const stack = [{stroke: targetStroke, connection: null}];
    const trace = [];

    // Make sure we backgrack connections multiple times
    const tracedConnections = new Set();

    while(stack.length > 0) {
      console.log("stack", stack.map(s=>s.stroke.id));

      let s = stack.pop();
      trace.push(s);

      let currentStroke = s.stroke;
      tracedConnections.add(s.connection);

      let connections = this.connections.filter(connection=>{
        return !tracedConnections.has(connection) && connection.strokes.find(s=>s===currentStroke)
      })

      if(connections.length == 0) {
        trace.pop();
      }

      connections.forEach(connection=>{
        let other = connection.strokes.find(s=>s!==currentStroke)
        stack.push({stroke: other, connection});

        // reached goal
        if(stack.length > 0 && other == targetStroke) {
          loops.push([...trace]);
          trace.pop();
        }
      })


    }

    console.log(loops);
    return loops
  }

  findClusterForStroke(stroke){
    let results = new Set();
    results.add(stroke);

    let stack = [stroke];

    while(stack.length > 0) {
      let currentStroke = stack.pop();

      let connectedStrokes = this.connections.filter(connection=>{
        return connection.strokes.find(s=>s===currentStroke)
      }).map(connection=>{
        return connection.strokes.find(s=>s!==currentStroke)
      })

      connectedStrokes.forEach(s=>{
        if(!results.has(s)) {
          results.add(s);
          stack.push(s);
        }
      })
    }
    
    return Array.from(results);
  }

  findStrokeConnections(stroke: FreehandStroke){
    return this.connections.filter(connection=>{
      return connection.strokes.find(s=>s===stroke)
    })
  }

  findConnectedStrokes(stroke: FreehandStroke){
    return this.connections.filter(connection=>{
      return connection.strokes.find(s=>s===stroke)
    }).map(connection=>{
      return connection.strokes.find(s=>s!==stroke)
    })
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
        fill: 'pink'//c.aligned ? 'pink' : 'green',
      });
    });

    this.needsRerender = false;
  }
}


function findConnectionsBetweenStrokes(strokeA, strokeB) {
  let connections: any[] = [];

  let currentConnection: any = null;
  for (let i = 0; i < strokeA.length; i++) {
    if (strokeA[i] == null) continue;


    let closest = findClostestPointOnStroke(strokeB, strokeA[i]);
    
    if(closest.dist < 20) {
      if(!currentConnection) {
        currentConnection = {
          start: [i, closest.index],
          end: [i, closest.index],
          mid: [i, closest.index],
          dist: closest.dist,
        }
      } else {
        currentConnection.end = [i, closest.index]
        if(closest.dist < currentConnection.dist) {
          currentConnection.mid = [i, closest.index]
          currentConnection.dist = closest.dist
        }
      }
    } else {
      if(currentConnection) {
        connections.push(currentConnection);
        currentConnection = null
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

  if(currentConnection) {
    connections.push(currentConnection);
  }

  return connections;
}

// TODO: we can speed this up significantly if it becomse a bottleneck.
function findClostestPointOnStroke(stroke, point) {
  let minDist = Vec.dist(stroke[0], point);
  let index = 0;

  for (let i = 0; i < stroke.length; i++) {
    if (stroke[i] == null) continue;

    const dist = Vec.dist(stroke[i], point);
    if (dist < minDist) {
      minDist = dist;
      index = i;
    }
  }

  return { dist: minDist, index };
}

function closestPointsBetweenStrokes(
  strokeA: Array<PositionWithPressure | null>,
  strokeB: Array<PositionWithPressure | null>
) {
  let minDist = Vec.dist(strokeA[0]!, strokeB[0]!);
  let indexA = 0;
  let indexB = 0;

  for (let i = 0; i < strokeA.length; i++) {
    for (let j = 0; j < strokeB.length; j++) {
      const pa = strokeA[i];
      const pb = strokeB[j];
      if (!pa || !pb) {
        continue;
      }

      const dist = Vec.dist(pa, pb);
      if (dist < minDist) {
        minDist = dist;
        indexA = i;
        indexB = j;
      }
    }
  }

  return { dist: minDist, indexA, indexB };
}

function getDirectionAtStrokePoint(
  stroke: Array<PositionWithPressure | null>,
  index: number
) {
  let backwardIndex = index - 10;
  if (backwardIndex < 0) {
    backwardIndex = 0;
  }
  while (!stroke[backwardIndex]) {
    backwardIndex++;
  }

  let forwardIndex = index + 10;
  if (forwardIndex > stroke.length - 1) {
    forwardIndex = stroke.length - 1;
  }
  while (!stroke[forwardIndex]) {
    forwardIndex--;
  }

  return Vec.normalize(Vec.sub(stroke[backwardIndex]!, stroke[forwardIndex]!));
}
