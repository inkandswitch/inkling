// TODO: Move this to lib

export function signedDistanceToBox(xA: number, yA: number, widthA: number, heightA: number, xB: number, yB: number): number {
  // Calculate the half dimensions of the box A
  const halfWidthA = widthA / 2;
  const halfHeightA = heightA / 2;

  // Calculate the center of the box A
  const centerXA = xA + halfWidthA;
  const centerYA = yA + halfHeightA;

  // Calculate the difference vector between the centers of A and B
  const dx = xB - centerXA;
  const dy = yB - centerYA;

  // Calculate the absolute difference between the centers
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Calculate the distances along the x and y axes
  const distX = Math.max(absDx - halfWidthA, 0);
  const distY = Math.max(absDy - halfHeightA, 0);

  // Calculate the signed distance
  const signedDistance = Math.sqrt(distX * distX + distY * distY);

  // Determine the sign of the distance based on the relative position of B to A
  if (dx < -halfWidthA) {
    return signedDistance; // B is to the left of A
  } else if (dx > halfWidthA) {
    return signedDistance; // B is to the right of A
  } else if (dy < -halfHeightA) {
    return signedDistance; // B is above A
  } else if (dy > halfHeightA) {
    return signedDistance; // B is below A
  } else {
    return -signedDistance; // B is inside A
  }
}