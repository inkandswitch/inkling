import Events, { Event, InputState } from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
// import Selection from './Selection';
// import FreehandSelection from './FreehandSelection';
// import ToolPicker from './ToolPicker';
// import FreehandTool from './tools/FreehandTool';
// import FormalTool from './tools/FormalTool';
// import ColorTool from './tools/ColorTool';
// import Tool from './tools/Tool';
// import ConstraintTool from './tools/ConstraintTool';
import SVG from './Svg';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import Gizmo from './Gizmo';
import { applyEvent } from './Input';
import { root } from './GameObject';
import FormulaEditor from './meta/FormulaEditor';
import Pencil from './tools/Pencil';
import FormulaParser from './meta/FormulaParser';
// import '../lib/spreadsheet';

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  applyEvent(event, state, events, page, pencil, formulaEditor);
});

const page = new Page({ strokeAnalyzer: false });
root.adopt(page);
root.currentPage = page;

const snaps = new Snaps({ handleSnaps: true, alignmentSnaps: false });
root.adopt(snaps);

// const selection = new Selection(page, snaps);
// const freehandSelection = new FreehandSelection(page);

const gizmo = new Gizmo(page, false);

const pencil = new Pencil();
root.adopt(pencil);

// FORMULA STUFF
const formulaEditor = new FormulaEditor();
root.adopt(formulaEditor);

const formulaParser = new FormulaParser(page);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).formulaParser = formulaParser;

onEveryFrame((dt, t) => {
  SVG.clearNow(t);
  constraints.now.clear();

  // Potentially deprecated — consider whether & how these should be migrated to Input.ts
  // toolPicker.update(events);
  // toolPicker.selected?.update(events);
  // selection.update1(events);
  gizmo.update(events);
  // selection.update2(events);
  // freehandSelection.update(events);

  // Tell NativeEvent to handle all events sent from Swift, evaluating Input for each
  events.update();

  constraints.solve();

  // render everything
  root.render(dt, t);

  // Ivan is currently using this to debug Input — he'll remove it soon
  // SVG.now('foreignObject', {
  //   x: 50,
  //   y: 50,
  //   width: 1000,
  //   height: 1000,
  //   content: JSON.stringify({
  //     pencil: events.pencilState,
  //     fingers: events.fingerStates,
  //   }),
  // });
});
