export default class Selection {
    constructor(page){
        this.page = page

        this.selection = {
            points: {},
            strokes: {}
        }
    }

    // TOUCH EVENTS
    touch_down(pos, id, timestamp){
        const found = this.page.find_point_near(pos);
        if(found) {
            this.selection.points[found.id] = found;
        }
    }

    touch_move(pos, id, timestamp){
        
    }

    touch_up(pos, id, timestamp) {
        
    }

    render(ctx) {
        Object.keys(this.selection.points).forEach(key=>{
            let point = this.selection.points[key]
            ctx.fillStyle = "#D2BBF9";
            ctx.beginPath();
            ctx.ellipse(point.pos.x, point.pos.y, 8, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        })
    }
}