TODO
====

Bugs:
* jumping handles (when you snap handles of two different gizmos, they jump)
* 2 gizmos (a1, a2) and (b1, b2) that get snapped together (a1+b1, a2+b2)
  stay parallel even after we break the handles apart
* scrubbing connected "angle-radians" properties of 2 gizmos is slow /
  resists change (doesn't happen w/ "angle-degrees")

Constraints
-----------

* ... should only have weak refs to handles
* ... should be game objects?

