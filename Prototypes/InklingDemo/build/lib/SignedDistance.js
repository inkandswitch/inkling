export function signedDistanceToBox(xA, yA, widthA, heightA, xB, yB) {
  const halfWidthA = widthA / 2;
  const halfHeightA = heightA / 2;
  const centerXA = xA + halfWidthA;
  const centerYA = yA + halfHeightA;
  const dx = xB - centerXA;
  const dy = yB - centerYA;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const distX = Math.max(absDx - halfWidthA, 0);
  const distY = Math.max(absDy - halfHeightA, 0);
  const signedDistance = Math.sqrt(distX * distX + distY * distY);
  if (dx < -halfWidthA) {
    return signedDistance;
  } else if (dx > halfWidthA) {
    return signedDistance;
  } else if (dy < -halfHeightA) {
    return signedDistance;
  } else if (dy > halfHeightA) {
    return signedDistance;
  } else {
    return -signedDistance;
  }
}
