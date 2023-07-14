import Vec from "../lib/vec";
import DrawTool from "./DrawTool";
import Page from "./Page";


export default class App {
    constructor(){
        this.page = new Page();
        this.draw_tool = new DrawTool(this.page);
    }

    update(events){
        // Handle pencil input
        events.pencil.forEach(event => {
            const pos = Vec(event.x, event.y);
            if (event.type === 'began') {
                this.draw_tool.pen_down(pos);
            } else if (event.type === 'moved') {
                this.draw_tool.pen_move(pos);
            } else if (event.type === 'ended') {
                this.draw_tool.pen_up(pos);
            }
        })

        // Handle touch input
        Object.entries(events.touches).forEach(([touchId, events]) => {
            events.forEach(event => {
                const pos = Vec(event.x, event.y);
                if (event.type === 'began') {
                    this.page.touch_down(pos, touchId, event.timestamp);
                } else if (event.type === 'moved') {
                    this.page.touch_move(pos, touchId, event.timestamp);
                } else if (event.type === 'ended') {
                    this.page.touch_up(pos, touchId, event.timestamp);
                }
            })
        })
    }

    render(ctx){
        this.draw_tool.render(ctx)
        this.page.render(ctx)
    }
}