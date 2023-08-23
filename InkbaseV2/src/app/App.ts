import EveryFrame from './EveryFrame';
import Events from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import FreehandSelection from './FreehandSelection';
import Snaps from './Snaps';
import SVG from './Svg';
import ToolPicker from './ToolPicker';
import Handle from './strokes/Handle';
import FormalTool from './tools/FormalTool';
import FreehandTool from './tools/FreehandTool';
import { runConstraintSolver } from './constraints';

const RUN_CONSTRAINT_SOLVER = false;

const events = new Events();
const page = new Page();
const snaps = new Snaps(page);

const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);

const toolPicker = new ToolPicker([
  new FreehandTool(30, 30, page),
  new FormalTool(30, 80, page, snaps),
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
