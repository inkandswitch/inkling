//import Canvas from "./Canvas";
import Page from "./Page";
import Selection from "./Selection";
import SVG from "./Svg";
import ToolPicker from "./ToolPicker";
import FormalTool from "./tools/FormalTool";
import FreehandTool from "./tools/FreehandTool";
import TextTool from "./tools/TextTool";

export default class App {
    constructor() {
        this.svg = new SVG();
        this.page = new Page(this.svg);
                
        this.selection = new Selection(this.page);
        this.tool_picker = new ToolPicker(this.svg);

        this.tools = [
            new FreehandTool(this.page),
            new FormalTool(this.page),
            new TextTool(this.page),
        ];

        // Setup text canvas
        // let a = this.page.addPoint({x: 100, y: 100});
        // let b = this.page.addPoint({x: 200, y: 200});
        // let c = this.page.addPoint({x: 200, y: 100});
        // this.page.addPoint({x: 300, y: 300});
        // this.page.addPoint({x: 400, y: 400});

        // this.page.addLineSegment(a, b);
        // this.page.addLineSegment(b, c);
        // this.page.addLineSegment(c, a);

        
        // let ca = this.page.addPoint({x: 600, y: 100});
        // let cb = this.page.addPoint({x: 500, y: 200});
        // let cc = this.page.addPoint({x: 500, y: 100});

        // this.page.addArcSegment(ca, cb, cc);
    }

    update(events) {
        this.tool_picker.update(events);
        this.tools[this.tool_picker.selected].update(events);

        this.selection.update(events);
    }

    render() {
        this.tool_picker.render(this.svg);
        this.tools[this.tool_picker.selected].render(this.svg);
        this.page.render(this.svg);
    }
}