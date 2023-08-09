import Vec from "../lib/vec";
import { Events } from "../engine";
import { Tool } from "./tools/Tool";

export default class ToolPicker {
    selected?: Tool;

    constructor(private tools: Tool[]) {}

    update(events: Events) {
        const fingerDown = events.did('finger', 'began');
        if (fingerDown == null) {
            return;
        }

        const newSelected = this.tools.find(tool => {
            const center = Vec(tool.x, tool.y);
            return Vec.dist(center, fingerDown.position) < 20;
        });

        if (newSelected == null) {
            // the user's finger is not on one of the tool buttons,
            // so do nothing
        } else {
            this.select(newSelected);
        }
    }

    select(t: Tool) {
        if (t === this.selected) {
            t.onAction();
            return;
        }

        this.selected = t;
        for (const tool of this.tools) {
            if (tool === this.selected) {
                tool.onSelected();
            } else {
                tool.onDeselected();
            }
        }
    }
}