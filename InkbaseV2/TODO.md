# TODO

## UX Improvements

- P0: erase gesture in concrete mode shouldn't erase (invisible!) meta stuff
  ... like formulas, number tokens, etc.
  (Ivan)

- P1: erase gesture in meta mode _maybe_ shouldn't erase concrete strokes
  (Ivan)

- P1: when erasing inside a formula, call a different method (not remove)
  (Marcel)

- P2: tokens snap to each other, and can be moved together w/ a single finger
  (e.g., two number tokens, or a number token right next to a property picker)
  (Marcel)

- P2: more fluid gesture to get a wire out of a property picker:
  ATM you have to first pick a property (w/ tap) then drag out the wire.
  We should be able to do this in a single gesture.
  (Marcel)

- P4: in meta mode, should you be able to break apart ink handles?

- P1292: When using KB+M, a way to put a finger down and leave it there (and remove it later)

## Bugs

- P1/2: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

## Formulas / Wires / Meta

- P2/3: using / in formulas causes gradient errors
  More generally, need to fix unsatisfiable formula constraints
  (Alex)

- P2/3: "orange" numbers for results of spreadsheet formulas
  (this info needs to be in Variable so Tokens can render...)
  (opposite of locked number tokens: cannot be changed / scrubbed)
  (Alex)

- P2/3: tweaks to property picker token design
  (Ivan)

- P3/4: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)
  (Alex)

## Constraints

- P2: Should we make it impossible to have both handles in a stroke group or gizmo absorb one another?

- P2/3: consider unlocking a locked variable instead of pausing a constraint
  when solver gives up -- this would be easier to understand since
  the variables' locked/unlocked state is always shown on the canvas.
  (As opposed to, say, pausing a PolarVector constraint which leaves
  the Gizmo that owns it looking like a functional Gizmo when it isn't.)
  (Alex)

- P4: constraints should only have weak refs to handles

## Clean-up
