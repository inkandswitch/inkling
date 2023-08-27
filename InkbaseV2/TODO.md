TODO
====

Constraints
-----------

* Think about VariableEqualsConstraint and "keys" /
  variable de-duping. It's not quite right b/c of the offsets,
  and I need to get that right before angles will work.

* Can we keep unconstrained variables from affecting the
  behavior of a constraint?
  - E.g., if we have a length constraint w/ an unconstrained
    variable for the length, can we run the solver in such
    a way that it won't resist manipulations and act more like
    a read-out?

* Add visualizations for the constraints

* Give uncmin-based constraints a workout
  - diagram of the pythagorean theorem
    (does the order in which you draw the lines matter?)
  - formula constraints + scribble
