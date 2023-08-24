import Vec from '../lib/vec';
import Events from './NativeEvents';
import Tool from './tools/Tool';

export default class ToolPicker {
  selected?: Tool;

  constructor(private tools: Tool[]) {
    this.select(tools[0]);
  }

  update(events: Events) {
    const fingerDown = events.did('finger', 'began');
    if (!fingerDown) {
      return;
    }

    const newSelected = this.tools.find(tool => {
      const center = Vec(tool.buttonX, tool.buttonY);
      return Vec.dist(center, fingerDown.position) < 20;
    });

    if (!newSelected) {
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
