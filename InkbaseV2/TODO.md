# TODO

## UX Improvements

- P0: a better gesture to break apart handles
  they keep coming apart accidentally, and the more complex the model is,
  the more disruptive it is when that happens!

- P0: pesudo-grag handle to reposition it wrt stroke
  (Ivan)

- P1: gesture to erase a character in the formula editor
  ... just the strokes, not the space
  (Marcel)

- P1: don't let formula editor close if parse fails
  (Marcel)

- P1: debug visual for scene graph
  (Ivan)

- P1: tokens snap to each other, and can be moved together w/ a single finger
  (e.g., two number tokens, or a number token right next to a property picker)
  (Marcel)

- P1: more fluid gesture to get a wire out of a property picker:
  ATM you have to first pick a property (w/ tap) then drag out the wire.
  We should be able to do this in a single gesture.
  (Marcel)

- P4: in meta mode, should you be able to break apart ink handles?

## Bugs

- P0: toggle gizmo a few times and you'll see that it spins a bit, then
  collapses on itself.
  (Alex)

- P0: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P0: sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.
  (e.g., wiring from number token in formula to number token outside formula)
  (solution may be to change recursive = false ==> recursive = true)
  (need a way to make it clear that you're _not_ wiring)
  (related to seed creation)
  (Marcel)

- P1: remove method for PropertyPickerEditor (should remove whole thing)
  (Ivan)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

## Hand-Drawn Strokes

- P3/4: merging stroke groups (lasso?)

## Formulas / Wires / Meta

- P1: tweaks to property picker token design
  (Ivan)

- P1: wire number tokens directly into formula editor's squares
  (Marcel)

- P2: "orange" numbers for results of spreadsheet formulas
  (this info needs to be in Variable so Tokens can render...)
  (opposite of locked number tokens: cannot be changed / scrubbed)
  (Alex)

- P3/4: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)
  (Alex)

## Constraints

- P1: hack to avoid shrinking gizmo when scrubbing angle
  (Alex)

- P2: consider unlocking a locked variable instead of pausing a constraint
  when solver gives up -- this would be easier to understand since
  the variables' locked/unlocked state is always shown on the canvas.
  (As opposed to, say, pausing a PolarVector constraint which leaves
  the Gizmo that owns it looking like a functional Gizmo when it isn't.)
  (Alex)

- P4: constraints should only have weak refs to handles

## Clean-up
