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
        } else if (newSelected === this.selected) {
            this.selected.onAction();
        } else {
            this.selected = newSelected;
            for (const tool of this.tools) {
                if (tool === newSelected) {
                    tool.onSelected();
                } else {
                    tool.onDeselected();
                }
            }
        }
    }
}