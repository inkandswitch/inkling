import { Position } from "../../lib/types";
import Collection from "./Collection";
import Formula from "./Formula";

export default abstract class Token {
  type: string = "";
  parent: Collection | Formula | null = null;
  position: Position = {x: 0, y: 0};
  width: number = 100;
  height: number = 40;

  abstract updateView(): void;

  isPointInside(position: Position): boolean {
    return position.x > this.position.x &&
           position.y > this.position.y &&
           position.x < this.position.x + this.width &&
           position.y < this.position.y + this.height
  }

  dislodge() {
    if(this.parent == null) return
    return this.parent.dislodgeChild(this);
  }
}

export abstract class TokenGroup extends Token {
  tokens: Array<Token> = [];

  findAtPosition(position: Position) {
    return this.tokens.find(token=>{
      return token.isPointInside(position);
    })
  }

  dislodgeChild(token: Token){
    this.tokens = this.tokens.filter(t => t!= token);
    if(this.tokens.length <= 1) {
      return this;
    } else {
      this.updateView();
      return null;
    }
  }
}
