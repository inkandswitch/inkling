import Events from "./NativeEvents.js";
import Page from "./Page.js";
import Snaps from "./Snaps.js";
import Selection from "./Selection.js";
import FreehandSelection from "./FreehandSelection.js";
import ToolPicker from "./ToolPicker.js";
import FreehandTool from "./tools/FreehandTool.js";
import FormalTool from "./tools/FormalTool.js";
import ColorTool from "./tools/ColorTool.js";
import Tool from "./tools/Tool.js";
import ConstraintTool from "./tools/ConstraintTool.js";
import SVG from "./Svg.js";
import Handle from "./strokes/Handle.js";
import Stroke from "./strokes/Stroke.js";
import * as constraints from "./constraints.js";
import {onEveryFrame} from "../lib/helpers.js";
import Gizmo from "./Gizmo.js";
const events = new Events();
const page = new Page({strokeAnalyzer: false});
const snaps = new Snaps(page, {handleSnaps: true, alignmentSnaps: false});
const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);
const gizmo = new Gizmo(page, selection, false);
const toolPicker = new ToolPicker([
  new FreehandTool("FREE", 30, 30, page),
  new FormalTool("FORM", 30, 80, page, snaps),
  new ColorTool("COLOR", 30, 130, page),
  new Tool("\u{1F9E0}", 30, 180, page, Stroke),
  new ConstraintTool("CONST", 30, 230, page, {
    vertical: true,
    horizontal: true,
    distance: true,
    angle: true
  })
]);
onEveryFrame((dt, t) => {
  SVG.clearNow(t);
  constraints.now.clear();
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update1(events);
  gizmo.update(events);
  selection.update2(events);
  freehandSelection.update(events);
  events.clear();
  for (const handle of selection.handles) {
    constraints.now.pin(handle);
  }
  constraints.solve();
  toolPicker.selected?.render();
  snaps.render();
  page.render();
  for (const handle of Handle.all) {
    handle.render();
  }
  gizmo.render(dt, t);
});
