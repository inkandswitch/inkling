TODO
====

* Figure out how to make Handle <: GameObject
  -- Are handles children of other game objects (e.g., strokes)
     ( good for GC: when object goes away, its handles also go away)
     ... or are they direct children of the page or root game object,
     and weakly-referenced by the game objects that own them?
  -- Are absorbed handles children of their canonical handle?
     (good for rendering, maybe)

Constraints
-----------
