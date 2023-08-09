import { Events } from "../engine";
import Page from "./Page";
import Selection from "./Selection";
import Snaps from "./Snaps";
import SVG from "./Svg";
import ToolPicker from "./ToolPicker";
import FormalTool from "./tools/FormalTool";
import FreehandTool from "./tools/FreehandTool";
import TextTool from "./tools/TextTool";
import { Tool } from "./tools/Tool";

export default class App {
    svg: SVG;
    page: Page;
    snaps: Snaps;
    selection: Selection;
    tools: Tool[];
    toolPicker: ToolPicker;

    constructor() {
        this.svg = new SVG();
        this.page = new Page(this.svg);
        this.snaps = new Snaps(this.page);

        this.selection = new Selection(this.page, this.snaps);

        this.tools = [
            new FreehandTool(this.svg, 30, 30, this.page),
            new FormalTool(this.svg, 30, 80, this.page, this.snaps),
            new TextTool(this.svg, 30, 130, this.page),
        ];

        this.toolPicker = new ToolPicker(this.tools);
        this.toolPicker.select(this.tools[0]);
    }

    update(events: Events) {
        this.toolPicker.update(events);
        this.toolPicker.selected?.update(events);

        // this.morphing.update(events);
        this.selection.update(events);
    }

    render() {
        this.toolPicker.selected?.render(this.svg);
        this.snaps.render(this.svg);
        this.page.render(this.svg);
    }
}