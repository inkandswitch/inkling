TODO
====

Bugs
----

* There are things that are still not working b/c of my big constraint system rewrite:
  * Handle break off is not quite right yet
    (can't do it directionally w/ intent, you get what you get)
  * "free variables" not quite right yet
    (we have some "inertia" w/ angles b/c of the LR between radians and degrees)

* 2 gizmos (a1, a2) and (b1, b2) that get snapped together (a1+b1, a2+b2)
  collapse to have distance = 0. why???

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
