import { Position } from "../lib/types";
import Vec from "../lib/vec";
import SVG from "./Svg";
import FreehandStroke from "./strokes/FreehandStroke";

import ClipperShape from "@doodle3d/clipper-js"


// Groups is the datastructure responsible for keeping track of possible groups of strokes
export default class Groups {
  strokeOutline = new Map<FreehandStroke, ClipperShape>();
  groups: Array<Group> = [];
  strokeToGroup = new Map<FreehandStroke, Group>();

  elements: SVGElement[] = [];

  dirty = false

  connections: any[] = [];

  // TODO: Make this incremental
  update(strokes) {

    // Find Connection points between strokes
    // Loop through each pair
    // TODO: Find loops in single strokes
    this.connections = [];
    for (let i = 0; i < strokes.length; i++) {
      const a = strokes[i];
      for (let j = i + 1; j < strokes.length; j++) {
        const b = strokes[j];

        let connections = findConnectionsBetweenStrokes(a.points, b.points)

        for (const connection of connections) {
          this.connections.push({
            strokes: [a, b],
            indexes: connection.mid,
            point: Vec.mulS(Vec.add(a.points[connection.mid[0]], b.points[connection.mid[1]]), 0.5),
          })
        }
      }
    }

    // Find loops
    // Turn connections into a graph
    let nodes = [];
    let edges = [];
    this.connections.forEach((connection, i) => {
      // TODO: Collapse nodes
      let node = {
        position: connection.point,
        id: i
      }



    })


    this.dirty = true
  }

  addStroke(stroke: FreehandStroke) {
    let points = rdp_simplify(stroke.points, 2)
    let shape = new ClipperShape([points], true, true, true, true)
    shape = shape.offset(7.5, {
      jointType: 'jtRound',
      endType: 'etOpenRound',
      miterLimit: 2.0,
      roundPrecision: 0.25
    })

    this.strokeOutline.set(stroke, shape)


    // Add to groups
    let found = false;
    let foundGroup = null;

    for (const group of this.groups) {
      if (group.intersects(shape)) {
        found = true;
        group.addStroke(stroke, shape);
        break;
      }
    }



    if (!found) {
      let group = new Group(stroke, shape);
      this.groups.push(group);
    }



    this.dirty = true

  }

  render(svg: SVG) {
    if (!this.dirty) {
      return;
    }

    for (const elem of this.elements) {
      elem.remove();
    }

    // this.elements = this.groups.map(group => {
    //   let path = clipperShapeSVGPath(group.outline)
    //   return svg.addElement("path", {
    //     d: path,
    //     fill: "none",
    //     stroke: "rgba(0,0,0,0.05)",
    //   });
    // });
    this.elements = this.connections.map(c => {
      return svg.addElement("circle", {
        cx: c.point.x,
        cy: c.point.y,
        r: 3,
        fill: "pink"
      });
    });

    this.dirty = false;
  }
}






function findConnectionsBetweenStrokes(strokeA, strokeB) {
  let connections: any[] = [];

  let currentConnection: any = null;
  for (let i = 0; i < strokeA.length; i++) {
    if (strokeA[i] == null) continue;


    let closest = findClostestPointOnStroke(strokeB, strokeA[i]);

    if (closest.dist < 10) {
      if (!currentConnection) {
        currentConnection = {
          start: [i, closest.index],
          end: [i, closest.index],
          mid: [i, closest.index],
          dist: closest.dist,
        }
      } else {
        currentConnection.end = [i, closest.index]
        if (closest.dist < currentConnection.dist) {
          currentConnection.mid = [i, closest.index]
          currentConnection.dist = closest.dist
        }
      }
    } else {
      if (currentConnection) {
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

  if (currentConnection) {
    connections.push(currentConnection);
  }

  return connections;

  //return { dist: minDist, indexA, indexB };
}

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

function clipperShapeSVGPath(shape) {
  let svgPath = "";
  for (const path of shape.paths) {
    svgPath += `M ${path[0].X} ${path[0].Y} `;
    for (let i = 1; i < path.length; i++) {
      svgPath += `L ${path[i].X} ${path[i].Y} `;
    }
    svgPath += `L ${path[0].X} ${path[0].Y} `;
  }
  return svgPath
}

function rdp_simplify(line, epsilon = 20) {
  if (line.length == 2) {
    return line
  }

  let start = line[0]
  let end = line[line.length - 1]

  var largestDistance = -1;
  var furthestIndex = -1;

  for (let i = 0; i < line.length; i++) {
    let point = line[i]
    let dist = point_line_distance(point, start, end)
    if (dist > largestDistance) {
      largestDistance = dist
      furthestIndex = i
    }
  }

  if (largestDistance > epsilon) {
    let segment_a = rdp_simplify(line.slice(0, furthestIndex), epsilon)
    let segment_b = rdp_simplify(line.slice(furthestIndex), epsilon)

    return segment_a.concat(segment_b.slice(1))
  }
  return [start, end]
}

function point_line_distance(p, a, b) {
  let norm = scalar_projection(p, a, b)
  return Vec.len(Vec.sub(p, norm))
}

function scalar_projection(p, a, b) {
  let ap = Vec.sub(p, a)
  let ab = Vec.normalize(Vec.sub(b, a))
  let f = Vec.mulS(ab, Vec.dot(ap, ab))

  return Vec.add(a, f)
}