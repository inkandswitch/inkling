import EveryFrame from "./EveryFrame";
import Events from "./NativeEvents";
import Page from "./Page";
import Selection from "./Selection";
import Snaps from "./Snaps";
import SVG from "./Svg";
import ToolPicker from "./ToolPicker";
import FormalTool from "./tools/FormalTool";
import BoneTool from "./tools/BoneTool";
import MoveTool from "./tools/MoveTool";
import FreehandTool from "./tools/FreehandTool";
import CombTool from "./tools/CombTool";
import PullableTool from "./tools/PullableTool";
import YodaTool from "./tools/YodaTool";
import Bone from "./strokes/Bone";
import Dot from "./strokes/Dot";
import { lerp } from "../lib/math";

const events = new Events();
const svg = new SVG();
const page = new Page(svg);
const snaps = new Snaps(page);
const selection = new Selection(page, snaps);

const tools = [BoneTool, MoveTool, YodaTool, FreehandTool, CombTool, PullableTool];
const toolPicker = new ToolPicker(tools.map((t, i) => new t(svg, 30, 30 + 50 * i, page)));

let bone: Bone | undefined = undefined;

// let n = 10;
// let x = 600;
// let y = 400;
// let a = page.addObject(new Dot({ x, y }));
// for (let i = 1; i < n; i++) {
//   let pos = {
//     x: x + lerp(i, 0, n, 0, 300),
//     y: y + lerp(i, 0, n, 0, 0),
//   };
//   let b = page.addObject(new Dot(pos));
//   page.addObject(new Bone(a, b));
//   a = b;
// }

EveryFrame((dt, time) => {
  SVG.clearNow();
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update(events);
  events.clear();

  toolPicker.selected?.render(svg);
  snaps.render(svg);
  page.render(svg);
});
