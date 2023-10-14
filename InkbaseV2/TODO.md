TODO
====

Bugs
----

* There are things that are still not working b/c of my big constraint system rewrite:
  * handles don't break off properly anymore
  * "free variables" not working yet

* 2 gizmos + formula: [2 (locked) * g1.angle = g2.angle]
  -- scrubbing g2.angle makes g1 move, but not the other way around
  -- same happens if you do it w/ distance

* 2 gizmos (a1, a2) and (b1, b2) that get snapped together (a1+b1, a2+b2)
  stay parallel even after we break the handles apart
  -- ... this also results in a huge number of constraints
  -- ... because sum()'s onClash is not implemented.

Formulas / Wires / Meta
-----------------------

* wire number tokens directly into formula editor's squares

* toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)

* "orange" numbers for results of spreadsheet formulas
  (opposite of locked number tokens: cannot be changed / scrubbed)

Constraints
-----------

* ... should only have weak refs to handles

* ... should be game objects?
