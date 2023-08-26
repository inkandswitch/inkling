TODO
====

Constraints
-----------

* Numerical gradient sometimes fails, even w/o angle constraints.
  - Try using VariableEquals to eliminate variables
    (if a=b=c, we only need one of them to go to the solver,
    it's like we should rewrite the constraints...)
  - Unconstrained variables could be optimized away, too
    (just need to compute their value at the end)
  - Speaking of which, can have a post-solver
    "propagate knowns" step where we compute things
    whose values are determined from the solution
    that came out of the solver.

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
