import Vec from "../lib/vec.js";
export default class ToolPicker {
  constructor(tools) {
    this.tools = tools;
    this.select(tools[0]);
  }
  update(events) {
    const fingerDown = events.did("finger", "began");
    if (fingerDown == null) {
      return;
    }
    const newSelected = this.tools.find((tool) => {
      const center = Vec(tool.buttonX, tool.buttonY);
      return Vec.dist(center, fingerDown.position) < 20;
    });
    if (newSelected == null) {
    } else {
      this.select(newSelected);
    }
  }
  select(t) {
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
