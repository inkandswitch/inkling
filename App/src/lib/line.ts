// Line
// This is a collection of functions related to line segments written by Marcel with help of ChatGPT

import { isZero } from './math';
import { Position } from './types';
import Vec from './vec';

interface Line {
  a: Position;
  b: Position;
}

function Line(a: Position, b: Position): Line {
  return { a, b };
}

export default Line;

Line.len = (l: Line) => Vec.dist(l.a, l.b);

Line.directionVec = (l: Line) => Vec.normalize(Vec.sub(l.b, l.a));

// Returns intersection if the line segments overlap, or null if they don't
Line.intersect = (l1: Line, l2: Line): Position | null => {
  const { a: p1, b: p2 } = l1;
  const { a: q1, b: q2 } = l2;

  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = q2.x - q1.x;
  const dy2 = q2.y - q1.y;

  const determinant = dx1 * dy2 - dy1 * dx2;
  if (determinant === 0) {
    // The lines are parallel or coincident
    return null;
  }

  const dx3 = p1.x - q1.x;
  const dy3 = p1.y - q1.y;

  const t = (dx3 * dy2 - dy3 * dx2) / determinant;
  const u = (dx1 * dy3 - dy1 * dx3) / determinant;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    // The segments intersect at a point
    const intersectionX = p1.x + t * dx1;
    const intersectionY = p1.y + t * dy1;
    return { x: intersectionX, y: intersectionY };
  }

  // The segments do not intersect
  return null;
};

// Always returns intersection point even if the line segments don't overlap
Line.intersectAnywhere = (l1: Line, l2: Line): Position | null => {
  const { a: p1, b: p2 } = l1;
  const { a: q1, b: q2 } = l2;

  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = q2.x - q1.x;
  const dy2 = q2.y - q1.y;

  const determinant = dx1 * dy2 - dy1 * dx2;

  if (determinant === 0) {
    // The lines are parallel or coincident
    return null;
  }

  const dx3 = p1.x - q1.x;
  const dy3 = p1.y - q1.y;

  const t = (dx3 * dy2 - dy3 * dx2) / determinant;
  // Alex commented out this line b/c that variable was never used. Bug?
  // const u = (dx1 * dy3 - dy1 * dx3) / determinant;

  const intersectionX = p1.x + t * dx1;
  const intersectionY = p1.y + t * dy1; // should u be used here instead of t?

  return { x: intersectionX, y: intersectionY };
};

// Get point along slope
// TODO: make this work for vertical lines, too
Line.getYforX = (line: Line, x: number): number => {
  // Extract the coordinates of points a and b
  const { a, b } = line;
  const { x: x1, y: y1 } = a;
  const { x: x2, y: y2 } = b;

  // Calculate the slope of the line
  const slope = (y2 - y1) / (x2 - x1);

  // Calculate the y-coordinate for the given x-coordinate
  const y = slope * (x - x1) + y1;

  return y;
};

// Get point along slope
// TODO: make this work for vertical lines, too
Line.getXforY = (line: Line, y: number) => {
  // Extract the coordinates of points a and b
  const { a, b } = line;
  const { x: x1, y: y1 } = a;
  const { x: x2, y: y2 } = b;

  // Calculate the slope of the line
  const slope = (y2 - y1) / (x2 - x1);

  // Calculate the x-coordinate for the given y-coordinate
  const x = (y - y1) / slope + x1;

  return x;
};

Line.distToPoint = (line: Line, point: Position) =>
  Vec.dist(point, Line.closestPoint(line, point));

Line.closestPoint = (line: Line, point: Position, strict = true) => {
  const { a, b } = line;

  // Calculate vector AB and AP
  const AB = Vec.sub(b, a);
  const AP = Vec.sub(point, a);

  // Special case for when a === b, w/o which we get NaNs.
  if (isZero(AB.x) && isZero(AB.y)) {
    return a;
  }

  // Calculate the projection of AP onto AB
  const projection = Vec.dot(AP, AB) / Vec.dot(AB, AB);

  // Check if the projection is outside the line segment
  if (strict && projection <= 0) {
    return a;
  } else if (strict && projection >= 1) {
    return b;
  } else {
    return Vec.add(a, Vec.mulS(AB, projection));
  }
};

Line.spreadPointsAlong = (line: Line, n: number) => {
  const segLength = Line.len(line) / n;
  const offsetSeg = Vec.mulS(Line.directionVec(line), segLength);
  const points: Position[] = [];
  for (let i = 0; i < n; i++) {
    points.push(Vec.add(line.a, Vec.mulS(offsetSeg, i)));
  }
  return points;
};
