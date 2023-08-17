export default function Polygon(points){
    return points
}

// Ray intersection algorithm
Polygon.isPointInside = (polygon, point)=>{
  const x = point.x;
  const y = point.y;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) {
      isInside = !isInside;
    }
  }
  return isInside;
}