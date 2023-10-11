import Events, { Event, InputState } from './NativeEvents';
import Page from './Page';
import SVG from './Svg';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import Gizmo from './meta/Gizmo';
import { applyEvent } from './Input';
import { root } from './GameObject';
import FormulaEditor from './meta/FormulaEditor';
import Pencil from './ink/Pencil';
import FormulaParser from './meta/FormulaParser';
import MetaToggle from './gui/MetaToggle';
import Component from './meta/Component';
import LabelToken from './meta/LabelToken';
// import NumberToken from './meta/NumberToken';
// import Wire from './meta/Wire';
// import PropertyPicker from './meta/PropertyPicker';
// import '../lib/spreadsheet';

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  applyEvent(event, state, events, root, pencil, formulaEditor, metaToggle);
});

const page = new Page({ strokeAnalyzer: false });
root.adopt(page);
root.currentPage = page;

const gizmo = new Gizmo(page, false);

const pencil = new Pencil();
root.adopt(pencil);

// FORMULA STUFF
const formulaEditor = new FormulaEditor();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).formulaEditor = formulaEditor;
root.adopt(formulaEditor);
formulaEditor.formulaParser = new FormulaParser(page);

const metaToggle = new MetaToggle();
root.adopt(metaToggle);

// gizmoo wiring testing for testing
const _g = gizmo.createTest();

const component = new Component();
page.adopt(component);

// This API seems a bit messy, but maybe fine in practice. Tbd if there is a better way of doing this.
const labelInsideComponent = new LabelToken(component.scope.createLabel("test"));
labelInsideComponent.position = { x: 410, y: 110 };
component.adopt(labelInsideComponent);

onEveryFrame((dt, t) => {
  SVG.clearNow(t);
  constraints.now.clear();

  // Potentially deprecated — consider whether & how these should be migrated to Input.ts
  gizmo.update(events);

  // Tell NativeEvent to handle all events sent from Swift, evaluating Input for each
  events.update();

  constraints.solve(root);

  root.render(dt, t);
});
