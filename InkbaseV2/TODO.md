TODO
====

Bugs
----

* when you snap two gizmos together, all handles collapse to a single position
  (this was working before, but started happening again when I fixed the free variable computation) 

* sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.

Formulas / Wires / Meta
-----------------------

* P0: some gesture to break connections / remove wires

* P0: some gesture to remove a formula

* wire number tokens directly into formula editor's squares

* toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)

* "orange" numbers for results of spreadsheet formulas
  (opposite of locked number tokens: cannot be changed / scrubbed)

Constraints
-----------

* ... should only have weak refs to handles

* ... should be game objects?
