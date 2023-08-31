TODO
====

Constraints
-----------

* Solve "gradient fails" problem
  - absorb uncmin + gradient code
  - change threshold of 20 iterations to compute gradient
    (try 1000?)
  - if that doesn't work, try just using the gradient
    as it is when the iteration budget runs out
  - if that doesn't work, try breaking off some
    handles (randomly?) and seeing if we can find a solution
    (could be done in parallel in web workers, but save
    that for later)

* Can we make everything out of length constraints?
  (Like angle constraints?)

* (Variable | Constraint).remove()
  - on variable, should remove all associated constraints, too.
  - what about on a constraint? need to ref. count variables?

* Formula constraints + scribble

* Add visualizations for the constraints
