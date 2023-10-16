# TODO

## Bugs

- P0: make handles big and translucent
  (Ivan)

- P0: drawing new gizmo out from a handle makes connection to canonical handle... can't be broken
  (Alex + Ivan)

- P0: sometimes connecting two number tokens w/ a wire doesn't work -- the wire is there, but their
  values aren't the same. seems to be dependent on direction / connection order.
  (Ivan)

- P2/3: when you snap two gizmos together, all handles collapse to a single position -- this only
  happens in one direction, and it's fine if you do it in the other direction
  (Alex)

- P1: when you drop a handle "on top" of another, the other handle shouldn't move
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

- P0: locked formula cells aren't rendering as locked
  (Ivan)

- P0: 1st cell in formula has wrong width and shows up as blank
  (Ivan)

- P0: some gesture to break connections / remove wires, and formulas
  (Ivan -> Alex + Marcel)

- P1: wire anything into anything, silly billy!
  need a way to make it clear that you're *not* wiring
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

- P0: propagation of known values for Angle and Distance
  if we know both handle positions, we should know angle and distance, even if those are already know (should override)
  (Alex)

- P2: When snapping handles, only the handle being dragged should move. The other handle should stay where it was.
  (Alex)

- P4: constraints should only have weak refs to handles

## Clean-up

- P3: remove handle listeners
  (Alex)
