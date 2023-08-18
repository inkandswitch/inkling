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
import minimize from '../lib/minimize';

const root = document.querySelector('svg') as SVGSVGElement;

const events = new Events();
const svg = new SVG(root);
const page = new Page(svg);
const snaps = new Snaps(page);

const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);

const tools = [
  new FreehandTool(svg, 30, 30, page),
  new FormalTool(svg, 30, 80, page, snaps),
];

const toolPicker = new ToolPicker(tools);

EveryFrame(() => {
  runConstraintSolver();

  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update(events);
  freehandSelection.update(events);

  events.clear();

  toolPicker.selected?.render(svg);
  snaps.render(svg);
  page.render(svg);

  for (const handle of Handle.all) {
    handle.render();
  }
});

function runConstraintSolver() {
  // if (Handle.all.size < 2) {
  //   return;
  // }
  // const [h1, h2] = Array.from(Handle.all);
  // let { x: h1x, y: h1y } = h1.position;
  // let { x: h2x, y: h2y } = h2.position;
  // const inputs = [h1x, h1y, h2x, h2y];
  // const outputs = minimize(
  //   ([h1x, h1y, h2x, h2y]) => Math.abs(h1x - h2y),
  //   inputs
  // ).solution;
  // [h1x, h1y, h2x, h2y] = outputs;
  // h1.position = { x: h1x, y: h1y };
  // h2.position = { x: h2x, y: h2y };
}
