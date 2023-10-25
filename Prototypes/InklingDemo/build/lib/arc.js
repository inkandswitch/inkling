import Vec from "./vec.js";
function Arc(center, radius, startAngle, endAngle, clockwise = true) {
  return {center, radius, startAngle, endAngle, clockwise};
}
export default Arc;
Arc.len = (arc) => {
  const {radius, startAngle, endAngle} = arc;
  const length = radius * Math.abs(endAngle - startAngle);
  return length;
};
Arc.distToPointCircle = (circle, point) => {
  const distance = Vec.dist(circle.center, point);
  return Math.abs(distance - circle.radius);
};
Arc.spreadPointsAlong = (arc, n) => {
  const points = [];
  const innerAngle = Arc.directedInnerAngle(arc);
  const angleStep = innerAngle / (n - 1);
  for (let i = 0; i < n; i++) {
    const angle = arc.startAngle + angleStep * i;
    const offset = Vec(arc.radius * Math.cos(angle), arc.radius * Math.sin(angle));
    points.push(Vec.add(arc.center, offset));
  }
  return points;
};
Arc.directedInnerAngle = (arc) => {
  const difference = arc.endAngle - arc.startAngle;
  if (arc.clockwise && difference < 0) {
    return 2 * Math.PI - Math.abs(difference);
  } else if (!arc.clockwise && difference > 0) {
    return -2 * Math.PI + Math.abs(difference);
  } else {
    return difference;
  }
};
Arc.points = (arc) => {
  console.log(arc);
  const start = Vec.add(arc.center, Vec.polar(arc.startAngle, arc.radius));
  const end = Vec.add(arc.center, Vec.polar(arc.endAngle, arc.radius));
  return {start, end};
};
