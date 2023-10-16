# TODO

## Bugs

- P0: sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.

- P1: when you snap two gizmos together, all handles collapse to a single position
  (this was working before, but started happening again when I fixed the free variable computation)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.

## Formulas / Wires / Meta

- P0: gesture to add handles to a stroke / stroke group

- P0: make sure that stroke group's rendering actually updates when its handles move

- P0: some gesture to break connections / remove wires

- P0: some gesture to remove a formula

- P1: wire number tokens directly into formula editor's squares

- P1: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)

- P2: "orange" numbers for results of spreadsheet formulas
  (opposite of locked number tokens: cannot be changed / scrubbed)

## Constraints

- P3: When snapping handles, only the handle being dragged should move. The other handle should stay where it was.

- P4: ... should only have weak refs to handles

- P4: ... should be game objects?
