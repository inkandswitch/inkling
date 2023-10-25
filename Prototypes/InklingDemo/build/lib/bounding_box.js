export function boundingBoxFromStrokes(strokes) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const pt of stroke) {
      if (pt.x < minX) {
        minX = pt.x;
      }
      if (pt.x > maxX) {
        maxX = pt.x;
      }
      if (pt.y < minY) {
        minY = pt.y;
      }
      if (pt.y > maxY) {
        maxY = pt.y;
      }
    }
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}
