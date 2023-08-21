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
import Bone from "./strokes/Bone";
import { lerp } from "../lib/math";

const root = document.querySelector("svg") as SVGSVGElement;

const events = new Events();
const svg = new SVG(root);
const page = new Page(svg);
const snaps = new Snaps(page);
const selection = new Selection(page, snaps);

const tools = [MoveTool, BoneTool, FreehandTool, CombTool, PullableTool];
const toolPicker = new ToolPicker(tools.map((t, i) => new t(svg, 30, 30 + 50 * i, page)));

let bone: Bone | undefined = undefined;
let i = 0;
for (i; i <= 1; i += 1 / 100) {
  let point = {
    x: lerp(i, 0, 1, 200, 600),
    y: lerp(i, 0, 1, 800, 400),
  };
  if (bone) {
    bone.target = Object.assign({}, point);
    bone.finish();
  }
  let position = Object.assign({}, point);
  let target = Object.assign({}, point);
  bone = page.addObject(new Bone(svg, position, target, bone));
}

let point = {
  x: lerp(i, 0, 1, 200, 600),
  y: lerp(Math.pow(i, 5), 0, 1, 800, 400),
};
if (bone) {
  bone.target = Object.assign({}, point);
  bone.finish();
}

EveryFrame((dt, time) => {
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update(events);
  events.clear();

  toolPicker.selected?.render(svg);
  snaps.render(svg);
  page.render(svg);
});
