import EveryFrame from './EveryFrame';
import Events from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import FreehandSelection from './FreehandSelection';
import Snaps from './Snaps';
import SVG from './Svg';
import ToolPicker from './ToolPicker';
import Handle from './strokes/Handle';
import Tool from './tools/Tool';
import ColorTool from './tools/ColorTool';
import Stroke from './strokes/Stroke';
import FormalTool from './tools/FormalTool';
import FreehandTool from './tools/FreehandTool';
import { runConstraintSolver } from './constraints';
import { ConstraintTool } from './tools/ConstraintTool';

const RUN_CONSTRAINT_SOLVER = false;

const events = new Events();
const page = new Page();
const snaps = new Snaps(page);

const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);

const toolPicker = new ToolPicker([
  new FreehandTool('FREE', 30, 30, page),
  new FormalTool('FORM', 30, 80, page, snaps),
  new ColorTool('COLOR', 30, 130, page),
  new Tool('🧠', 30, 180, page, Stroke),
  new ConstraintTool('CONST', 30, 230, page),
]);

EveryFrame(() => {
  SVG.clearNow();

  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update(events);
  freehandSelection.update(events);

  events.clear();

  if (RUN_CONSTRAINT_SOLVER) {
    runConstraintSolver(selection);
  }

  toolPicker.selected?.render();
  snaps.render();
  page.render();

  for (const handle of Handle.all) {
    handle.render();
  }
});
