import EveryFrame from "./EveryFrame";
import Events from "./NativeEvents";
import Page from "./Page";
import Selection from "./Selection";
import Snaps from "./Snaps";
import SVG from "./Svg";
import ToolPicker from "./ToolPicker";
import FormalTool from "./tools/FormalTool";
import FreehandTool from "./tools/FreehandTool";

const root = document.querySelector("svg") as SVGSVGElement;

const events = new Events();
const svg = new SVG(root);
const page = new Page(svg);
const snaps = new Snaps(page);
const selection = new Selection(page, snaps);

const tools = [new FreehandTool(svg, 30, 30, page), new FormalTool(svg, 30, 80, page, snaps)];

const toolPicker = new ToolPicker(tools);

EveryFrame(() => {
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  // morphing.update(events);
  selection.update(events);
  events.clear();

  toolPicker.selected?.render(svg);
  snaps.render(svg);
  page.render(svg);
});
