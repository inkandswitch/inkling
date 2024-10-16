import { forDebugging, onEveryFrame } from "../lib/helpers"
import * as constraints from "./Constraints"
import * as Input from "./Input"
import Events, { Event, InputState } from "./NativeEvents"
import { endPerf, startPerf } from "./Perf"
import { Root } from "./Root"
import SVG from "./Svg"
import VarMover from "./VarMover"

export function initialize() {
  Root.deserialize({
    type: "Root",
    variables: [],
    children: [{ type: "MetaToggle", position: { x: 30, y: 30 } }],
    constraints: [],
    nextId: 100
  })

  // root = deserialize(
  //   JSON.parse(
  //     '{"type":"Root","children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"StrokeGroup","children":[{"type":"Stroke","points":[{"x":300,"y":250},{"x":350,"y":400}]},{"type":"Handle","id":0,"position":{"x":300,"y":300}},{"type":"Handle","id":3,"position":{"x":300,"y":400}}]}]}'
  //   )
  // ) as Root
  forDebugging("root", Root.current)
}

initialize()

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  Input.applyEvent({ event, state, events, root: Root.current, pseudo: false, pseudoCount: 0, pseudoTouches: {} }); // prettier-ignore
})

onEveryFrame((dt, t) => {
  startPerf()
  SVG.clearNow(t)
  events.update()
  VarMover.update(dt, t)
  constraints.solve(Root.current)
  Root.current.render(dt, t)
  Input.render()
  endPerf()
})
