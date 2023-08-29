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
import { lerp } from "../lib/math";

const events = new Events();
const svg = new SVG();
const page = new Page(svg);
const snaps = new Snaps(page);
const selection = new Selection(page, snaps);

const tools = [MoveTool, BoneTool, YodaTool, FreehandTool, CombTool, PullableTool];
const toolPicker = new ToolPicker(tools.map((t, i) => new t(svg, 30, 30 + 50 * i, page)));

let bone: Bone | undefined = undefined;
let n = 10;
for (let i = 0; i < n; i++) {
  let point = {
    x: lerp(i, 0, n, 600, 1000),
    y: lerp(i, 0, n, 400, 400),
  };
  if (bone) {
    bone.target = Object.assign({}, point);
    bone.finish();
  }
  let position = Object.assign({}, point);
  let target = Object.assign({}, point);
  bone = page.addObject(new Bone(svg, position, target, bone));
}
if (bone) {
  bone.target = { x: 1000, y: 400 };
  bone.finish();
}

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
