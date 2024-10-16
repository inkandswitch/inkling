import Events, { Event, InputState } from "./NativeEvents"
import Page from "./Page"
import SVG from "./Svg"
import VarMover from "./VarMover"
import * as constraints from "./Constraints"
import { onEveryFrame } from "../lib/helpers"
import * as Input from "./Input"
import { root } from "./GameObject"
import MetaToggle from "./gui/MetaToggle"
import { endPerf, startPerf } from "./Perf"

const page = new Page()
root.adopt(page)
root.currentPage = page

const metaToggle = new MetaToggle()
root.adopt(metaToggle)

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events(metaToggle, (event: Event, state: InputState) => {
  Input.applyEvent({ event, state, events, root, page, metaToggle, pseudo: false, pseudoCount: 0, pseudoTouches: {} }); // prettier-ignore
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
