// Arc, defined by angles in radians

import { Position } from './types';
import Vec from './vec';

interface Arc {
  center: Position;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
}

function Arc(
  center: Position,
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise = true
): Arc {
  return { center, radius, startAngle, endAngle, clockwise };
}

export default Arc;

Arc.len = (arc: Arc) => {
  const { radius, startAngle, endAngle } = arc;

  // Calculate the arc length using the formula: arc length = radius * angle
  const length = radius * Math.abs(endAngle - startAngle);

  // Return the arc length
  return length;
};

// TODO: Position should be declared in lib, not /app/strokes/Point
interface Circle {
  center: Position;
  radius: number;
}

Arc.distToPointCircle = (circle: Circle, point: Position) => {
  const distance = Vec.dist(circle.center, point);
  return Math.abs(distance - circle.radius);
};

Arc.spreadPointsAlong = (arc: Arc, n: number) => {
  const points: Position[] = [];

  const innerAngle = Arc.directedInnerAngle(arc);
  const angleStep = innerAngle / (n - 1);

  for (let i = 0; i < n; i++) {
    const angle = arc.startAngle + angleStep * i;
    const offset = Vec(
      arc.radius * Math.cos(angle),
      arc.radius * Math.sin(angle)
    );
    points.push(Vec.add(arc.center, offset));
  }

  return points;
};

// Computes the inner angle moving in correct direction (positive if clockwise, negative if counter clockwise)
Arc.directedInnerAngle = (arc: Arc) => {
  const difference = arc.endAngle - arc.startAngle;
  if (arc.clockwise && difference < 0) {
    return 2 * Math.PI - Math.abs(difference);
  } else if (!arc.clockwise && difference > 0) {
    return -2 * Math.PI + Math.abs(difference);
  } else {
    return difference;
  }
};

Arc.points = (arc: Arc) => {
  console.log(arc);

  const start = Vec.add(arc.center, Vec.polar(arc.startAngle, arc.radius));
  const end = Vec.add(arc.center, Vec.polar(arc.endAngle, arc.radius));

  return { start, end };
};
