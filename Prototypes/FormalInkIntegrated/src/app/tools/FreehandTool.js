import { generatePathFromPoints } from "../Svg";

export default class FreehandTool {
    constructor(page){
        this.page = page;
        this.points = null;
        this.element = null;
    }

    update(events){
        let pencil_down = events.did("pencil", "began");
        if(pencil_down) {
            this.points = [pencil_down.position];
            this.dirty = true;
        }

        let pencil_moves = events.did_all("pencil", "moved");
        pencil_moves.forEach(pencil_move=>{
            this.points.push(pencil_move.position);
            this.dirty = true;
        })

        let pencil_up = events.did("pencil", "ended");
        if(pencil_up) {
            this.page.addFreehandStroke(this.points);
            this.points = null;
            this.element.remove();
            this.element = null;
        }
    }

    render(svg){
        //

        if(this.dirty) {
            if(this.points && !this.element) {
                this.element = svg.addElement("path", {d: "", stroke: "darkgrey", "stroke-width": 2, fill: "none"});
            }

            if(this.element) {
                let path = generatePathFromPoints(this.points)
                svg.updateElement(this.element, {d: path});
            }
        }
    }

}