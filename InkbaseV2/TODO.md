# TODO

## UX Improvements

- P1: tokens snap to each other, and can be moved together w/ a single finger
  (e.g., two number tokens, or a number token right next to a property picker)
  (Marcel)

- P1: more fluid gesture to get a wire out of a property picker:
  ATM you have to first pick a property (w/ tap) then drag out the wire.
  We should be able to do this in a single gesture.
  (Marcel)

- P4: in meta mode, should you be able to break apart ink handles?

## Bugs

- P0: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P0: sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.
  (e.g., wiring from number token in formula to number token outside formula)
  (solution may be to change recursive = false ==> recursive = true)
  (Marcel)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

## Hand-Drawn Strokes

- P0: gestures to show/hide handles to a stroke
  (Ivan)

- P3/4: merging stroke groups (lasso?)

## Formulas / Wires / Meta

- P1: improve Erase gesture to handle all types of objects
  (Ivan + Alex + Marcel)

- P1: tweaks to property picker token design
  (Ivan)

- P1: number/formula editor must be "accepted" before change takes effect
  (Marcel)

- P1: wire anything into anything, silly billy!
  need a way to make it clear that you're _not_ wiring
  (related to seed creation)
  (Marcel)

- P1: wire number tokens directly into formula editor's squares
  (Marcel)

- P1.5: "orange" numbers for results of spreadsheet formulas
  (opposite of locked number tokens: cannot be changed / scrubbed)
  (Alex)

- P2: pause / temporarily break a wire

- P3/4: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)
  (Alex)

## Constraints

- P1: consider unlocking a locked variable instead of pausing a constraint
  when solver gives up -- this would be easier to understand since
  the variables' locked/unlocked state is always shown on the canvas.
  (As opposed to, say, pausing a PolarVector constraint which leaves
  the Gizmo that owns it looking like a functional Gizmo when it isn't.)
  (Alex)

- P1: hack to avoid shrinking gizmo when scrubbing angle
  (Alex)

- P4: constraints should only have weak refs to handles

## Clean-up
