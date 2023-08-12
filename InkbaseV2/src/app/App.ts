import EveryFrame from "./EveryFrame"
import Events from "./NativeEvents"
import Page from "./Page"
import Selection from "./Selection"
import Snaps from "./Snaps"
import SVG from "./Svg"
import ToolPicker from "./ToolPicker"
import FormalTool from "./tools/FormalTool"
import FreehandTool from "./tools/FreehandTool"
import TextTool from "./tools/TextTool"

const svg = new SVG()
const page = new Page(svg)
const snaps = new Snaps(page)
const selection = new Selection(page, snaps)

const tools = [
  new FreehandTool(svg, 30, 30, page),
  new FormalTool(svg, 30, 80, page, snaps),
  new TextTool(svg, 30, 130, page),
]

const toolPicker = new ToolPicker(tools)

toolPicker.select(tools[0])

EveryFrame((dt: number, time: number) => {
  toolPicker.update(Events)
  toolPicker.selected?.update(Events)
  // morphing.update(Events);
  selection.update(Events)

  toolPicker.selected?.render(svg)
  snaps.render(svg)
  page.render(svg)

  Events.clear()
})
