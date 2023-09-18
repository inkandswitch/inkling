import { Position } from "../../lib/types";
import Vec from "../../lib/vec";
import SVG from "../Svg";
import Collection from "./Collection";
import COLORS from "./Colors";
import Formula from "./Formula";
import { CreateListSnapAction, SnapAction } from "./SnapActions";

const SNAPZONE = 40;




abstract class Token {
  abstract updateView(): void;
  abstract isPointInside(position: Position): boolean;
}

export default class NumberToken extends Token {
  numericValue: number = 0;
  stringValue: string = "0";

  position: Position = {x: 100, y: 100};
  width: number = 90;
  height: number = 40;

  parent: Collection | Formula | null = null;

  protected boxElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.width, height: this.height,
    rx: 3,
    fill: COLORS.GREY_DARK,
  });

  protected textElement = SVG.add('text', {
    x: this.position.x+5, y: this.position.y + 30,
    fill: COLORS.WHITE,
    "font-size": "30px"
  }, undefined, "1234");

  constructor(value: number = 0) {
    super();
    this.numericValue = value;
    this.stringValue = value.toString();
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

  isPointSnapping(position: Position, other: NumberToken): SnapAction | null {
    // Snap below
    if(
      position.x > this.position.x &&
      position.y > this.position.y + this.height &&
      position.x < this.position.x + this.width &&
      position.y < this.position.y + this.height + SNAPZONE
    ) {
      return new CreateListSnapAction(
        Vec(this.position.x, this.position.y + this.height + 3),
        this,
        other
      )
    }

    // Snap above
    if(
      position.x > this.position.x &&
      position.y > this.position.y - SNAPZONE &&
      position.x < this.position.x + this.width &&
      position.y < this.position.y
    ) {
      return new CreateListSnapAction(
        Vec(this.position.x, this.position.y - SNAPZONE - 3),
        other,
        this
      )
    }

    return null
  }

  updateView(){
    // Update text content
    this.textElement.textContent = this.stringValue;
    this.width = (this.textElement as any).getComputedTextLength()+10;
    
    SVG.update(this.boxElement, {
      x: this.position.x, y: this.position.y,
      width: this.width,
    })

    SVG.update(this.textElement, {
      x: this.position.x + 5, y: this.position.y + 30,
    })
  }
}

