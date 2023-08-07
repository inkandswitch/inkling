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

        const pencilMove = events.did('pencil', 'moved');
        if (pencilMove) {
            this.points.push(pencilMove.position);
        }

        const pencilUp = events.did('pencil', 'ended');
        if (pencilUp) {
 
        }
    }

    render(svg) {

    }
}