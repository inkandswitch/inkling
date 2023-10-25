import Events from "./NativeEvents.js";
import Page from "./Page.js";
import SVG from "./Svg.js";
import VarMover from "./VarMover.js";
import * as constraints from "./constraints.js";
import {onEveryFrame} from "../lib/helpers.js";
import * as Input from "./Input.js";
import {root} from "./GameObject.js";
import MetaToggle from "./gui/MetaToggle.js";
const page = new Page();
root.adopt(page);
root.currentPage = page;
const metaToggle = new MetaToggle();
root.adopt(metaToggle);
const events = new Events(metaToggle, (event, state) => {
  Input.applyEvent({
    event,
    state,
    events,
    root,
    page,
    metaToggle,
    pseudo: false,
    pseudoCount: 0,
    pseudoTouches: {}
  });
});
onEveryFrame((dt, t) => {
  SVG.clearNow(t);
  events.update();
  VarMover.update(dt, t);
  constraints.solve(root);
  root.render(dt, t);
  Input.render();
});
