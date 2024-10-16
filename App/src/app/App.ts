import { onEveryFrame } from "../lib/helpers"
import * as constraints from "./Constraints"
import { initialize, root } from "./Core"
import * as Input from "./Input"
import Events, { Event, InputState } from "./NativeEvents"
import { endPerf, startPerf } from "./Perf"
import SVG from "./Svg"
import VarMover from "./VarMover"

initialize()

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  Input.applyEvent({ event, state, events, root, pseudo: false, pseudoCount: 0, pseudoTouches: {} }); // prettier-ignore
})

onEveryFrame((dt, t) => {
  startPerf()
  SVG.clearNow(t)
  events.update()
  VarMover.update(dt, t)
  constraints.solve(root)
  root.render(dt, t)
  Input.render()
  endPerf()
})
