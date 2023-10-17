# TODO

## UX Improvements

- P0: GameObjects that are more likely to get touch events should render after
  other game objects. (It should never look like you're dragging an object that
  is under another object.)

- P0: only render canonical handles

- P2: make handles "blobby"
  (Ivan)

## Bugs

- P1: in concrete mode, you shouldn't be able to break apart gizmo handles.
  (Alex)

- P4: in meta mode, you shouldn't be able to break apart ink handles?
  (decide if we want this)

- P0: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P0: sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.
  (e.g., wiring from number token in formula to number token outside formula)
  (solution may be to change recursive = false ==> recursive = true)
  (Ivan)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

## Hand-Drawn Strokes

- P0: gestures to show/hide handles to a stroke
  (Ivan)

- P3/4: merging stroke groups (lasso?)

## Formulas / Wires / Meta

- P0: some gesture to break connections / remove wires, and formulas
  (Ivan -> Alex + Marcel)

- P1: wire anything into anything, silly billy!
  need a way to make it clear that you're _not_ wiring
  (related to seed creation)
  (Marcel)

- P1: wire number tokens directly into formula editor's squares
  (Marcel)

- P2: pause / temporarily break a wire

- P3/4: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)
  (Alex)

- P1.5: "orange" numbers for results of spreadsheet formulas
  (opposite of locked number tokens: cannot be changed / scrubbed)
  (Alex)

## Constraints

- P0: when over-constrained, automatically pause the last constraint added
  (Alex)

- P0: pin constraint: gesture to add/remove + rendering
  (Ivan)

- P1: when breaking apart handles, the non-dragged one rubber-bands
  (Ivan)

- P4: constraints should only have weak refs to handles

## Clean-up
