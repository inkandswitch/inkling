import Vec from "../lib/vec";

export default class ToolPicker {
    constructor(svg) {
        this.selected = 0;
        this.dirty = false;

        this.buttons = [
            svg.addElement('circle', { cx: 30, cy: 30, r: 20, fill: 'black' }),
            svg.addElement('circle', { cx: 30, cy: 80, r: 20, fill: 'lightgrey' }),
            svg.addElement('circle', { cx: 30, cy: 130, r: 20, fill: 'lightgrey' }),
        ];
    }

    update(events) {
        const fingerDown = events.did('finger', 'began');
        if (!fingerDown) {
            return;
        }

        const selected = ([30, 80, 130]).findIndex(y => Vec.dist(Vec(30, y), fingerDown.position) < 20);
        if (selected != -1) {
            this.selected = selected;
            this.dirty = true;
        }
    }

   
    render(svg) {
        if (this.dirty) {
            console.log('update');
            this.buttons.forEach((button, i) =>
                svg.updateElement(
                    button,
                    {
                        fill: this.selected == i ? 'black' : 'lightgrey',
                    }
                )
            );

            this.dirty = false;
        }
    }
}