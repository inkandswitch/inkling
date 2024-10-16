import { forDebugging } from "../lib/helpers"
import { deserialize } from "./Deserialize"
import { Root } from "./Root"

// TODO: This needs to be updated when we load serialized state
export let root: Root

export function initialize() {
  // root = deserialize({
  //   type: "Root",
  //   children: [{ type: "MetaToggle" }]
  // })

  root = deserialize(
    JSON.parse(
      '{"type":"Root","children":[{"type":"MetaToggle","position":{"x":30,"y":30}},{"type":"StrokeGroup","children":[{"type":"Stroke","points":[{"x":300,"y":250},{"x":350,"y":400}]},{"type":"Handle","id":0,"position":{"x":300,"y":300}},{"type":"Handle","id":3,"position":{"x":300,"y":400}}]}]}'
    )
  ) as Root
  forDebugging("root", root)
}

// TODO: This needs to be updated when we load serialized state
let nextId = 0
export function generateId() {
  return nextId++
}
