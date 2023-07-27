export default class TextTool {
    constructor(page, svg) {
        this.page = page;
        this.svg = svg;
        this.points = [];
        this.element = null;
    }

    update(events) {
        const pencilDown = events.did('pencil', 'began');
        if (pencilDown) {
            this.points = [pencilDown.position];
        }

        const pencil_move = events.did('pencil', 'moved');
        if (pencil_move) {
            this.points.push(pencil_move.position);
        }

        const pencil_up = events.did('pencil', 'ended');
        if (pencil_up) {
 
        }
    }

    render(svg) {

    }
}