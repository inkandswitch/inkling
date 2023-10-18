import Events, { Event, InputState } from './NativeEvents';
import Page from './Page';
import SVG from './Svg';
import * as varMover from './VarMover';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import * as Input from './Input';
import { root } from './GameObject';
// import FormulaParser from './meta/FormulaParser';
import MetaToggle from './gui/MetaToggle';
import Formula from './meta/Formula';
// import Component from './meta/Component';
// import LabelToken from './meta/LabelToken';
// import Stroke from './ink/Stroke';
// import Handle from './ink/Handle';

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  Input.applyEvent({
    event,
    state,
    events,
    root,
    page,
    metaToggle,
    pseudo: false,
    pseudoCount: 0,
    pseudoTouches: {},
  });
});

const page = new Page({ strokeAnalyzer: false });
root.adopt(page);
root.currentPage = page;

// FORMULA STUFF
//formulaEditor.formulaParser = new FormulaParser(page);

const metaToggle = new MetaToggle();
root.adopt(metaToggle);

onEveryFrame((dt, t) => {
  SVG.clearNow(t);

  events.update();
  varMover.update(dt, t);
  constraints.solve(root);
  root.render(dt, t);
  Input.render();
});

/*
 * MESSY TESTING CODE
 * LIVES IN APP, FOR LACK OF HOME
 * KEEP IT DOWN BELOW
 */

// const component = new Component();
// page.adopt(component);

// // This API seems a bit messy, but maybe fine in practice. Tbd if there is a better way of doing this.
// const labelInsideComponent = new LabelToken(
//   component.scope.createLabel('test')
// );
// labelInsideComponent.position = { x: 410, y: 110 };
// component.adopt(labelInsideComponent);

// const stroke = new Stroke();
// component.adopt(stroke);
// stroke.points = [
//   { x: 410, y: 110 },
//   { x: 420, y: 120 },
//   { x: 410, y: 170 },
// ];
// component.updateOutline();

// const stroke = new Stroke();
// component.adopt(stroke);
// stroke.points = [
//   { x: 410, y: 110 },
//   { x: 420, y: 120 },
//   { x: 410, y: 170 },
// ];
// component.updateOutline();

const f = new Formula();
f.position = { x: 400, y: 100 };
//f.editing = true;
page.adopt(f);
