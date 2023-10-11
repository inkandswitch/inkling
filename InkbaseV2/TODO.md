TODO
====

Bugs:
* 2 gizmos + formula: [2 (locked) * g1.angleDegrees = g2.angleDegrees]
  -- scrubbing g2.angleDegrees makes g1 move, but not the other way around
* 2 gizmos (a1, a2) and (b1, b2) that get snapped together (a1+b1, a2+b2)
  stay parallel even after we break the handles apart
  -- ... this also results in a huge number of constraints
  -- ... because sum()'s onClash is not implemented.
* scrubbing connected "angle-radians" properties of 2 gizmos is slow /
  resists change (doesn't happen w/ "angle-degrees")

Constraints
-----------

* ... should only have weak refs to handles
* ... should be game objects?

