import { Position } from "../../lib/types";
import Vec from "../../lib/vec";
import SVG from "../Svg";
import Collection from "./Collection";
import COLORS from "./Colors";
import Formula from "./Formula";
import { Label } from "./Scope";
import Token from "./Token";

const SNAPZONE = 40;

export default class LabelToken extends Token {
  label: Label;
  parent: Collection | Formula | null = null;

  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: this.height/2,
    fill: COLORS.BLUE,
  });

  constructor(position: Position, label: Label) {
    super();

    this.position = position;
    this.label = label;

    this.width = label.width;

    this.updateView();
  }

  dislodge() {
    if(this.parent == null) return
    this.parent.dislodgeChild(this);
  }

  isPointInside(position: Position): boolean {
    return position.x > this.position.x &&
           position.y > this.position.y &&
           position.x < this.position.x + this.width &&
           position.y < this.position.y + this.height
  }

  midPoint(): Position {
    return {
      x: this.position.x + this.width/2,
      y: this.position.y + this.height/2,
    }
  }

  updateView(){
    // Update text content
    // Reposition Strokes
    SVG.update(this.boxElement, {
      x: this.position.x, y: this.position.y,
      width: this.width,
    })
  }
}

