TODO
====

Bugs
----

* There are things that are still not working b/c of my big constraint system rewrite:
  * "free variables" not quite right yet
    (we have some "inertia" w/ angles b/c of the LR between radians and degrees)

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
