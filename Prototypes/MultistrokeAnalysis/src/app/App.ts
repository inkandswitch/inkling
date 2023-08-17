import EveryFrame from "./EveryFrame";
import Events from "./NativeEvents";
import Page from "./Page";
import Selection from "./FreehandSelection";
import Snaps from "./Snaps";
import SVG from "./Svg";
import ToolPicker from "./ToolPicker";
import FormalTool from "./tools/FormalTool";
import FreehandTool from "./tools/FreehandTool";

const root = document.querySelector("svg") as SVGSVGElement;

const events = new Events();
const svg = new SVG(root);
const page = new Page(svg);
const snaps = new Snaps(page);
//const selection = new Selection(page, snaps);
const selection = new Selection(page);

const tools = [new FreehandTool(svg, 30, 30, page), new FormalTool(svg, 30, 80, page, snaps)];

const toolPicker = new ToolPicker(tools);

EveryFrame(() => {
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  // morphing.update(events);
  selection.update(events);
  events.clear();

  toolPicker.selected?.render(svg);
  snaps.render(svg);
  page.render(svg);
});


window.savePage = _=>{
  console.log("savePage");
  
  let strokes = page.freehandStrokes.map(stroke=>{
    return stroke.points
  })

  window.localStorage.setItem("strokes", JSON.stringify(strokes))
}

window.loadPage = _=>{
  console.log("loadPage");
  
  // let strokes = page.freehandStrokes.map(stroke=>{
  //   return stroke.points
  // })

  let strokes = window.localStorage.getItem("strokes");
  if(strokes) {
    let parsed_strokes = JSON.parse(strokes);
    parsed_strokes.forEach(points=>{
      page.addFreehandStroke(points);
    })
  }
}

window.loadPage()