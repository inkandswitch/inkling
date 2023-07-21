import Vec from "../lib/vec";
import DrawTool from "./DrawTool";
import GeometryTool from "./GeometryTool";
import Selection from "./Selection";
import Page from "./Page";


export default class App {
    constructor(){
        this.page = new Page();

        this.draw_tool = new DrawTool(this.page);
        this.geometry_tool = new GeometryTool(this.page);

        this.selection = new Selection(this.page);
    }

    update(events){
        // Handle pencil input
        events.pencil.forEach(event => {
            const pos = Vec(event.x, event.y);
            if (event.type === 'began') {
                this.geometry_tool.pen_down(pos);
            } else if (event.type === 'moved') {
                this.geometry_tool.pen_move(pos);
            } else if (event.type === 'ended') {
                this.geometry_tool.pen_up(pos);
            }
        })

        // Handle touch input
        Object.entries(events.touches).forEach(([touchId, events]) => {
            events.forEach(event => {
                const pos = Vec(event.x, event.y);
                if (event.type === 'began') {
                    this.selection.touch_down(pos, touchId, event.timestamp);
                } else if (event.type === 'moved') {
                    this.selection.touch_move(pos, touchId, event.timestamp);
                } else if (event.type === 'ended') {
                    this.selection.touch_up(pos, touchId, event.timestamp);
                }
            })
        })
    }

    render(ctx){
        this.selection.render(ctx)
        this.geometry_tool.render(ctx)
        this.page.render(ctx)
    }
}