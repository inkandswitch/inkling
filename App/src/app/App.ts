import Events, { Event, InputState } from "./NativeEvents"
import Page from "./Page"
import SVG from "./Svg"
import VarMover from "./VarMover"
import * as constraints from "./constraints"
import { onEveryFrame } from "../lib/helpers"
import * as Input from "./Input"
import { root } from "./GameObject"
import MetaToggle from "./gui/MetaToggle"
import Toolbar from "./gui/Toolbar"

const page = new Page()
root.adopt(page)
root.currentPage = page

const metaToggle = new MetaToggle()
root.adopt(metaToggle)

const toolbar = new Toolbar()
root.adopt(toolbar)

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events(metaToggle, (event: Event, state: InputState) => {
  Input.applyEvent({ event, state, events, root, page, metaToggle, pseudo: false, pseudoCount: 0, pseudoTouches: {} }); // prettier-ignore
})

onEveryFrame((dt, t) => {
  SVG.clearNow(t)

  events.update()
  VarMover.update(dt, t)
  constraints.solve(root)
  root.render(dt, t)
  Input.render()
})
