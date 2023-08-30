export default {
  // PHYSICS

  iterations: 100,

  // YODA TOOL
  yodaAttachDist: 12,

  // BONE TOOL

  dotSpacing: 5,

  boneIntersection: true,
  intersectionSpacing: 50,

  attachStartToExistingDot: false,
  attachEndToExistingDot: false, // This might not play nicely with boneIntersection
  attachDist: 20,

  lockStartDot: true,
  lockEndDot: true,

  tug: false, // Recommend using lockStartDot

  // MOVE TOOL

  lockedRadiusPencil: 15,
  unlockedRadiusPencil: 5,
  lockedRadiusFinger: 75,
  unlockedRadiusFinger: 25,

  lockOnMove: true,
  toggleLockOnTap: true,
  unlockOnMoveEnd: false,

  // DOT

  lockedSize: 1.2,
  showDebugWedges: false, // Recommend using high dotSpacing

  // BONE

  lengthMultiple: 1,

  thinWhenStretched: true,
  boneWidth: 2,
};
