# TODO

## Bugs

- P0: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P0: sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.
  (Ivan)

- P2/3: when you snap two gizmos together, all handles collapse to a single position -- this only
  happens in one direction, and it's fine if you do it in the other direction
  Update: this happens b/c we try to make the angles equal, but they may be 180 degrees apart!
  I ran into the same problem when I tried to make the parallelogram demo (which works great
  when we avoid this problem).
  (Alex)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

## Hand-Drawn Strokes

- P0: gestures to show/hide handles to a stroke
  (Ivan)

- P0: make sure that stroke group's rendering actually updates when its handles move
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

- P0: gesture to cycle through gizmo locks
  (Ivan)

- P0: pin constraint: gesture to add/remove + rendering
  (Ivan)

- P4: constraints should only have weak refs to handles

## Clean-up
