# TODO

## UX Improvements

- P0: a better gesture to break apart handles
  they keep coming apart accidentally, and the more complex the model is,
  the more disruptive it is when that happens!

- P1: formula parser can handle "= numberTokenRef"
  (Alex)

- P1: make it harder to erase formula editor
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

## Bugs

- P1: create a gizmo, pull out distance, lock it. pin one handle.
  then move other handle, distance changes permanently. shouldn't!
  (Alex)

- P1: remove method for PropertyPickerEditor (should remove whole thing)
  (Ivan)

- P1/2: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

## Hand-Drawn Strokes

- P3/4: merging stroke groups (lasso?)

## Formulas / Wires / Meta

- P2: "orange" numbers for results of spreadsheet formulas
  (this info needs to be in Variable so Tokens can render...)
  (opposite of locked number tokens: cannot be changed / scrubbed)
  (Alex)

- P2/3: tweaks to property picker token design
  (Ivan)

- P3/4: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)
  (Alex)

## Constraints

- P1: hack to avoid shrinking gizmo when scrubbing angle
  (Alex)

- P2/3: consider unlocking a locked variable instead of pausing a constraint
  when solver gives up -- this would be easier to understand since
  the variables' locked/unlocked state is always shown on the canvas.
  (As opposed to, say, pausing a PolarVector constraint which leaves
  the Gizmo that owns it looking like a functional Gizmo when it isn't.)
  (Alex)

- P4: constraints should only have weak refs to handles

## Clean-up
